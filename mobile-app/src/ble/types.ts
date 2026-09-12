// =============================================================================
// src/ble/types.ts
// Authoritative data contracts for ESP32 BLE Sensor Hub packets, telemetry state,
// device models, and connection lifecycle.
// =============================================================================

export enum SensorId {
  EXG = 1,
  ADXL345 = 2,
  DHT11 = 3,
  MQ135 = 4,
  SOIL_MOISTURE = 5,
}

export interface BasePacket {
  v: number;
  sensor: SensorId;
  seq: number;
  ts: number;
}

export interface ExgPacket extends BasePacket {
  sensor: SensorId.EXG;
  rate: number;
  samples: number[];
}

export interface AdxlPacket extends BasePacket {
  sensor: SensorId.ADXL345;
  data: {
    x: number;
    y: number;
    z: number;
  };
}

export interface DhtPacket extends BasePacket {
  sensor: SensorId.DHT11;
  data: {
    temperature: number;
    humidity: number;
  };
}

export interface Mq135Packet extends BasePacket {
  sensor: SensorId.MQ135;
  data: {
    raw: number;
  };
}

export interface SoilPacket extends BasePacket {
  sensor: SensorId.SOIL_MOISTURE;
  data: {
    raw: number;
  };
}

export type Esp32Packet =
  | ExgPacket
  | AdxlPacket
  | DhtPacket
  | Mq135Packet
  | SoilPacket;

export interface SensorState {
  exg: {
    rate: number;
    latestSample: number;
    samples: number[];
    seq: number;
    ts: number;
    lastUpdated: number;
  };
  adxl: {
    x: number;
    y: number;
    z: number;
    magnitude: number;
    seq: number;
    ts: number;
    lastUpdated: number;
  };
  dht: {
    temperature: number;
    humidity: number;
    seq: number;
    ts: number;
    lastUpdated: number;
  };
  mq135: {
    raw: number;
    seq: number;
    ts: number;
    lastUpdated: number;
  };
  soil: {
    raw: number;
    seq: number;
    ts: number;
    lastUpdated: number;
  };
}

export type BleConnectionStatus =
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected"
  | "unsupported";

export interface DiscoveredDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  isSimulated?: boolean;
}

export interface RawConsoleLog {
  id: string;
  time: string;
  type: "rx" | "info" | "error";
  message: string;
}
