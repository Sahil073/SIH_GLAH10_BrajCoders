// =============================================================================
// src/services/simulatorService.ts
// High-Fidelity Multi-Sensor Simulator & Disaster Scenario Generator
// =============================================================================

import { RawSensorPacket } from "../types/telemetry";

export type DisasterScenario =
  | "NORMAL_REST"
  | "HEAT_WAVE"
  | "HAZARDOUS_AQI"
  | "FALL_IMPACT"
  | "CARDIAC_ARRHYTHMIA"
  | "FLOOD_SATURATION";

export class SimulatorService {
  private isRunning: boolean = false;
  private currentScenario: DisasterScenario = "NORMAL_REST";
  private onPacketCallback: ((packet: RawSensorPacket) => void) | null = null;

  private exgInterval: any = null;
  private adxlInterval: any = null;
  private dhtInterval: any = null;
  private mqInterval: any = null;
  private soilInterval: any = null;

  // Sequences
  private seqExg = 0;
  private seqAdxl = 0;
  private seqDht = 0;
  private seqMq = 0;
  private seqSoil = 0;

  // Synthetic cardiac phase tracker (0.0 to 1.0 per heartbeat)
  private ecgPhase = 0;
  private targetHeartRate = 72;

  // Motion simulation state
  private fallStep = 0;
  private isFallSimulating = false;

  public setOnPacket(cb: (packet: RawSensorPacket) => void): void {
    this.onPacketCallback = cb;
  }

  public setScenario(scenario: DisasterScenario): void {
    this.currentScenario = scenario;
    switch (scenario) {
      case "NORMAL_REST":
        this.targetHeartRate = 72;
        this.isFallSimulating = false;
        break;
      case "HEAT_WAVE":
        this.targetHeartRate = 112; // Elevated cardiac strain under extreme heat
        this.isFallSimulating = false;
        break;
      case "HAZARDOUS_AQI":
        this.targetHeartRate = 84;
        this.isFallSimulating = false;
        break;
      case "CARDIAC_ARRHYTHMIA":
        this.targetHeartRate = 145; // Sudden resting tachycardia
        this.isFallSimulating = false;
        break;
      case "FALL_IMPACT":
        this.triggerFallSequence();
        break;
      case "FLOOD_SATURATION":
        this.targetHeartRate = 76;
        this.isFallSimulating = false;
        break;
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // 1. EXG (500 Hz = 128 samples every 256 ms)
    this.exgInterval = setInterval(() => {
      this.generateExgPacket();
    }, 256);

    // 2. ADXL345 (25 Hz = every 40 ms)
    this.adxlInterval = setInterval(() => {
      this.generateAdxlPacket();
    }, 40);

    // 3. DHT11 (0.5 Hz = every 2000 ms)
    this.dhtInterval = setInterval(() => {
      this.generateDhtPacket();
    }, 2000);

    // 4. MQ135 (1 Hz = every 1000 ms)
    this.mqInterval = setInterval(() => {
      this.generateMqPacket();
    }, 1000);

    // 5. Soil Moisture (0.5 Hz = every 2000 ms)
    this.soilInterval = setInterval(() => {
      this.generateSoilPacket();
    }, 2000);

    // Send initial packets immediately
    this.generateDhtPacket();
    this.generateMqPacket();
    this.generateSoilPacket();
  }

  public stop(): void {
    this.isRunning = false;
    clearInterval(this.exgInterval);
    clearInterval(this.adxlInterval);
    clearInterval(this.dhtInterval);
    clearInterval(this.mqInterval);
    clearInterval(this.soilInterval);
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public getScenario(): DisasterScenario {
    return this.currentScenario;
  }

  /**
   * Generates a 128-sample physiological ECG frame with P-Q-R-S-T complexes
   */
  private generateExgPacket(): void {
    const samples: number[] = [];
    const baseline = 2048;
    const fs = 500;
    const phaseStep = (this.targetHeartRate / 60) / fs;

    for (let i = 0; i < 128; i++) {
      this.ecgPhase = (this.ecgPhase + phaseStep) % 1.0;
      const p = this.ecgPhase;

      let val = baseline;
      // Synthetic ECG morphology:
      if (p > 0.12 && p < 0.22) {
        // P-wave
        val += 80 * Math.sin(((p - 0.12) / 0.10) * Math.PI);
      } else if (p >= 0.28 && p < 0.31) {
        // Q-wave (small negative dip)
        val -= 90 * Math.sin(((p - 0.28) / 0.03) * Math.PI);
      } else if (p >= 0.31 && p < 0.36) {
        // R-peak (sharp positive spike)
        val += 980 * Math.sin(((p - 0.31) / 0.05) * Math.PI);
      } else if (p >= 0.36 && p < 0.40) {
        // S-wave (negative dip)
        val -= 210 * Math.sin(((p - 0.36) / 0.04) * Math.PI);
      } else if (p >= 0.50 && p < 0.70) {
        // T-wave (broad rounded repolarization)
        val += 160 * Math.sin(((p - 0.50) / 0.20) * Math.PI);
      }

      // Small realistic baseline jitter (+/- 8 counts)
      val += (Math.random() - 0.5) * 16;
      samples.push(Math.round(val));
    }

    this.onPacketCallback?.({
      v: 1,
      sensor: 1,
      seq: this.seqExg++,
      ts: Date.now(),
      rate: 500,
      samples,
    });
  }

  /**
   * Generates 25 Hz motion vector
   */
  private generateAdxlPacket(): void {
    let x = 0.05 + (Math.random() - 0.5) * 0.08;
    let y = 0.12 + (Math.random() - 0.5) * 0.08;
    let z = 9.78 + (Math.random() - 0.5) * 0.10;

    if (this.isFallSimulating) {
      this.fallStep++;
      if (this.fallStep < 6) {
        // Phase 1: Freefall (~240ms) -> low-g
        x = 0.2;
        y = 0.3;
        z = 1.2;
      } else if (this.fallStep < 10) {
        // Phase 2: Impact spike (~160ms) -> high-g spike (> 26 m/s^2)
        x = 12.5;
        y = -18.2;
        z = 19.8;
      } else {
        // Phase 3: Stillness on floor
        x = 0.1;
        y = 9.7; // resting on side/chest
        z = 0.2;
        if (this.fallStep > 50) {
          // Keep resting after fall
          this.isFallSimulating = false;
          this.fallStep = 0;
        }
      }
    }

    this.onPacketCallback?.({
      v: 1,
      sensor: 2,
      seq: this.seqAdxl++,
      ts: Date.now(),
      data: {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        z: Math.round(z * 100) / 100,
      },
    });
  }

  private triggerFallSequence(): void {
    this.isFallSimulating = true;
    this.fallStep = 0;
  }

  /**
   * Generates DHT11 Temperature and Humidity (0.5 Hz)
   */
  private generateDhtPacket(): void {
    let temp = 28.5;
    let hum = 54.0;

    if (this.currentScenario === "HEAT_WAVE") {
      // 43.5°C and 72% humidity creates a lethal feels-like Heat Index > 50°C
      temp = 43.5 + (Math.random() - 0.5) * 0.4;
      hum = 72.0 + (Math.random() - 0.5) * 1.5;
    } else if (this.currentScenario === "FLOOD_SATURATION") {
      temp = 29.0;
      hum = 92.0; // High relative humidity during floods
    } else {
      temp = 27.5 + (Math.random() - 0.5) * 0.4;
      hum = 52.0 + (Math.random() - 0.5) * 1.0;
    }

    this.onPacketCallback?.({
      v: 1,
      sensor: 3,
      seq: this.seqDht++,
      ts: Date.now(),
      data: {
        temperature: Math.round(temp * 10) / 10,
        humidity: Math.round(hum * 10) / 10,
      },
    });
  }

  /**
   * Generates MQ135 Air Quality Raw ADC (1 Hz)
   */
  private generateMqPacket(): void {
    let raw = 750; // Clean air baseline (AQI ~40-50)

    if (this.currentScenario === "HAZARDOUS_AQI") {
      // Toxic smog / air pollution event
      raw = 3150 + Math.round((Math.random() - 0.5) * 120); // AQI ~350+
    } else if (this.currentScenario === "HEAT_WAVE") {
      raw = 1450 + Math.round((Math.random() - 0.5) * 60); // Moderate summer haze (AQI ~130)
    } else {
      raw = 720 + Math.round((Math.random() - 0.5) * 40);
    }

    this.onPacketCallback?.({
      v: 1,
      sensor: 4,
      seq: this.seqMq++,
      ts: Date.now(),
      data: { raw },
    });
  }

  /**
   * Generates Soil/Garment Moisture Raw ADC (0.5 Hz)
   */
  private generateSoilPacket(): void {
    let raw = 2950; // Dry garment (air ~3200)

    if (this.currentScenario === "FLOOD_SATURATION") {
      raw = 1150 + Math.round((Math.random() - 0.5) * 50); // Saturated cloth in floodwaters (~90% moisture)
    } else {
      raw = 2900 + Math.round((Math.random() - 0.5) * 80); // ~10-15% normal skin moisture
    }

    this.onPacketCallback?.({
      v: 1,
      sensor: 5,
      seq: this.seqSoil++,
      ts: Date.now(),
      data: { raw },
    });
  }
}

export const simulatorService = new SimulatorService();
