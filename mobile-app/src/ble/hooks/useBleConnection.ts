// =============================================================================
// src/ble/hooks/useBleConnection.ts
// High-level presentational hook specifically designed for UI connection screens.
// Insulates UI components from low-level GATT, packet parsing, and Base64 internals.
// =============================================================================

import { useCallback, useMemo } from "react";
import { useBle } from "../bleStore";
import { BleConnectionStatus, DiscoveredDevice } from "../types";

export type UIConnectionStatus = "scanning" | "connecting" | "connected";

export interface UseBleConnectionResult {
  /** High-level UI connection status */
  status: UIConnectionStatus;
  /** Raw connection lifecycle status */
  rawStatus: BleConnectionStatus;
  /** Whether the manager is actively scanning */
  isScanning: boolean;
  /** Whether a device is actively connected */
  isConnected: boolean;
  /** Whether a connection handshake is in progress */
  isConnecting: boolean;
  /** Discovered peripheral devices list */
  discoveredDevices: DiscoveredDevice[];
  /** Currently connected peripheral ID */
  connectedDeviceId: string | null;
  /** Whether running in simulation fallback */
  isSimulating: boolean;
  /** Triggers a device scan */
  startScan: () => Promise<void>;
  /** Stops an ongoing scan */
  stopScan: () => void;
  /** Initiates connection to a specific peripheral ID */
  connectDevice: (deviceId: string) => Promise<void>;
  /** Disconnects from the current device */
  disconnectDevice: () => Promise<void>;
  /** Toggles simulated telemetry on/off */
  toggleSimulation: () => void;
}

/**
 * Clean UI hook for device connection and discovery screens.
 */
export function useBleConnection(): UseBleConnectionResult {
  const {
    connectionStatus,
    discoveredDevices,
    connectedDeviceId,
    isSimulating,
    startScan,
    stopScan,
    connectDevice,
    disconnect,
    toggleSimulation,
  } = useBle();

  const status: UIConnectionStatus = useMemo(() => {
    if (connectionStatus === "connected") return "connected";
    if (connectionStatus === "connecting") return "connecting";
    return "scanning";
  }, [connectionStatus]);

  const isScanning = connectionStatus === "scanning";
  const isConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";

  const handleDisconnect = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

  return {
    status,
    rawStatus: connectionStatus,
    isScanning,
    isConnected,
    isConnecting,
    discoveredDevices,
    connectedDeviceId,
    isSimulating,
    startScan,
    stopScan,
    connectDevice,
    disconnectDevice: handleDisconnect,
    toggleSimulation,
  };
}
