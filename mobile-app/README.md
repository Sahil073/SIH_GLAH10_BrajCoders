# Sanjeevni BLE Hub — Mobile App

A modern, responsive cross-platform mobile application built with **React Native** and **Expo** to monitor real-time telemetry streamed from the ESP32 Multi-Sensor Hub over **Bluetooth Low Energy (BLE)** using the industry-standard **Nordic UART Service (NUS)**.

---

## Features

- **Real-Time BioAmp EXG Waveform (Sensor ID 1):** Subsampled live sparkline visualizer displaying the 128-sample 12-bit ADC buffer @ 500 Hz with dynamic peak-to-peak ($\Delta V$) amplitude and signal quality rating.
- **ADXL345 3-Axis Accelerometer (Sensor ID 2):** Live X, Y, Z acceleration cards ($m/s^2$) + resultant magnitude vector $|g|$.
- **DHT11 Environmental Monitor (Sensor ID 3):** Live temperature (°C) & humidity (% RH) gauges with thermal comfort badges.
- **MQ135 Gas & Air Quality (Sensor ID 4):** Raw 12-bit ADC meter with AQI status indicators.
- **Soil Moisture / Sweat Sensor (Sensor ID 5):** Conductive moisture gauge bar with saturation rating.
- **Nordic UART Stream Reassembly:** Automatically decodes Base64 BLE notifications, handles multi-chunk 128-byte segments, and extracts newline-delimited JSON packets.
- **Live Terminal & Debug Console:** Inspect raw incoming packets, sequence counters, and timestamps.
- **Dual Runtime Support:**
  - **Expo Go Mode (Instant Preview):** Built-in simulated telemetry generator to test all UI cards, graphs, and parsers without needing a physical ESP32 or native build.
  - **Hardware BLE Mode (Native):** Full native BLE scanning, connection, and MTU negotiation when run via Expo Development Client.

---

## GATT Service Profile

| Service / Characteristic | UUID | Description |
| :--- | :--- | :--- |
| **Nordic UART Service (NUS)** | `6E400001-B5A3-F393-E0A9-E50E24DCCA9E` | Primary Service |
| **TX Characteristic** | `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` | Notify (ESP32 $\rightarrow$ Mobile) |
| **RX Characteristic** | `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` | Write (Mobile $\rightarrow$ ESP32) |
| **Device Name** | `ESP32_SENSOR_HUB_BLE` | Advertised Peripheral Name |

---

## Getting Started

### 1. Installation

Navigate into the mobile app directory and install dependencies:

```bash
cd mobile-app
npm install
```

---

### 2. Running in Expo Go (Demo / Simulation Mode)

Because the standard **Expo Go** sandbox from Google Play / App Store does not compile native C++/Java code like `react-native-ble-plx`, the app includes a graceful fallback:

```bash
npx expo start
```

1. Scan the QR code using the **Expo Go** app on your phone.
2. Tap **"Demo Mode"** in the top bar (or tap **"Scan Devices"** and select **"ESP32_SENSOR_HUB_BLE (Simulated)"**).
3. The app will stream realistic ECG/EMG biopotential waves, accelerometer tilt, temperature, and gas data in real time!

---

### 3. Running with Physical ESP32 Hardware (Native BLE)

To scan and connect to physical ESP32 BLE hardware, run an Expo Development Build:

#### Prerequisites:
- Android Studio installed with Android SDK and USB Debugging enabled on your Android phone.

#### Run on Android:
```bash
npx expo run:android
```

This command automatically:
1. Generates the native Android project via `@config-plugins/react-native-ble-plx`.
2. Adds `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, and `ACCESS_FINE_LOCATION` permissions.
3. Builds and installs the debug APK on your connected device.
4. Now tap **"Scan Devices"**, select your `ESP32_SENSOR_HUB_BLE`, and watch live hardware telemetry stream directly!

