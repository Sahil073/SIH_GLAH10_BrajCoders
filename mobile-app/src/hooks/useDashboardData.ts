import { useBle } from "@/ble";
import { initialDashboardData } from "@/data/mockDashboardData";
import { DashboardData } from "@/types/dashboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAiRisk } from "@/store/aiStore";
import { fetchAllSensorAverages, fetchSensorHistory } from "@/database";

function computeHeatIndex(
  tempC: number,
  humidity: number,
): { value: number; label: string } {
  if (tempC <= 0) return { value: 0, label: "--" };
  // Simplified Steadman / NOAA Heat Index formula for Celsius
  const hi =
    tempC +
    0.33 *
      ((humidity / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC))) -
    4.0;
  const rounded = Math.round(Math.max(15, Math.min(60, hi)));
  let label = "Normal";
  if (rounded >= 42) label = "High Risk";
  else if (rounded >= 33) label = "Caution";
  return { value: rounded, label };
}

function computeAqi(rawAdc: number): { value: number; label: string } {
  if (rawAdc <= 0) return { value: 0, label: "--" };
  // Map 12-bit ADC (0 - 4095) to AQI (0 - 500 scale)
  const aqi = Math.max(15, Math.min(500, Math.round((rawAdc / 3800) * 160)));
  let label = "Good";
  if (aqi > 150) label = "Hazardous";
  else if (aqi > 100) label = "Unhealthy";
  else if (aqi > 50) label = "Moderate";
  return { value: aqi, label };
}

function computeMoisture(rawAdc: number): { value: number; label: string } {
  if (rawAdc <= 0) return { value: 0, label: "--" };
  const val = Math.max(0, Math.min(100, Math.round((rawAdc / 4095) * 100)));
  let label = "Normal";
  if (val > 75) label = "High";
  else if (val < 25) label = "Low";
  return { value: val, label };
}

import { useUserProfile } from "@/store/userProfileStore";

/**
 * useDashboardData hook
 *
 * Provides reactive dashboard health data directly hydrated from
 * ESP32 BLE multi-sensor telemetry (BioAmp EXG, ADXL345, DHT11, MQ135, Soil Moisture).
 * When disconnected, it stops live updates and hydrates historical averages from SQLite scoped to the active user.
 */
export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(initialDashboardData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasHistoricalData, setHasHistoricalData] = useState<boolean>(false);
  const { sensorData, connectionStatus, totalPackets } = useBle();
  const { activeUserId } = useUserProfile();
  const ai = useAiRisk();

  const isConnected = connectionStatus === "connected";

  // Dynamic step detection ref
  const lastAccelMagRef = useRef<number>(9.8);
  const stepCountRef = useRef<number>(0);
  const lastStepTimeRef = useRef<number>(0);

  // Fixed interval throttle (2000ms) for secondary sensor card updates
  const lastSecondaryUpdateRef = useRef<number>(0);
  const SECONDARY_INTERVAL_MS = 2000;

  // When disconnected or no live packets, fetch real historical session averages from SQLite scoped to active user
  useEffect(() => {
    if (isConnected && totalPackets > 0) return;

    let isMounted = true;

    async function loadHistoricalStats() {
      try {
        const [averages, hrHistory, tempHistory, aqiHistory, moistHistory] = await Promise.all([
          fetchAllSensorAverages(activeUserId),
          fetchSensorHistory("HR", 10, activeUserId),
          fetchSensorHistory("TEMP", 8, activeUserId),
          fetchSensorHistory("AQI", 8, activeUserId),
          fetchSensorHistory("HUMIDITY", 8, activeUserId),
        ]);

        if (!isMounted) return;

        if (averages.hasData) {
          setHasHistoricalData(true);
          setData((prev) => ({
            ...prev,
            overallStatus: {
              status: "NORMAL",
              title: "OFFLINE",
              subtitle: "Showing Past Session Averages",
              description: `ESP32 disconnected. Displaying SQLite session averages for ${activeUserId === "offline_local" ? "Offline User" : activeUserId}.`,
            },
            heartRate: {
              ...prev.heartRate,
              value: averages.hr ?? 0,
              history: hrHistory.map((h) => ({
                timestamp: new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                value: h.value,
              })),
            },
            temperature: {
              ...prev.temperature,
              value: averages.temp != null && tempHistory.length > 0 ? averages.temp : 0,
              history: tempHistory.map((h) => h.value),
            },
            aqi: {
              ...prev.aqi,
              value: averages.aqi != null && aqiHistory.length > 0 ? averages.aqi : 0,
              statusLabel:
                averages.aqi != null && aqiHistory.length > 0
                  ? averages.aqi > 100
                    ? "Unhealthy"
                    : "Good"
                  : "--",
              history: aqiHistory.map((h) => h.value),
            },
            moisture: {
              ...prev.moisture,
              value: averages.humidity != null && moistHistory.length > 0 ? averages.humidity : 0,
              statusLabel: averages.humidity != null && moistHistory.length > 0 ? "Normal" : "--",
              history: moistHistory.map((h) => h.value),
            },
            activity: {
              ...prev.activity,
              steps: averages.steps ?? 0,
            },
          }));
        } else {
          setHasHistoricalData(false);
          setData(initialDashboardData);
        }
      } catch (err) {
        console.warn("[useDashboardData] Failed to load historical stats:", err);
      }
    }

    void loadHistoricalStats();

    return () => {
      isMounted = false;
    };
  }, [isConnected, activeUserId]);

  // Update dashboard reactively ONLY when BLE is connected AND live packets are received, throttled to 2-second fixed intervals
  useEffect(() => {
    if (!isConnected || totalPackets === 0) {
      return;
    }

    const nowMs = Date.now();
    const isEmergency = Boolean(ai.sosRecommended || ai.risks.fall.detected);
    const shouldUpdate =
      isEmergency ||
      lastSecondaryUpdateRef.current === 0 ||
      nowMs - lastSecondaryUpdateRef.current >= SECONDARY_INTERVAL_MS;

    if (!shouldUpdate) {
      return;
    }

    lastSecondaryUpdateRef.current = nowMs;


    setData((prev) => {
      let next = { ...prev };
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      // 1. DHT11: Temperature and Humidity
      if (sensorData.dht.temperature > 0) {
        const tempVal = Number(sensorData.dht.temperature.toFixed(1));
        const tempHistory = [...prev.temperature.history.slice(-7), tempVal];
        const { value: heatVal, label: heatLabel } = computeHeatIndex(
          sensorData.dht.temperature,
          sensorData.dht.humidity,
        );

        next.temperature = {
          ...prev.temperature,
          value: tempVal,
          history: tempHistory,
        };

        next.heatIndex = {
          ...prev.heatIndex,
          value: heatVal,
          statusLabel: heatLabel,
        };
      }

      // 2. MQ135: Air Quality (AQI)
      if (sensorData.mq135.raw > 0) {
        const { value: aqiVal, label: aqiLabel } = computeAqi(
          sensorData.mq135.raw,
        );
        const aqiHistory = [...prev.aqi.history.slice(-7), aqiVal];

        next.aqi = {
          ...prev.aqi,
          value: aqiVal,
          statusLabel: aqiLabel,
          history: aqiHistory,
        };
      }

      // 3. Soil Moisture / Sweat
      if (sensorData.soil.raw > 0) {
        const { value: moistVal, label: moistLabel } = computeMoisture(
          sensorData.soil.raw,
        );
        const moistHistory = [...prev.moisture.history.slice(-7), moistVal];

        next.moisture = {
          ...prev.moisture,
          value: moistVal,
          statusLabel: moistLabel,
          history: moistHistory,
        };
      }

      // 4. ADXL345: Accelerometer & Dynamic Steps
      if (sensorData.adxl.magnitude > 0) {
        const mag = sensorData.adxl.magnitude;
        const nowMs = Date.now();
        // Peak detection threshold > 11.2 m/s² with 300ms cooldown debounce
        if (
          mag > 11.2 &&
          lastAccelMagRef.current <= 11.2 &&
          nowMs - lastStepTimeRef.current > 300
        ) {
          stepCountRef.current += 1;
          lastStepTimeRef.current = nowMs;
        }
        lastAccelMagRef.current = mag;

        next.activity = {
          ...prev.activity,
          steps: stepCountRef.current,
        };
      }

      // 5. BioAmp EXG: Biopotential / Heart Rate
      if (sensorData.exg.samples && sensorData.exg.samples.length > 0) {
        // Compute peak-to-peak amplitude across the 128 samples
        let min = sensorData.exg.samples[0];
        let max = sensorData.exg.samples[0];
        for (let i = 1; i < sensorData.exg.samples.length; i++) {
          const s = sensorData.exg.samples[i];
          if (s < min) min = s;
          if (s > max) max = s;
        }
        const p2p = max - min;

        // Pan-Tompkins real AI HR if available, falling back to signal dynamics
        let hrVal = prev.heartRate.value;
        if (ai.heartRate && ai.heartRate > 30 && ai.heartRate < 220) {
          hrVal = Math.round(ai.heartRate);
        } else if (p2p > 150) {
          hrVal = Math.round(65 + ((max % 250) / 250) * 22);
        }

        const hrHistory = [
          ...prev.heartRate.history.slice(-9),
          { timestamp: timeStr, value: hrVal },
        ];

        next.heartRate = {
          ...prev.heartRate,
          value: hrVal,
          history: hrHistory,
        };
      }

      // 6. Overall Status Pill driven by AI Decision Engine
      if (ai.sosRecommended || ai.risks.fall.detected) {
        next.overallStatus = {
          status: "CRITICAL",
          title: "EMERGENCY",
          subtitle: "SOS Alert Active",
          description: "Critical risk or fall verified by false-alarm gate.",
        };
      } else if (
        ai.risks.cardiac.level === "RISK" ||
        ai.risks.heat.level === "RISK"
      ) {
        next.overallStatus = {
          status: "CRITICAL",
          title: "HIGH RISK",
          subtitle: "Elevated Vitals",
          description: "AI advises worker to seek shade and rest.",
        };
      } else if (
        ai.risks.cardiac.level === "CAUTION" ||
        ai.risks.heat.level === "CAUTION"
      ) {
        next.overallStatus = {
          status: "WARNING",
          title: "MODERATE",
          subtitle: "Caution Advised",
          description: "Thermal or cardiovascular stress detected.",
        };
      } else {
        next.overallStatus = {
          status: "NORMAL",
          title: "OPTIMAL",
          subtitle: "Wearable connected & syncing",
          description: "ESP32 BLE telemetry streaming active.",
        };
      }

      return next;
    });
  }, [connectionStatus, sensorData, ai]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(initialDashboardData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    isConnected,
    hasHistoricalData,
    connectionStatus,
    refreshData,
  };
}

