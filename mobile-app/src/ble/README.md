# Sanjeevni BLE / Hardware Communication Module

> **Sub-repo integration guide for [SIH_GLAH10_BrajCoders](https://github.com/Sahil073/SIH_GLAH10_BrajCoders)**  
> This module encapsulates the complete Bluetooth Low Energy (BLE 4.2 / 5.0) communication pipeline between the ESP32 Sensor Hub and the Sanjeevni React Native mobile app.

---

## 📁 Architecture & File Layout

```text
src/ble/
├── index.ts                 # Public barrel export for the entire BLE module
├── types.ts                 # Authoritative contracts for Sensors 1–5 & BLE state
├── packetParser.ts          # Stream reassembly buffer, Base64 decoding, JSON/CSV parser
├── bleManager.ts            # Nordic UART Service (NUS) driver, auto-reconnect, simulation
├── bleStore.ts              # Reactive Zustand-like state store & useBle hook
├── hooks/
│   └── useBleConnection.ts  # Clean presentational hook for UI screens
└── README.md                # This integration document
```

---

## 🔌 Hardware Protocol Specification

- **GATT Service:** Nordic UART Service (NUS)
  - **Service UUID:** `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
  - **RX Characteristic (Write):** `6E400002-B5A3-F393-E0A9-E50E24DCCA9E`
  - **TX Characteristic (Notify):** `6E400003-B5A3-F393-E0A9-E50E24DCCA9E`
- **Framing:** Newline-delimited (`\n`) JSON packets conforming to schema version 1 (`"v": 1`).
- **Chunking:** The ESP32 firmware breaks high-frequency payloads (e.g. BioAmp EXG 128 samples) into chunks. `StreamPacketParser` safely reassembles them across chunk boundaries before parsing.

### Supported Sensors

| Sensor ID | Sensor Name         | Telemetry Payload                                       |
| :-------- | :------------------ | :------------------------------------------------------ |
| `1`       | **BioAmp EXG Pill** | `samples: number[]` (128 integers @ 500 Hz for ECG/EMG) |
| `2`       | **ADXL345**         | `data: { x, y, z }` (3-axis acceleration in $m/s^2$)    |
| `3`       | **DHT11**           | `data: { temperature, humidity }` (°C and % RH)         |
| `4`       | **MQ135**           | `data: { raw }` (12-bit ADC air quality reading)        |
| `5`       | **Soil Moisture**   | `data: { raw }` (12-bit ADC galvanic/sweat moisture)    |

---

## 🛠️ Required Dependencies in Upstream Repo

Ensure the following packages are in `package.json`:

```json
{
  "dependencies": {
    "react-native-ble-plx": "^3.2.1",
    "base-64": "^1.0.0"
  },
  "devDependencies": {
    "@types/base-64": "^1.0.2"
  }
}
```

### Android Permissions (`app.json`)

```json
{
  "expo": {
    "android": {
      "permissions": [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ]
    },
    "plugins": [
      [
        "react-native-ble-plx",
        {
          "isBackgroundEnabled": false,
          "modes": ["peripheral", "central"],
          "bluetoothAlwaysPermission": "Allow Sanjeevni to connect to ESP32 BLE health sensors"
        }
      ]
    ]
  }
}
```

---

## 💻 Usage Examples

### 1. In UI Connection Screens (`connect-device.tsx`)

```tsx
import { useBleConnection } from "@/ble";

export default function ConnectDeviceScreen() {
  const { status, discoveredDevices, connectDevice, startScan } =
    useBleConnection();

  return (
    <View>
      <Text>Status: {status}</Text>
      {discoveredDevices.map((device) => (
        <TouchableOpacity
          key={device.id}
          onPress={() => connectDevice(device.id)}
        >
          <Text>{device.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### 2. In Health Telemetry Adapters (`useDashboardData.ts`)

```tsx
import { useBle } from "@/ble";

export function useDashboardData() {
  const { sensorData, connectionStatus } = useBle();

  // Ingest BioAmp EXG samples
  const exgSamples = sensorData.exg.samples;
  // Ingest DHT11 ambient conditions
  const temperature = sensorData.dht.temperature;
  const humidity = sensorData.dht.humidity;

  return {
    /* transformed vitals */
  };
}
```

### 3. Direct Service Access (Background / SOS Tasks)

```tsx
import { bleService } from "@/ble";

// Trigger automatic hands-free scanning & reconnect
await bleService.startAutoConnect();

// Check native hardware availability
const isSupported = bleService.isBleSupported();
```
