// =============================================================================
// src/ble/bleStore.ts
// Reactive client store for BLE sensor telemetry and connection state.
// Integrates bleService with the application while avoiding duplicate listeners.
// =============================================================================

import { useEffect, useState } from "react";
import { bleService } from "./bleManager";
import {
    BleConnectionStatus,
    DiscoveredDevice,
    Esp32Packet,
    RawConsoleLog,
    SensorId,
    SensorState,
} from "./types";

export const INITIAL_SENSOR_STATE: SensorState = {
  exg: {
    rate: 500,
    latestSample: 0,
    samples: [],
    seq: 0,
    ts: 0,
    lastUpdated: 0,
  },
  adxl: {
    x: 0,
    y: 0,
    z: 0,
    magnitude: 0,
    seq: 0,
    ts: 0,
    lastUpdated: 0,
  },
  dht: {
    temperature: 0,
    humidity: 0,
    seq: 0,
    ts: 0,
    lastUpdated: 0,
  },
  mq135: {
    raw: 0,
    seq: 0,
    ts: 0,
    lastUpdated: 0,
  },
  soil: {
    raw: 0,
    seq: 0,
    ts: 0,
    lastUpdated: 0,
  },
};

export interface BleStoreState {
  connectionStatus: BleConnectionStatus;
  sensorData: SensorState;
  discoveredDevices: DiscoveredDevice[];
  connectedDeviceId: string | null;
  totalPackets: number;
  isSimulating: boolean;
  logs: RawConsoleLog[];
}

let storeState: BleStoreState = {
  connectionStatus: "disconnected",
  sensorData: { ...INITIAL_SENSOR_STATE },
  discoveredDevices: [],
  connectedDeviceId: null,
  totalPackets: 0,
  isSimulating: false,
  logs: [],
};

const stateListeners: Set<(state: BleStoreState) => void> = new Set();

let notifyTimer: ReturnType<typeof setTimeout> | null = null;
let lastNotifyTimestamp = 0;
const THROTTLE_INTERVAL_MS = 100; // ~10 FPS UI updates: buttery smooth vitals, zero JS thread starvation

function notifySubscribersImmediate() {
  if (notifyTimer) {
    clearTimeout(notifyTimer);
    notifyTimer = null;
  }
  lastNotifyTimestamp = Date.now();
  stateListeners.forEach((listener) => {
    try {
      listener(storeState);
    } catch (e) {
      console.error("Error notifying BLE store subscriber:", e);
    }
  });
}

function scheduleThrottledNotify() {
  const now = Date.now();
  const elapsed = now - lastNotifyTimestamp;

  if (elapsed >= THROTTLE_INTERVAL_MS) {
    notifySubscribersImmediate();
  } else if (!notifyTimer) {
    notifyTimer = setTimeout(() => {
      notifySubscribersImmediate();
    }, THROTTLE_INTERVAL_MS - elapsed);
  }
}

function handleIncomingPacket(packet: Esp32Packet) {
  const now = Date.now();
  let nextSensor = { ...storeState.sensorData };

  switch (packet.sensor) {
    case SensorId.EXG: {
      const lastSample =
        packet.samples && packet.samples.length > 0
          ? packet.samples[packet.samples.length - 1]
          : nextSensor.exg.latestSample;

      nextSensor.exg = {
        rate: packet.rate,
        latestSample: lastSample,
        samples: packet.samples,
        seq: packet.seq,
        ts: packet.ts,
        lastUpdated: now,
      };
      break;
    }

    case SensorId.ADXL345: {
      const { x, y, z } = packet.data;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      nextSensor.adxl = {
        x,
        y,
        z,
        magnitude,
        seq: packet.seq,
        ts: packet.ts,
        lastUpdated: now,
      };
      break;
    }

    case SensorId.DHT11: {
      nextSensor.dht = {
        temperature: packet.data.temperature,
        humidity: packet.data.humidity,
        seq: packet.seq,
        ts: packet.ts,
        lastUpdated: now,
      };
      break;
    }

    case SensorId.MQ135: {
      nextSensor.mq135 = {
        raw: packet.data.raw,
        seq: packet.seq,
        ts: packet.ts,
        lastUpdated: now,
      };
      break;
    }

    case SensorId.SOIL_MOISTURE: {
      nextSensor.soil = {
        raw: packet.data.raw,
        seq: packet.seq,
        ts: packet.ts,
        lastUpdated: now,
      };
      break;
    }
  }

  storeState = {
    ...storeState,
    sensorData: nextSensor,
    totalPackets: storeState.totalPackets + 1,
  };
  scheduleThrottledNotify();
}

function handleStatusChange(status: BleConnectionStatus) {
  storeState = {
    ...storeState,
    connectionStatus: status,
    isSimulating: status === "connected" ? storeState.isSimulating : false,
    connectedDeviceId:
      status === "disconnected" ? null : storeState.connectedDeviceId,
    sensorData:
      status === "disconnected" ? { ...INITIAL_SENSOR_STATE } : storeState.sensorData,
    totalPackets:
      status === "disconnected" ? 0 : storeState.totalPackets,
    discoveredDevices:
      status === "disconnected" ? [] : storeState.discoveredDevices,
  };
  notifySubscribersImmediate();
}

function handleDiscoveredDevices(devices: DiscoveredDevice[]) {
  storeState = {
    ...storeState,
    discoveredDevices: devices,
  };
  scheduleThrottledNotify();
}

function handleNewLog(log: RawConsoleLog) {
  // Cap logs array to 50 items to keep memory lightweight
  storeState = {
    ...storeState,
    logs: [log, ...storeState.logs.slice(0, 49)],
  };
  scheduleThrottledNotify();
}

// Register global listeners once with bleService
bleService.addPacketListener(handleIncomingPacket);
bleService.addStatusListener(handleStatusChange);
bleService.addDevicesListener(handleDiscoveredDevices);
bleService.addLogListener(handleNewLog);

export const bleActions = {
  startScan: async () => {
    await bleService.startScan();
  },
  stopScan: () => {
    bleService.stopScan();
  },
  connectDevice: async (deviceId: string) => {
    storeState = {
      ...storeState,
      connectedDeviceId: deviceId,
      isSimulating: deviceId === "SIM-ESP32-HUB",
    };
    notifySubscribersImmediate();
    await bleService.connectToDevice(deviceId);
  },
  disconnect: async () => {
    storeState = {
      ...storeState,
      isSimulating: false,
      connectedDeviceId: null,
    };
    notifySubscribersImmediate();
    await bleService.disconnect();
  },
  startAutoConnect: async () => {
    await bleService.startAutoConnect();
  },
  toggleSimulation: () => {
    if (storeState.isSimulating) {
      storeState = { ...storeState, isSimulating: false };
      bleService.stopSimulation();
      bleService.disconnect();
    } else {
      storeState = { ...storeState, isSimulating: true };
      bleService.startSimulation();
    }
    notifySubscribersImmediate();
  },
  clearLogs: () => {
    storeState = { ...storeState, logs: [] };
    notifySubscribersImmediate();
  },
};

/**
 * Hook to consume BLE state reactively anywhere in the app
 */
export function useBle() {
  const [state, setState] = useState<BleStoreState>(storeState);

  useEffect(() => {
    const listener = (next: BleStoreState) => {
      setState(next);
    };
    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
    };
  }, []);

  return {
    ...state,
    ...bleActions,
  };
}

export function getBleState(): BleStoreState {
  return storeState;
}
