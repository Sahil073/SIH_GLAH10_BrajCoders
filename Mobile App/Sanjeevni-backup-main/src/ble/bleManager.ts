// =============================================================================
// src/ble/bleManager.ts
// Cross-platform BLE manager supporting Nordic UART Service (NUS).
// Features fully automatic hands-free connection, background auto-reconnect,
// and simulation fallback for Expo Go.
// =============================================================================

import { PermissionsAndroid, Platform } from "react-native";
import { StreamPacketParser } from "./packetParser";
import {
    BleConnectionStatus,
    DiscoveredDevice,
    Esp32Packet,
    RawConsoleLog,
    SensorId,
} from "./types";

// Nordic UART Service (NUS) UUIDs
export const NUS_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
export const NUS_RX_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
export const NUS_TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

declare const require: any;

type PacketCallback = (packet: Esp32Packet) => void;
type StatusCallback = (status: BleConnectionStatus, errorMsg?: string) => void;
type DeviceDiscoveredCallback = (devices: DiscoveredDevice[]) => void;
type LogCallback = (log: RawConsoleLog) => void;

export class BleService {
  private bleManager: any = null;
  private connectedDevice: any = null;
  private isNativeBleAvailable: boolean = false;
  private streamParser = new StreamPacketParser();
  private discoveredDevicesMap: Map<string, DiscoveredDevice> = new Map();

  private onPacketListeners: Set<PacketCallback> = new Set();
  private onStatusListeners: Set<StatusCallback> = new Set();
  private onDevicesListeners: Set<DeviceDiscoveredCallback> = new Set();
  private onLogListeners: Set<LogCallback> = new Set();

  private isAutoConnectEnabled: boolean = true;
  private isConnectingOrConnected: boolean = false;
  private currentStatus: BleConnectionStatus = "disconnected";
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private scanTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private simSeqCounter: number = 0;

  constructor() {
    this.initBleModule();
  }

  private initBleModule(): void {
    try {
      const { BleManager } = require("react-native-ble-plx");
      this.bleManager = new BleManager();
      this.isNativeBleAvailable = true;
      this.log("info", "Native BLE driver initialized.");
    } catch {
      this.isNativeBleAvailable = false;
      this.log(
        "info",
        "Native BLE driver not detected in this runtime (Expo Go mode). Simulation fallback ready.",
      );
    }
  }

  public isBleSupported(): boolean {
    return this.isNativeBleAvailable;
  }

  public getStatus(): BleConnectionStatus {
    return this.currentStatus;
  }

  public getDiscoveredDevices(): DiscoveredDevice[] {
    return Array.from(this.discoveredDevicesMap.values());
  }

  public addPacketListener(cb: PacketCallback): () => void {
    this.onPacketListeners.add(cb);
    return () => {
      this.onPacketListeners.delete(cb);
    };
  }

  public addStatusListener(cb: StatusCallback): () => void {
    this.onStatusListeners.add(cb);
    cb(this.currentStatus);
    return () => {
      this.onStatusListeners.delete(cb);
    };
  }

  public addDevicesListener(cb: DeviceDiscoveredCallback): () => void {
    this.onDevicesListeners.add(cb);
    cb(this.getDiscoveredDevices());
    return () => {
      this.onDevicesListeners.delete(cb);
    };
  }

  public addLogListener(cb: LogCallback): () => void {
    this.onLogListeners.add(cb);
    return () => {
      this.onLogListeners.delete(cb);
    };
  }

  public setCallbacks(
    onPacket: PacketCallback,
    onStatus: StatusCallback,
    onDevices: DeviceDiscoveredCallback,
    onLog: LogCallback,
  ): void {
    this.addPacketListener(onPacket);
    this.addStatusListener(onStatus);
    this.addDevicesListener(onDevices);
    this.addLogListener(onLog);
  }

  private updateStatus(status: BleConnectionStatus, errorMsg?: string): void {
    this.currentStatus = status;
    this.onStatusListeners.forEach((cb) => {
      try {
        cb(status, errorMsg);
      } catch (err) {
        console.error("Error in status callback:", err);
      }
    });
  }

  private notifyDevices(): void {
    const list = Array.from(this.discoveredDevicesMap.values());
    this.onDevicesListeners.forEach((cb) => {
      try {
        cb(list);
      } catch (err) {
        console.error("Error in devices callback:", err);
      }
    });
  }

  private log(type: "rx" | "info" | "error", message: string): void {
    const entry: RawConsoleLog = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString(),
      type,
      message,
    };
    this.onLogListeners.forEach((cb) => {
      try {
        cb(entry);
      } catch (err) {
        console.error("Error in log callback:", err);
      }
    });
  }

  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return true;

    try {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted =
          granted["android.permission.BLUETOOTH_SCAN"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.BLUETOOTH_CONNECT"] ===
            PermissionsAndroid.RESULTS.GRANTED;

        if (!allGranted) {
          this.log("error", "Bluetooth permissions denied.");
        }
        return allGranted;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err: any) {
      this.log("error", `Permissions exception: ${err?.message || err}`);
      return false;
    }
  }

  /**
   * Start automatic background discovery and immediate auto-connection
   */
  public async startAutoConnect(): Promise<void> {
    this.isAutoConnectEnabled = true;

    if (this.isConnectingOrConnected) {
      return;
    }

    if (!this.isNativeBleAvailable) {
      this.log(
        "info",
        "Running in Expo Go — starting simulated auto-stream...",
      );
      this.startSimulation();
      return;
    }

    const hasPerm = await this.requestPermissions();
    if (!hasPerm) {
      this.updateStatus(
        "disconnected",
        "Bluetooth permissions required to connect",
      );
      return;
    }

    this.startScan();
  }

  /**
   * Scan for ESP32 and auto-connect to the first matching peripheral
   */
  public async startScan(): Promise<void> {
    if (this.isConnectingOrConnected) return;

    if (!this.isNativeBleAvailable) {
      this.updateStatus("scanning");
      setTimeout(() => {
        const simDevice: DiscoveredDevice = {
          id: "SIM-ESP32-HUB",
          name: "ESP32_SENSOR_HUB_BLE (Simulated)",
          rssi: -55,
          isSimulated: true,
        };
        this.discoveredDevicesMap.set(simDevice.id, simDevice);
        this.notifyDevices();
        if (this.isAutoConnectEnabled) {
          this.connectToDevice(simDevice.id);
        }
      }, 1000);
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      this.updateStatus("disconnected", "Bluetooth permissions required");
      return;
    }

    this.discoveredDevicesMap.clear();
    this.updateStatus("scanning");
    this.log("info", "Auto-searching for ESP32 BLE peripheral...");

    try {
      this.bleManager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error: any, device: any) => {
          if (error) {
            this.log("error", `Scan error: ${error.message}`);
            this.stopScan();
            this.scheduleReconnect();
            return;
          }

          if (device && (device.name || device.localName)) {
            const name = device.name || device.localName || "";
            const isEsp32 =
              name.toUpperCase().startsWith("ESP32") ||
              name.toUpperCase().includes("SANJEEVNI") ||
              (device.serviceUUIDs &&
                device.serviceUUIDs.some(
                  (u: string) =>
                    u.toLowerCase() === NUS_SERVICE_UUID.toLowerCase(),
                ));

            if (isEsp32) {
              const entry: DiscoveredDevice = {
                id: device.id,
                name,
                rssi: device.rssi,
              };
              this.discoveredDevicesMap.set(device.id, entry);
              this.notifyDevices();

              // AUTOMATIC HANDS-FREE CONNECTION:
              if (this.isAutoConnectEnabled && !this.isConnectingOrConnected) {
                this.log(
                  "info",
                  `Found ${name}! Auto-connecting immediately...`,
                );
                this.connectToDevice(device.id);
              }
            }
          }
        },
      );

      // Timeout scan after 10s and restart if still looking
      if (this.scanTimeoutTimer) clearTimeout(this.scanTimeoutTimer);
      this.scanTimeoutTimer = setTimeout(() => {
        if (!this.isConnectingOrConnected && this.isAutoConnectEnabled) {
          this.stopScan();
          this.scheduleReconnect();
        }
      }, 10000);
    } catch (err: any) {
      this.log("error", `Scan exception: ${err?.message || err}`);
      this.scheduleReconnect();
    }
  }

  public stopScan(): void {
    if (this.scanTimeoutTimer) {
      clearTimeout(this.scanTimeoutTimer);
      this.scanTimeoutTimer = null;
    }
    if (this.isNativeBleAvailable && this.bleManager) {
      try {
        this.bleManager.stopDeviceScan();
      } catch {}
    }
    if (this.currentStatus === "scanning") {
      this.updateStatus("disconnected");
    }
  }

  /**
   * Connect to peripheral, configure MTU, and subscribe to NUS TX notifications
   */
  public async connectToDevice(deviceId: string): Promise<void> {
    this.stopScan();
    this.isConnectingOrConnected = true;
    this.updateStatus("connecting");
    this.log("info", `Establishing BLE link with ${deviceId}...`);

    if (deviceId === "SIM-ESP32-HUB" || !this.isNativeBleAvailable) {
      this.startSimulation();
      return;
    }

    try {
      const device = await this.bleManager.connectToDevice(deviceId, {
        autoConnect: false,
      });
      this.connectedDevice = device;
      this.log("info", `Connected! Requesting MTU 512...`);

      // 1. Request High MTU
      if (Platform.OS === "android") {
        try {
          await device.requestMTU(512);
        } catch {}
      }

      // 2. Discover Services
      await device.discoverAllServicesAndCharacteristics();

      // 3. Monitor Nordic UART TX characteristic
      this.streamParser.reset();
      device.monitorCharacteristicForService(
        NUS_SERVICE_UUID,
        NUS_TX_CHAR_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            this.log("error", `Notification error: ${error.message}`);
            return;
          }

          if (characteristic?.value) {
            const rawChunk = StreamPacketParser.decodeBase64(
              characteristic.value,
            );
            const { packets, rawLines } = this.streamParser.feed(rawChunk);

            for (const line of rawLines) {
              this.log("rx", line);
            }

            for (const packet of packets) {
              this.onPacketListeners.forEach((cb) => {
                try {
                  cb(packet);
                } catch (err) {
                  console.error("Error in packet callback:", err);
                }
              });
            }
          }
        },
      );

      // 4. Handle Disconnect with Automatic Reconnect
      device.onDisconnected((error: any, disconnectedDevice: any) => {
        this.log("info", `ESP32 disconnected. Auto-reconnecting...`);
        this.connectedDevice = null;
        this.isConnectingOrConnected = false;
        this.streamParser.reset();
        this.updateStatus("disconnected");
        this.scheduleReconnect();
      });

      this.updateStatus("connected");
      this.log("info", "Sensor Stream Active (Nordic UART Service)");
    } catch (err: any) {
      this.log("error", `Connection failed: ${err?.message || err}`);
      this.connectedDevice = null;
      this.isConnectingOrConnected = false;
      this.updateStatus("disconnected", err?.message || "Connection failed");
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.isAutoConnectEnabled) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnectingOrConnected) {
        this.log("info", "Auto-reconnecting to ESP32...");
        this.startScan();
      }
    }, 2500);
  }

  public async disconnect(): Promise<void> {
    this.isAutoConnectEnabled = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopSimulation();

    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch {}
      this.connectedDevice = null;
    }

    this.isConnectingOrConnected = false;
    this.streamParser.reset();
    this.updateStatus("disconnected");
    this.log("info", "Disconnected by user.");
  }

  public startSimulation(): void {
    this.stopSimulation();
    this.isConnectingOrConnected = true;
    this.updateStatus("connected");
    this.log("info", "Simulated telemetry active.");

    let simAngle = 0;
    this.simSeqCounter = 0;

    this.simulationInterval = setInterval(() => {
      this.simSeqCounter++;
      const uptime = Date.now();

      const samples: number[] = [];
      const baseBaseline = 1850;
      for (let i = 0; i < 128; i++) {
        simAngle += 0.05;
        const qrs =
          Math.sin(simAngle) > 0.95 ? 650 * Math.sin(simAngle * 10) : 0;
        const noise = (Math.random() - 0.5) * 30;
        const sampleVal = Math.round(
          baseBaseline + 120 * Math.sin(simAngle) + qrs + noise,
        );
        samples.push(Math.max(0, Math.min(4095, sampleVal)));
      }

      const exgPacket: Esp32Packet = {
        v: 1,
        sensor: SensorId.EXG,
        seq: this.simSeqCounter,
        ts: uptime,
        rate: 500,
        samples,
      };

      const adxlPacket: Esp32Packet = {
        v: 1,
        sensor: SensorId.ADXL345,
        seq: this.simSeqCounter,
        ts: uptime,
        data: {
          x: parseFloat((Math.sin(simAngle * 0.3) * 0.8).toFixed(2)),
          y: parseFloat((Math.cos(simAngle * 0.3) * 0.6).toFixed(2)),
          z: parseFloat((9.78 + (Math.random() - 0.5) * 0.1).toFixed(2)),
        },
      };

      this.onPacketListeners.forEach((cb) => {
        try {
          cb(exgPacket);
          cb(adxlPacket);
        } catch {}
      });

      if (this.simSeqCounter % 4 === 0) {
        const dhtPacket: Esp32Packet = {
          v: 1,
          sensor: SensorId.DHT11,
          seq: Math.floor(this.simSeqCounter / 4),
          ts: uptime,
          data: {
            temperature: parseFloat(
              (26.5 + Math.sin(simAngle * 0.1) * 1.5).toFixed(1),
            ),
            humidity: parseFloat(
              (58.0 + Math.cos(simAngle * 0.1) * 3.0).toFixed(1),
            ),
          },
        };
        this.onPacketListeners.forEach((cb) => {
          try {
            cb(dhtPacket);
          } catch {}
        });
      }

      if (this.simSeqCounter % 3 === 0) {
        const mq135Packet: Esp32Packet = {
          v: 1,
          sensor: SensorId.MQ135,
          seq: Math.floor(this.simSeqCounter / 3),
          ts: uptime,
          data: {
            raw: Math.round(1450 + (Math.random() - 0.5) * 80),
          },
        };
        this.onPacketListeners.forEach((cb) => {
          try {
            cb(mq135Packet);
          } catch {}
        });
      }

      if (this.simSeqCounter % 5 === 0) {
        const soilPacket: Esp32Packet = {
          v: 1,
          sensor: SensorId.SOIL_MOISTURE,
          seq: Math.floor(this.simSeqCounter / 5),
          ts: uptime,
          data: {
            raw: Math.round(1820 + (Math.random() - 0.5) * 50),
          },
        };
        this.onPacketListeners.forEach((cb) => {
          try {
            cb(soilPacket);
          } catch {}
        });
      }
    }, 250);
  }

  public stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

export const bleService = new BleService();
