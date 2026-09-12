// =============================================================================
// src/services/aiBridge.ts
// Real-time telemetry ingestion bridge:
// Connects ESP32 BLE packet stream -> DSP & AI Pipeline -> Reactive Store -> SQLite DB
// =============================================================================

import { bleService } from "../ble/bleManager";
import { Esp32Packet, SensorId } from "../ble/types";
import { processSensorTick, resetAIEngine } from "../../ai-engine";
import type { SensorTickInput, SanjeevniRiskOutput } from "../../ai-engine/types";
import { setAiOutput, INITIAL_AI_STATE } from "../store/aiStore";
import { safeInsertReading, safeInsertAlert } from "../database";
import { getActiveUserId } from "../store/userProfileStore";

/**
 * Configuration for the AI Ingestion Bridge
 */
const ECG_ROLLING_BUFFER_SIZE = 2000; // ~4 seconds at 500 Hz
const AI_PROCESS_INTERVAL_MS = 500;   // Process AI tick every 500ms
const DB_LOG_INTERVAL_MS = 4000;      // Persist telemetry to SQLite every 4 seconds
const ALERT_COOLDOWN_MS = 30000;      // Debounce repeated alert insertions by 30s

class AIBridgeService {
  private ecgBuffer: number[] = [];
  private lastAccel = { x: 0, y: 0, z: 1.0 }; // Default ~1g stationary
  private lastDht = { temperature: 28.0, humidity: 50.0 };
  private lastMq135 = 450;
  private lastProcessTime = 0;
  private lastDbLogTime = 0;
  private lastAlertTimes: Record<string, number> = {};
  private isRunning = false;
  private wasConnected = false;
  private unsubscribeBle: (() => void) | null = null;
  private unsubscribeStatus: (() => void) | null = null;

  /**
   * Starts the AI bridge, listening to the live BLE stream.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.unsubscribeBle = bleService.addPacketListener((packet: Esp32Packet) => {
      this.handlePacket(packet);
    });

    this.unsubscribeStatus = bleService.addStatusListener((status) => {
      if (status === "connected") {
        this.wasConnected = true;
      } else if (this.wasConnected) {
        this.wasConnected = false;
        this.reset();
      }
    });

    console.log("[AIBridge] Bridge started. Listening to BLE telemetry.");
  }

  /**
   * Stops the AI bridge.
   */
  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.unsubscribeBle) {
      this.unsubscribeBle();
      this.unsubscribeBle = null;
    }

    if (this.unsubscribeStatus) {
      this.unsubscribeStatus();
      this.unsubscribeStatus = null;
    }

    console.log("[AIBridge] Bridge stopped.");
  }

  /**
   * Resets internal rolling buffers, AI state, and triggers AI engine reset.
   */
  public reset(): void {
    this.ecgBuffer = [];
    this.lastAccel = { x: 0, y: 0, z: 1.0 };
    this.lastDht = { temperature: 28.0, humidity: 50.0 };
    this.lastMq135 = 450;
    this.lastProcessTime = 0;
    this.lastDbLogTime = 0;
    this.lastAlertTimes = {};
    resetAIEngine();
    setAiOutput(INITIAL_AI_STATE);
    console.log("[AIBridge] AI Bridge & Engine reset.");
  }

  /**
   * Ingests a validated ESP32 packet from the BLE stream.
   */
  private handlePacket(packet: Esp32Packet): void {
    const now = Date.now();

    switch (packet.sensor) {
      case SensorId.EXG: {
        if (packet.samples && packet.samples.length > 0) {
          // Append incoming 128 samples to sliding rolling window
          this.ecgBuffer.push(...packet.samples);
          if (this.ecgBuffer.length > ECG_ROLLING_BUFFER_SIZE) {
            this.ecgBuffer = this.ecgBuffer.slice(-ECG_ROLLING_BUFFER_SIZE);
          }
        }
        break;
      }

      case SensorId.ADXL345: {
        // ADXL345 reports m/s²; AI engine expects acceleration in g units (1g ≈ 9.80665 m/s²)
        const GRAVITY = 9.80665;
        this.lastAccel = {
          x: packet.data.x / GRAVITY,
          y: packet.data.y / GRAVITY,
          z: packet.data.z / GRAVITY,
        };
        break;
      }

      case SensorId.DHT11: {
        if (packet.data.temperature > 0) {
          this.lastDht.temperature = packet.data.temperature;
        }
        if (packet.data.humidity > 0) {
          this.lastDht.humidity = packet.data.humidity;
        }
        break;
      }

      case SensorId.MQ135: {
        if (packet.data.raw > 0) {
          this.lastMq135 = packet.data.raw;
        }
        break;
      }
    }

    // Trigger AI evaluation if process interval has elapsed
    if (now - this.lastProcessTime >= AI_PROCESS_INTERVAL_MS) {
      this.lastProcessTime = now;
      this.executeAiTick(now);
    }
  }

  /**
   * Constructs SensorTickInput, evaluates AI algorithms, updates AI store, and handles DB logging.
   */
  private executeAiTick(now: number): void {
    try {
      const durationMs = (this.ecgBuffer.length / 500) * 1000;
      const input: SensorTickInput = {
        userId: getActiveUserId(),
        timestamp: now,
        ecg:
          this.ecgBuffer.length >= 250
            ? {
                samples: [...this.ecgBuffer],
                sampleRate: 500,
                timestampStart: now - durationMs,
                timestampEnd: now,
              }
            : undefined,
        motion: {
          accel: [{ ...this.lastAccel }],
          gyro: [],
          sampleRate: 50,
          timestamp: now,
        },
        environment: {
          tempC: this.lastDht.temperature,
          humidityPct: this.lastDht.humidity,
          mq135Raw: this.lastMq135,
          apiAQI: null,
          apiWeather: null,
          timestamp: now,
        },
      };

      const output: SanjeevniRiskOutput = processSensorTick(input);

      // 1. Update reactive AI store for UI subscribers
      setAiOutput(output);

      // 2. Persist periodic telemetry to SQLite database
      if (now - this.lastDbLogTime >= DB_LOG_INTERVAL_MS) {
        this.lastDbLogTime = now;
        this.logTelemetryToDb(output);
      }

      // 3. Evaluate and persist emergency / high-priority alerts
      this.evaluateAlertTriggers(output, now);
    } catch (err) {
      console.error("[AIBridge] Error during AI tick execution:", err);
    }
  }

  /**
   * Persists health readings to the local SQLite database.
   */
  private logTelemetryToDb(output: SanjeevniRiskOutput): void {
    const uid = getActiveUserId();

    if (output.heartRate && output.heartRate > 30 && output.heartRate < 240) {
      safeInsertReading("HR", Math.round(output.heartRate), "garment", uid);
    }

    if (output.environment.temperature && output.environment.temperature > 0) {
      safeInsertReading("TEMP", Number(output.environment.temperature.toFixed(1)), "garment", uid);
    }

    if (output.environment.humidity && output.environment.humidity > 0) {
      safeInsertReading("HUMIDITY", Number(output.environment.humidity.toFixed(1)), "garment", uid);
    }

    if (output.environment.aqi && output.environment.aqi > 0) {
      safeInsertReading("AQI", Math.round(output.environment.aqi), "garment", uid);
    }

    if (output.hrv) {
      if (output.hrv.rmssd != null && output.hrv.rmssd > 0) {
        safeInsertReading("HRV_RMSSD", Number(output.hrv.rmssd.toFixed(2)), "garment", uid);
      }
      if (output.hrv.sdnn != null && output.hrv.sdnn > 0) {
        safeInsertReading("HRV_SDNN", Number(output.hrv.sdnn.toFixed(2)), "garment", uid);
      }
    }
  }

  /**
   * Checks for critical risk conditions and logs alerts to SQLite.
   */
  private evaluateAlertTriggers(output: SanjeevniRiskOutput, now: number): void {
    const uid = getActiveUserId();
    const shouldFireAlert = (category: string) => {
      const last = this.lastAlertTimes[category] || 0;
      if (now - last >= ALERT_COOLDOWN_MS) {
        this.lastAlertTimes[category] = now;
        return true;
      }
      return false;
    };

    // SOS Recommended (verified fall or critical sustained cardiac risk)
    if (output.sosRecommended && shouldFireAlert("SOS")) {
      safeInsertAlert(
        "CARDIAC",
        "CRITICAL",
        "Emergency SOS recommended: Sustained critical risk detected. Immediate attention requested.",
        uid
      );
    }

    // Fall Detection
    if (output.risks.fall.detected && shouldFireAlert("FALL")) {
      safeInsertAlert(
        "FALL",
        "CRITICAL",
        `Fall event detected (Confidence: ${(output.risks.fall.confidence * 100).toFixed(0)}%). Check worker status.`,
        uid
      );
    }

    // Heat Risk
    if (output.risks.heat.level === "RISK" && shouldFireAlert("HEAT")) {
      safeInsertAlert(
        "HEAT",
        "HIGH",
        `Extreme Heat Index detected (${output.environment.heatIndex?.toFixed(1) ?? "39"}°C). High risk of heat illness. Seek shade and hydrate.`,
        uid
      );
    }

    // Cardiac Risk
    if (output.risks.cardiac.level === "RISK" && shouldFireAlert("CARDIAC")) {
      safeInsertAlert(
        "CARDIAC",
        "HIGH",
        `Cardiac anomaly detected (HR: ${output.heartRate?.toFixed(0) ?? "abnormal"} BPM). Worker advised to rest.`,
        uid
      );
    }
  }
}

export const aiBridge = new AIBridgeService();

