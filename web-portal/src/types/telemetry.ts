// =============================================================================
// src/types/telemetry.ts
// Shared Telemetry and Disaster Resilience Types for Sanjeevni Web Portal
// =============================================================================

export type ActivityState = "REST" | "LIGHT" | "ACTIVE" | "VIGOROUS";
export type RiskLevel = "NORMAL" | "CAUTION" | "HIGH" | "CRITICAL";
export type FallStage = "NONE" | "FREEFALL" | "IMPACT" | "CONFIRMED";
export type SQILabel = "EXCELLENT" | "GOOD" | "USABLE" | "NOISY" | "INVALID";

export interface RawExgPacket {
  v: number;
  sensor: 1;
  seq: number;
  ts: number;
  rate: number;
  samples: number[];
}

export interface RawAdxlPacket {
  v: number;
  sensor: 2;
  seq: number;
  ts: number;
  data: {
    x: number;
    y: number;
    z: number;
  };
}

export interface RawDhtPacket {
  v: number;
  sensor: 3;
  seq: number;
  ts: number;
  data: {
    temperature: number;
    humidity: number;
  };
}

export interface RawMq135Packet {
  v: number;
  sensor: 4;
  seq: number;
  ts: number;
  data: {
    raw: number;
  };
}

export interface RawSoilPacket {
  v: number;
  sensor: 5;
  seq: number;
  ts: number;
  data: {
    raw: number;
  };
}

export type RawSensorPacket =
  | RawExgPacket
  | RawAdxlPacket
  | RawDhtPacket
  | RawMq135Packet
  | RawSoilPacket;

// Processed Live Vitals State
export interface LiveVitals {
  heartRate: number;              // BPM (from Pan-Tompkins QRS)
  rrIntervalMs: number;          // Beat-to-beat RR interval in ms
  hrvRmssd: number;              // RMSSD in ms
  hrvSdnn: number;               // SDNN in ms
  sqi: {
    label: SQILabel;
    score: number;               // 0.0 - 1.0
  };
  temperatureC: number;          // DHT11 ambient temp in °C
  humidityPct: number;           // DHT11 relative humidity in %
  heatIndexC: number;            // Rothfusz Heat Index in °C
  rawMq135: number;              // Raw gas sensor ADC
  calculatedAqi: number;         // Calibrated CPCB AQI value
  aqiCategory: "Good" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  rawSoilMoisture: number;       // Raw soil/moisture ADC
  moisturePercent: number;       // Estimated moisture %
  motion: {
    x: number;
    y: number;
    z: number;
    magnitude: number;           // Total vector magnitude in m/s^2
    activity: ActivityState;
    fallDetected: boolean;
    fallStage: FallStage;
    fallConfidence: number;
  };
  lastPacketTs: number;
  packetsReceived: number;
}

// Disaster Alert Data
export interface DisasterAlert {
  id: string;
  category: "HEAT_WAVE" | "AIR_POLLUTION" | "FLOOD_DAMPNESS" | "CARDIAC_ANOMALY" | "FALL_EVENT";
  severity: RiskLevel;
  title: string;
  description: string;
  actionableGuidance: string;
  timestamp: number;
  active: boolean;
}

// User Vulnerability Profile
export type VulnerabilityProfile = "STANDARD" | "OUTDOOR_WORKER" | "ELDERLY" | "CHRONIC_CARDIAC";

export interface UserProfile {
  name: string;
  age: number;
  profileType: VulnerabilityProfile;
  restingHrBaseline: number;
  dailyWaterIntakeLiters: number;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// AI Assistant Chat Message
export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: number;
  contextSnippet?: string;
}
