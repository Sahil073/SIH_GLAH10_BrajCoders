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
  private isWebBleAvailable: boolean = false;
  private webDevice: any = null;
  private webGattServer: any = null;
  private webTxChar: any = null;
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

  private monitorSubscription: any = null;
  private disconnectSubscription: any = null;

  constructor() {
    this.initBleModule();
  }

  private cleanupDeviceSubscriptions(): void {
    if (this.monitorSubscription) {
      try {
        this.monitorSubscription.remove();
      } catch {}
      this.monitorSubscription = null;
    }
    if (this.disconnectSubscription) {
      try {
        this.disconnectSubscription.remove();
      } catch {}
      this.disconnectSubscription = null;
    }
  }

  private cleanupWebSubscriptions(): void {
    if (this.webTxChar) {
      try {
        this.webTxChar.stopNotifications();
      } catch {}
      this.webTxChar = null;
    }
    if (this.webGattServer) {
      try {
        this.webGattServer.disconnect();
      } catch {}
      this.webGattServer = null;
    }
    this.webDevice = null;
  }

  private initBleModule(): void {
    // 1. Try React Native BLE PLX driver (for Android / iOS native runtimes)
    try {
      if (Platform.OS !== "web") {
        const { BleManager } = require("react-native-ble-plx");
        this.bleManager = new BleManager();
        this.isNativeBleAvailable = true;
        this.log("info", "Native BLE driver initialized.");
        return;
      }
    } catch {
      this.isNativeBleAvailable = false;
    }

    // 2. Try Web Bluetooth API (for Chrome / Edge on laptop & Android)
    if (typeof navigator !== "undefined" && (navigator as any).bluetooth) {
      this.isWebBleAvailable = true;
      this.log(
        "info",
        "Web Bluetooth API detected. Ready to pair with ESP32_SENSOR_HUB_BLE.",
      );
    } else {
      this.isWebBleAvailable = false;
      this.log("info", "No Bluetooth hardware driver detected in this environment.");
    }
  }

  public isBleSupported(): boolean {
    return this.isNativeBleAvailable || this.isWebBleAvailable;
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
   * Start automatic background discovery and connection to physical ESP32
   */
  public async startAutoConnect(): Promise<void> {
    this.isAutoConnectEnabled = true;

    if (this.isConnectingOrConnected) {
      return;
    }

    if (this.isWebBleAvailable) {
      // In web browsers, Web Bluetooth requires a user gesture.
      // When triggered by user interaction (e.g. Connect button), open the pairing picker.
      await this.connectWebBluetooth();
      return;
    }

    if (!this.isNativeBleAvailable) {
      this.log("info", "No Bluetooth driver detected in this environment.");
      this.updateStatus(
        "disconnected",
        "Bluetooth not supported in this environment",
      );
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
   * Scan for physical ESP32 and connect to the first matching peripheral
   */
  public async startScan(): Promise<void> {
    if (this.isConnectingOrConnected) return;

    if (this.isWebBleAvailable) {
      this.log("info", "Web Bluetooth ready. Tap 'Connect' to open device chooser.");
      return;
    }

    if (!this.isNativeBleAvailable) {
      this.updateStatus(
        "disconnected",
        "Native BLE driver not available in this runtime",
      );
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      this.updateStatus("disconnected", "Bluetooth permissions required");
      return;
    }

    this.discoveredDevicesMap.clear();
    this.updateStatus("scanning");
    this.log("info", "Auto-searching for ESP32_SENSOR_HUB_BLE peripheral...");

    try {
      this.bleManager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error: any, device: any) => {
          if (error) {
            this.log("error", `Scan error: ${error.message}`);
            this.stopScan();
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

              // AUTOMATIC HANDS-FREE CONNECTION TO REAL DEVICE:
              if (this.isAutoConnectEnabled && !this.isConnectingOrConnected) {
                this.log(
                  "info",
                  `Found ${name}! Connecting to real hardware...`,
                );
                this.connectToDevice(device.id);
              }
            }
          }
        },
      );

      // Timeout scan after 10s if no ESP32 is detected
      if (this.scanTimeoutTimer) clearTimeout(this.scanTimeoutTimer);
      this.scanTimeoutTimer = setTimeout(() => {
        if (!this.isConnectingOrConnected) {
          this.stopScan();
          if (this.discoveredDevicesMap.size === 0) {
            this.log("info", "Scan finished: No ESP32 device discovered. Ensure ESP32_SENSOR_HUB_BLE is powered on.");
            this.updateStatus(
              "disconnected",
              "No ESP32 found. Ensure device is powered on.",
            );
          }
        }
      }, 10000);
    } catch (err: any) {
      this.log("error", `Scan exception: ${err?.message || err}`);
      this.updateStatus("disconnected", err?.message || "Scan failed");
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
    this.cleanupDeviceSubscriptions();
    this.cleanupWebSubscriptions();
    this.isConnectingOrConnected = true;
    this.updateStatus("connecting");
    this.log("info", `Establishing BLE link with ${deviceId}...`);

    if (deviceId === "SIM-ESP32-HUB") {
      this.startSimulation();
      return;
    }

    if (this.isWebBleAvailable) {
      await this.connectWebBluetooth();
      return;
    }

    if (!this.isNativeBleAvailable) {
      this.isConnectingOrConnected = false;
      this.updateStatus("disconnected", "Native BLE not available");
      return;
    }

    try {
      const device = await this.bleManager.connectToDevice(deviceId, {
        autoConnect: false,
      });
      this.connectedDevice = device;

      // 1. Discover all services and characteristics FIRST (GATT requirement on Android)
      await device.discoverAllServicesAndCharacteristics();

      // 2. Safely negotiate high MTU after discovery (guarded against native GATT 133)
      if (Platform.OS === "android") {
        try {
          await new Promise((res) => setTimeout(res, 100));
          await device.requestMTU(512);
        } catch {
          // Standard MTU is sufficient; gracefully continue without crashing
        }
      }

      // 3. Monitor Nordic UART TX characteristic
      this.streamParser.reset();
      this.monitorSubscription = device.monitorCharacteristicForService(
        NUS_SERVICE_UUID,
        NUS_TX_CHAR_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            if (!this.connectedDevice) return;
            this.log("error", `Notification error: ${error.message}`);
            return;
          }

          if (characteristic?.value) {
            const rawChunk = StreamPacketParser.decodeBase64(
              characteristic.value,
            );
            const { packets } = this.streamParser.feed(rawChunk);

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

      // 4. Handle Disconnect
      this.disconnectSubscription = device.onDisconnected((error: any) => {
        this.log("info", "ESP32 disconnected.");
        this.cleanupDeviceSubscriptions();
        this.connectedDevice = null;
        this.isConnectingOrConnected = false;
        this.streamParser.reset();
        this.updateStatus("disconnected");
      });

      this.updateStatus("connected");
      this.log("info", "Sensor Stream Active (Nordic UART Service)");
    } catch (err: any) {
      this.log("error", `Connection failed: ${err?.message || err}`);
      this.cleanupDeviceSubscriptions();
      this.connectedDevice = null;
      this.isConnectingOrConnected = false;
      this.updateStatus("disconnected", err?.message || "Connection failed");
    }
  }

  public isWebBluetoothSupported(): boolean {
    return this.isWebBleAvailable;
  }

  /**
   * Connect to ESP32_SENSOR_HUB_BLE using the Web Bluetooth API (Chrome / Edge on Laptop & Mobile)
   */
  public async connectWebBluetooth(): Promise<void> {
    if (typeof navigator === "undefined" || !(navigator as any).bluetooth) {
      const err =
        "Web Bluetooth is not supported in this browser. Please use Google Chrome or Microsoft Edge on Windows/Mac/Android.";
      this.log("error", err);
      this.updateStatus("disconnected", err);
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      const err =
        "Web Bluetooth requires a secure context (http://localhost or https://). Please access via localhost.";
      this.log("error", err);
      this.updateStatus("disconnected", err);
      return;
    }

    // Check adapter availability
    try {
      if ((navigator as any).bluetooth.getAvailability) {
        const available = await (navigator as any).bluetooth.getAvailability();
        if (!available) {
          const err =
            "Bluetooth radio is turned OFF on your computer. Please turn ON Bluetooth in Windows Settings.";
          this.log("error", err);
          this.updateStatus("disconnected", err);
          return;
        }
      }
    } catch {
      // Non-critical check, continue
    }

    this.cleanupWebSubscriptions();
    this.isConnectingOrConnected = true;
    this.updateStatus("connecting");
    this.log("info", "Opening Bluetooth pairing dialog for ESP32_SENSOR_HUB_BLE...");

    try {
      let device: any;
      try {
        // Attempt 1: Filter by ESP32 name prefixes
        device = await (navigator as any).bluetooth.requestDevice({
          filters: [
            { name: "ESP32_SENSOR_HUB_BLE" },
            { namePrefix: "ESP32" },
            { namePrefix: "esp32" },
            { namePrefix: "SANJEEVNI" },
          ],
          optionalServices: [NUS_SERVICE_UUID.toLowerCase()],
        });
      } catch (filterErr: any) {
        // If not found by filter and user didn't cancel, offer acceptAllDevices fallback
        const msg = filterErr?.message || String(filterErr);
        if (filterErr?.name === "NotFoundError" && !msg.includes("cancelled") && !msg.includes("User cancelled")) {
          this.log("info", "No device matched name prefix. Retrying with acceptAllDevices...");
          device = await (navigator as any).bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [NUS_SERVICE_UUID.toLowerCase()],
          });
        } else {
          throw filterErr;
        }
      }

      this.log("info", `Web Bluetooth device selected: ${device.name || device.id}`);
      this.webDevice = device;

      const discovered: DiscoveredDevice = {
        id: device.id || "WEB-ESP32-HUB",
        name: device.name || "ESP32_SENSOR_HUB_BLE",
        rssi: -50,
      };
      this.discoveredDevicesMap.set(discovered.id, discovered);
      this.notifyDevices();

      device.addEventListener("gattserverdisconnected", () => {
        this.log("info", "ESP32 Web Bluetooth connection closed.");
        this.cleanupWebSubscriptions();
        this.isConnectingOrConnected = false;
        this.streamParser.reset();
        this.updateStatus("disconnected");
      });

      this.log("info", "Connecting to GATT Server...");
      const server = await device.gatt.connect();
      this.webGattServer = server;

      this.log("info", "Discovering Nordic UART Service...");
      const service = await server.getPrimaryService(NUS_SERVICE_UUID.toLowerCase());

      this.log("info", "Subscribing to TX notifications...");
      const txChar = await service.getCharacteristic(NUS_TX_CHAR_UUID.toLowerCase());
      this.webTxChar = txChar;

      await txChar.startNotifications();
      txChar.addEventListener("characteristicvaluechanged", (event: any) => {
        const dataView: DataView = event.target.value;
        const decoder = new TextDecoder("utf-8");
        const rawChunk = decoder.decode(dataView);
        const { packets } = this.streamParser.feed(rawChunk);

        for (const packet of packets) {
          this.onPacketListeners.forEach((cb) => {
            try {
              cb(packet);
            } catch (err) {
              console.error("Error in packet callback:", err);
            }
          });
        }
      });

      this.streamParser.reset();
      this.updateStatus("connected");
      this.log("info", `Connected to ${device.name || "ESP32_SENSOR_HUB_BLE"} via Web Bluetooth!`);
    } catch (err: any) {
      this.cleanupWebSubscriptions();
      this.isConnectingOrConnected = false;
      const msg = err?.message || String(err);
      if (msg.includes("User cancelled") || msg.includes("cancelled")) {
        this.log("info", "Bluetooth pairing dialog cancelled by user.");
        this.updateStatus("disconnected");
      } else if (msg.includes("NetworkError") || msg.includes("failed for unknown reason")) {
        const detail =
          "GATT connection failed. If the ESP32 is already connected to another device (e.g. your phone), disconnect it there first.";
        this.log("error", detail);
        this.updateStatus("disconnected", detail);
      } else {
        this.log("error", `Web Bluetooth error: ${msg}`);
        this.updateStatus("disconnected", msg);
      }
    }
  }

  private scheduleReconnect(): void {
    if (!this.isAutoConnectEnabled) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnectingOrConnected && (this.connectedDevice || this.webDevice)) {
        this.log("info", "Auto-reconnecting to ESP32...");
        this.startScan();
      }
    }, 2500);
  }

  public async disconnect(): Promise<void> {
    this.isAutoConnectEnabled = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopSimulation();
    this.cleanupDeviceSubscriptions();
    this.cleanupWebSubscriptions();

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
