// =============================================================================
// App.tsx
// Main application entry point for Sanjeevni BLE Telemetry Monitor
// Hands-free auto-connect and offline Bluetooth operation
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import {
  SensorState,
  SensorId,
  Esp32Packet,
  BleConnectionStatus,
  DiscoveredDevice,
  RawConsoleLog,
} from './src/types/sensors';
import { bleService } from './src/services/bleManager';
import { Header } from './src/components/Header';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DeviceScannerModal } from './src/components/DeviceScannerModal';
import { RawConsoleModal } from './src/components/RawConsoleModal';

const INITIAL_SENSOR_STATE: SensorState = {
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

export default function App() {
  const [connectionStatus, setConnectionStatus] =
    useState<BleConnectionStatus>('disconnected');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [consoleVisible, setConsoleVisible] = useState<boolean>(false);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [sensorState, setSensorState] =
    useState<SensorState>(INITIAL_SENSOR_STATE);
  const [totalPackets, setTotalPackets] = useState<number>(0);
  const [logs, setLogs] = useState<RawConsoleLog[]>([]);

  // Dispatch incoming packet to respective sensor slice
  const handleIncomingPacket = useCallback((packet: Esp32Packet) => {
    setTotalPackets((prev) => prev + 1);

    setSensorState((prev) => {
      const now = Date.now();
      switch (packet.sensor) {
        case SensorId.EXG: {
          const lastSample =
            packet.samples && packet.samples.length > 0
              ? packet.samples[packet.samples.length - 1]
              : prev.exg.latestSample;

          return {
            ...prev,
            exg: {
              rate: packet.rate,
              latestSample: lastSample,
              samples: packet.samples,
              seq: packet.seq,
              ts: packet.ts,
              lastUpdated: now,
            },
          };
        }

        case SensorId.ADXL345: {
          const { x, y, z } = packet.data;
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          return {
            ...prev,
            adxl: {
              x,
              y,
              z,
              magnitude,
              seq: packet.seq,
              ts: packet.ts,
              lastUpdated: now,
            },
          };
        }

        case SensorId.DHT11: {
          return {
            ...prev,
            dht: {
              temperature: packet.data.temperature,
              humidity: packet.data.humidity,
              seq: packet.seq,
              ts: packet.ts,
              lastUpdated: now,
            },
          };
        }

        case SensorId.MQ135: {
          return {
            ...prev,
            mq135: {
              raw: packet.data.raw,
              seq: packet.seq,
              ts: packet.ts,
              lastUpdated: now,
            },
          };
        }

        case SensorId.SOIL_MOISTURE: {
          return {
            ...prev,
            soil: {
              raw: packet.data.raw,
              seq: packet.seq,
              ts: packet.ts,
              lastUpdated: now,
            },
          };
        }

        default:
          return prev;
      }
    });
  }, []);

  const handleStatusChange = useCallback(
    (status: BleConnectionStatus, errorMsg?: string) => {
      setConnectionStatus(status);
      if (status === 'disconnected') {
        setIsSimulating(false);
      }
    },
    []
  );

  const handleDiscoveredDevices = useCallback((deviceList: DiscoveredDevice[]) => {
    setDevices(deviceList);
  }, []);

  const handleNewLog = useCallback((logEntry: RawConsoleLog) => {
    setLogs((prev) => [logEntry, ...prev.slice(0, 99)]);
  }, []);

  // Setup callbacks & trigger hands-free auto-connect on mount
  useEffect(() => {
    bleService.setCallbacks(
      handleIncomingPacket,
      handleStatusChange,
      handleDiscoveredDevices,
      handleNewLog
    );

    // Auto-connect to ESP32 immediately on app startup
    bleService.startAutoConnect();

    return () => {
      bleService.disconnect();
    };
  }, [
    handleIncomingPacket,
    handleStatusChange,
    handleDiscoveredDevices,
    handleNewLog,
  ]);

  const openScanner = () => {
    setScannerVisible(true);
    bleService.startScan();
  };

  const handleConnectDevice = async (deviceId: string) => {
    setScannerVisible(false);
    if (deviceId === 'SIM-ESP32-HUB') {
      setIsSimulating(true);
    }
    await bleService.connectToDevice(deviceId);
  };

  const handleDisconnect = async () => {
    setIsSimulating(false);
    await bleService.disconnect();
  };

  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      bleService.stopSimulation();
      setConnectionStatus('disconnected');
    } else {
      setIsSimulating(true);
      bleService.startSimulation();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top App Bar */}
      <Header
        status={connectionStatus}
        isSimulating={isSimulating}
        onOpenScanner={openScanner}
        onDisconnect={handleDisconnect}
        onOpenLogs={() => setConsoleVisible(true)}
        onToggleSimulation={toggleSimulation}
      />

      {/* Main Multi-Sensor Dashboard */}
      <DashboardScreen
        sensorData={sensorState}
        connectionStatus={connectionStatus}
        totalPackets={totalPackets}
        onOpenScanner={openScanner}
      />

      {/* BLE Device Discovery Modal */}
      <DeviceScannerModal
        visible={scannerVisible}
        isScanning={connectionStatus === 'scanning'}
        devices={devices}
        isNativeBleAvailable={bleService.isBleSupported()}
        onClose={() => {
          setScannerVisible(false);
          bleService.stopScan();
        }}
        onRefreshScan={() => bleService.startScan()}
        onSelectDevice={handleConnectDevice}
      />

      {/* Live Raw Terminal Modal */}
      <RawConsoleModal
        visible={consoleVisible}
        logs={logs}
        onClose={() => setConsoleVisible(false)}
        onClear={() => setLogs([])}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
