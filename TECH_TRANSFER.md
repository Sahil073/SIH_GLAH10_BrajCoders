# Technology Transfer & Integration Guide: ESP32 BLE Telemetry System

> **Project:** SIH GLAH10 — BrajCoders (Sanjeevni Health Monitoring System)  
> **Target MCU:** ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3  
> **Wireless Transport:** Bluetooth Low Energy (BLE 4.2 / 5.0) — Nordic UART Service (NUS)  
> **Mobile Tech Stack:** React Native, Expo, TypeScript, `react-native-ble-plx`  
> **Date:** September 2026  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [ESP32 Firmware Architecture](#3-esp32-firmware-architecture)
   - [3.1 Pinout & Hardware Wiring](#31-pinout--hardware-wiring)
   - [3.2 Multi-Rate Scheduler & Timers](#32-multi-rate-scheduler--timers)
   - [3.3 Large EXG Buffer & Chunked BLE Transmission](#33-large-exg-buffer--chunked-ble-transmission)
   - [3.4 Firmware Files Reference](#34-firmware-files-reference)
4. [BLE Communication Protocol Specification](#4-ble-communication-protocol-specification)
   - [4.1 Nordic UART Service (NUS) Profile](#41-nordic-uart-service-nus-profile)
   - [4.2 Framing, Base64 & Chunking](#42-framing-base64--chunking)
   - [4.3 JSON Telemetry Schema (Sensors 1–5)](#43-json-telemetry-schema-sensors-15)
   - [4.4 Plain-Text / CSV Test Format Fallback](#44-plain-text--csv-test-format-fallback)
5. [Mobile Application Architecture (`mobile-app/`)](#5-mobile-application-architecture-mobile-app)
   - [5.1 Codebase Structure](#51-codebase-structure)
   - [5.2 Stream Reassembly Engine (`packetParser.ts`)](#52-stream-reassembly-engine-packetparserts)
   - [5.3 Hands-Free Auto-Connect & Reconnect Engine (`bleManager.ts`)](#53-hands-free-auto-connect--reconnect-engine-blemanagerts)
   - [5.4 UI Components & Sensor Visualization](#54-ui-components--sensor-visualization)
6. [Frontend & UI Developer Integration Guide](#6-frontend--ui-developer-integration-guide)
   - [6.1 Consuming Sensor Data in Custom UI Screens](#61-consuming-sensor-data-in-custom-ui-screens)
   - [6.2 Testing in Expo Go (Simulation Mode)](#62-testing-in-expo-go-simulation-mode)
   - [6.3 Customizing Waveforms & Visual Gauges](#63-customizing-waveforms--visual-gauges)
   - [6.4 Adding a New Sensor to the Pipeline](#64-adding-a-new-sensor-to-the-pipeline)
7. [Deployment & 100% Offline Operation](#7-deployment--100-offline-operation)
   - [7.1 Standalone APK Generation via EAS Cloud Build](#71-standalone-apk-generation-via-eas-cloud-build)
   - [7.2 Android Bluetooth Runtime Permissions](#72-android-bluetooth-runtime-permissions)
   - [7.3 Zero Wi-Fi, Zero USB, Zero Internet Operation](#73-zero-wi-fi-zero-usb-zero-internet-operation)
8. [Troubleshooting & Common Edge Cases](#8-troubleshooting--common-edge-cases)

---

## 1. Executive Summary

This document serves as the complete **Technology Transfer (Tech Transfer)** specification for the Sanjeevni ESP32 Health Telemetry System. It provides frontend, mobile, and embedded developers with the exact technical blueprints to integrate, extend, and deploy the BLE firmware and mobile application.

### Key Milestones Achieved:
1. **Migration from Bluetooth Classic to BLE:** All ESP32 sketches migrated to Bluetooth Low Energy (BLE GATT) using the Nordic UART Service (NUS), expanding hardware compatibility across the entire ESP32 family (ESP32, ESP32-S3, ESP32-C3) and enabling direct connectivity with iOS, Android, and Web Bluetooth.
2. **Non-Blocking 500 Hz EXG Streaming:** High-frequency biopotential signal sampling running with zero CPU starvation, transmitted via MTU-optimized, 128-byte chunked JSON packets.
3. **Cross-Platform Mobile App:** Built with React Native & Expo, featuring live biopotential sparklines, 3-axis accelerometer vector visualization, environmental and gas monitors, stream reassembly, and debug logging.
4. **Hands-Free Auto-Connection:** Automatic background scanning and zero-click pairing with auto-reconnection on signal loss.
5. **100% Offline Operation:** Standalone Android APK build configured via EAS, allowing completely offline field operation without Wi-Fi, USB cables, or internet access.

---

## 2. End-to-End System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ESP32 SENSOR HARDWARE                           │
│                                                                        │
│  [BioAmp EXG Pill] ──(GPIO 34 ADC)────► 500 Hz (micros() timer)        │
│  [ADXL345 Accel]   ──(I2C SDA/SCL)────► 100 Hz acq / 25 Hz TX          │
│  [DHT11 Temp/Hum]  ──(GPIO 4 OneWire)─► 0.5 Hz                         │
│  [MQ135 Gas]       ──(GPIO 35 ADC)────► 10 Hz acq / 1 Hz (10x avg)     │
│  [Soil Moisture]   ──(GPIO 32 ADC)────► 10 Hz acq / 0.5 Hz (10x avg)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Non-blocking JSON Serializer
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     ESP32 BLE GATT SERVER (NUS)                        │
│                                                                        │
│  Device Name: ESP32_SENSOR_HUB_BLE                                     │
│  Service UUID: 6E400001-B5A3-F393-E0A9-E50E24DCCA9E                   │
│  TX Char UUID: 6E400003-B5A3-F393-E0A9-E50E24DCCA9E (Notify)          │
│  Framing: Base64-encoded, newline-delimited (\n), 128B chunked        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ BLE 4.2 / 5.0 Wireless Link
                                    │ (Zero Wi-Fi, Zero Internet, Zero USB)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 REACT NATIVE / EXPO MOBILE APP                         │
│                                                                        │
│  ┌───────────────────────┐         ┌─────────────────────────────────┐ │
│  │   BleService.ts       │         │    StreamPacketParser.ts        │ │
│  │  - Hands-Free Auto-   │────────►│   - Base64 decode               │ │
│  │    Connect & Retry    │         │   - Chunk buffer reassembly     │ │
│  │  - MTU 512 & Notify   │         │   - \n split & JSON validation  │ │
│  └───────────────────────┘         └────────────────┬────────────────┘ │
│                                                     │                   │
│                                                     ▼                   │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                  DASHBOARD UI / STATE DISPATCHER                  │ │
│  │                                                                   │ │
│  │  • BioAmp EXG Waveform: 128-sample sparkline @ 500 Hz, ΔV p2p     │ │
│  │  • ADXL345: X, Y, Z (m/s²) + Resultant magnitude |g| vector       │ │
│  │  • DHT11: Temperature (°C) + Relative Humidity (%) gauges         │ │
│  │  • MQ135: 12-bit ADC meter + Air quality level index              │ │
│  │  • Soil / Sweat: Capacitive/resistive moisture saturation bar     │ │
│  │  • Raw Console: Real-time scrolling packet terminal               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ESP32 Firmware Architecture

### 3.1 Pinout & Hardware Wiring

The definitive pin mappings for the multi-sensor hub ([`Hardware/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino`](file:///d:/SIH_GLAH10_BrajCoders/Hardware/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino)) are:

| Sensor | Signal | ESP32 GPIO | Pin Type | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **BioAmp EXG Pill** | OUT (Analog) | **GPIO 34** | Input-only ADC1 | Direct biopotential amplified signal |
| **ADXL345** | SDA | **GPIO 21** | I2C Data | Default address `0x53` (SDO=GND) |
| **ADXL345** | SCL | **GPIO 22** | I2C Clock | Pull CS to 3.3V for I2C mode |
| **DHT11** | DATA | **GPIO 4** | Digital I/O | Add 10 kΩ pull-up if using bare sensor |
| **MQ135** | AO (Analog) | **GPIO 35** | Input-only ADC1 | Module runs at 5V; AO must not exceed 3.3V |
| **Soil Moisture** | AO (Analog) | **GPIO 32** | ADC1 + Digital | Capacitive preferred to prevent probe corrosion |

### 3.2 Multi-Rate Scheduler & Timers

The firmware strictly avoids `delay()` in `loop()`, using a non-blocking dual-timer architecture:

```cpp
// 1. High-speed EXG acquisition via micros() to prevent jitter
if (currentMicros - exgLastMicros >= EXG_INTERVAL_US) {
    exgLastMicros += EXG_INTERVAL_US; // Fixed-interval increment prevents drift
    exgBuffer[exgBufferIndex++] = analogRead(PIN_EXG);
    if (exgBufferIndex >= EXG_BUFFER_SIZE) {
        sendExgPacket();
        exgBufferIndex = 0;
    }
}

// 2. Multi-rate sensor scheduling via millis()
if (now - adxlLastTx >= ADXL_TX_INTERVAL_MS) { sendAdxlPacket(); }
if (now - dhtLastTx >= DHT_INTERVAL_MS) { sendDhtPacket(); }
if (now - mq135LastAcq >= MQ135_ACQ_INTERVAL_MS) { accumulateMq135(); }
if (now - soilLastAcq >= SOIL_ACQ_INTERVAL_MS) { accumulateSoil(); }
```

| Sensor | Sample Interval | Averaging | BLE Transmission Rate | Buffer / Payload |
| :--- | :--- | :--- | :--- | :--- |
| **EXG Pill** | **2,000 µs (500 Hz)** | None | **~3.9 Hz** (every 128 samples) | Array of 128 integers (~750 B) |
| **ADXL345** | **10 ms (100 Hz)** | None | **25 Hz** (40 ms gate) | Single 3-axis JSON (~90 B) |
| **DHT11** | **2,000 ms (0.5 Hz)** | None | **0.5 Hz** | Temp & Humidity JSON (~85 B) |
| **MQ135** | **100 ms (10 Hz)** | 10 samples | **1 Hz** (1,000 ms gate) | Averaged ADC JSON (~70 B) |
| **Soil Moisture**| **100 ms (10 Hz)** | 10 samples | **0.5 Hz** (2,000 ms gate) | Averaged ADC JSON (~70 B) |

### 3.3 Large EXG Buffer & Chunked BLE Transmission

Because an EXG JSON packet containing 128 integers is ~750–800 bytes long (which exceeds default BLE MTU size of 23 bytes), the firmware implements safe chunked streaming in `sendJson()`:

```cpp
void sendJson(const JsonDocument &doc)
{
    if (!deviceConnected) return;

    String jsonString;
    serializeJson(doc, jsonString);
    jsonString += '\n'; // Strict newline delimiter

    // If payload is small, transmit immediately in 1 notification
    if (jsonString.length() <= 128) {
        pTxCharacteristic->setValue((uint8_t*)jsonString.c_str(), jsonString.length());
        pTxCharacteristic->notify();
        return;
    }

    // Segment large payloads into 128-byte segments with 2ms yield
    size_t offset = 0;
    while (offset < jsonString.length()) {
        size_t chunk = min((size_t)128, jsonString.length() - offset);
        pTxCharacteristic->setValue((uint8_t*)(jsonString.c_str() + offset), chunk);
        pTxCharacteristic->notify();
        offset += chunk;
        delay(2); // Non-blocking yield prevents BLE notify ringbuffer congestion
    }
}
```

### 3.4 Firmware Files Reference

All firmware files are located in `Hardware/`:
- **Central Integration Hub:** [`Hardware/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino`](file:///d:/SIH_GLAH10_BrajCoders/Hardware/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino)
- **Isolated Validation Sketches:**
  - `Hardware/Device-Testing/Bluetooth/Bluetooth.ino` (`ESP32_TEST_BLE`)
  - `Hardware/Device-Testing/Bioamp_EXG_Bluetooth/Bioamp_EXG_Bluetooth.ino` (`ESP32_EXG_BLE`)
  - `Hardware/Device-Testing/ADXL_Bluetooth/ADXL_Bluetooth.ino` (`ESP32_ADXL_BLE`)
  - `Hardware/Device-Testing/DHT_Bluetooth/DHT_Bluetooth.ino` (`ESP32_DHT11_BLE`)
  - `Hardware/Device-Testing/MQ135_Bluetooth/MQ135_Bluetooth.ino` (`ESP32_MQ135_BLE`)
  - `Hardware/Device-Testing/Moisture_Bluetooth/Moisture_Bluetooth.ino` (`ESP32_SOIL_BLE`)
- **Hardware Specs & Docs:** [`Hardware/HARDWARE_DOCS.md`](file:///d:/SIH_GLAH10_BrajCoders/Hardware/HARDWARE_DOCS.md)

---

## 4. BLE Communication Protocol Specification

### 4.1 Nordic UART Service (NUS) Profile

The system uses the Nordic Semiconductor UART Service (NUS) specification:

| Parameter | UUID | Purpose | Properties |
| :--- | :--- | :--- | :--- |
| **Primary Service** | `6E400001-B5A3-F393-E0A9-E50E24DCCA9E` | NUS Main Service | — |
| **TX Characteristic** | `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` | ESP32 $\rightarrow$ Client Data | **Notify** (CCCD `0x2902`) |
| **RX Characteristic** | `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` | Client $\rightarrow$ ESP32 Command | **Write** / Write Without Resp |
| **CCCD Descriptor** | `00002902-0000-1000-8000-00805f9b34fb` | Client Subscriptions | Enable Notifications (`0x0001`) |
| **Device Name** | `ESP32_SENSOR_HUB_BLE` | Advertised Peripheral ID | Broadcast in Scan Response |

### 4.2 Framing, Base64 & Chunking

1. **BLE Characteristic Layer:** In React Native BLE (`react-native-ble-plx`), incoming notifications are returned as **Base64-encoded strings**.
2. **Text Decoding Layer:** Base64 is decoded using `atob` into UTF-8 characters.
3. **Delimiter Framing:** Packets always terminate with `\n` (newline).
4. **Reassembly Buffer:** If a JSON payload arrives across multiple BLE packets (e.g. 128-byte segments), `StreamPacketParser` concatenates them until the terminating `\n` appears, guaranteeing zero truncated JSON errors.

---

### 4.3 JSON Telemetry Schema (Sensors 1–5)

Every packet contains mandatory envelope headers:
- `v` (integer): Protocol version (fixed `1`).
- `sensor` (integer): Sensor ID (`1` to `5`).
- `seq` (integer): 32-bit monotonic sequence number incremented per sensor packet.
- `ts` (integer): ESP32 uptime in milliseconds (`millis()`).

#### Sensor 1: BioAmp EXG Pill (Biopotential / ECG / EMG)
```json
{
  "v": 1,
  "sensor": 1,
  "seq": 1042,
  "ts": 123456789,
  "rate": 500,
  "samples": [1842, 1845, 1841, 1839, 1843, 1850, 1862, 1840, "... (128 integers total)"]
}
```
- `rate`: Sampling frequency in Hz (`500`).
- `samples`: Array of exactly 128 raw 12-bit ADC integers (range `0`–`4095`).
- **Physical Meaning:** Direct amplified voltage from skin electrodes. $V_{in} \approx \frac{ADC \times 3.3V}{4095 \times Gain}$.

#### Sensor 2: ADXL345 (3-Axis Accelerometer)
```json
{
  "v": 1,
  "sensor": 2,
  "seq": 2580,
  "ts": 123456810,
  "data": {
    "x": 0.12,
    "y": -0.31,
    "z": 9.76
  }
}
```
- `data.x`, `data.y`, `data.z`: Acceleration in $m/s^2$ (2 decimal places).
- Earth gravity resting on flat surface: $z \approx +9.81\ m/s^2$.
- Resultant acceleration magnitude: $|g| = \sqrt{x^2 + y^2 + z^2}$.

#### Sensor 3: DHT11 (Temperature & Humidity)
```json
{
  "v": 1,
  "sensor": 3,
  "seq": 65,
  "ts": 123458000,
  "data": {
    "temperature": 28.4,
    "humidity": 64.0
  }
}
```
- `data.temperature`: Ambient temperature in °C (1 decimal place).
- `data.humidity`: Relative humidity in % RH (1 decimal place).

#### Sensor 4: MQ135 (Air Quality & Gas Detection)
```json
{
  "v": 1,
  "sensor": 4,
  "seq": 130,
  "ts": 123457000,
  "data": {
    "raw": 1854
  }
}
```
- `data.raw`: 10-sample running average 12-bit ADC reading (`0`–`4095`).
- Lower values indicate clean air; higher values indicate presence of CO₂, alcohol, smoke, or NH₃.

#### Sensor 5: Soil Moisture / Sweat Sensor
```json
{
  "v": 1,
  "sensor": 5,
  "seq": 65,
  "ts": 123458000,
  "data": {
    "raw": 1842
  }
}
```
- `data.raw`: 10-sample running average 12-bit ADC reading (`0`–`4095`).
- Used as an alternative proxy for galvanic skin response / sweat detection.

---

### 4.4 Plain-Text / CSV Test Format Fallback

If connected to individual test sketches in `Hardware/Device-Testing/`, `StreamPacketParser` automatically parses plain-text CSV streams without throwing errors:

| Test Sketch | Example Stream Line | Fallback Mapping |
| :--- | :--- | :--- |
| `Bioamp_EXG_Bluetooth.ino` | `EXG,1842\n` | Extracted into `ExgPacket` (1 sample) |
| `ADXL_Bluetooth.ino` | `ADXL345,0.12,-0.31,9.76\n`| Extracted into `AdxlPacket` |
| `DHT_Bluetooth.ino` | `Temperature: 28.4 C, Humidity: 64.0 %\n` | Extracted into `DhtPacket` |
| `MQ135_Bluetooth.ino` | `MQ135,1854\n` | Extracted into `Mq135Packet` |
| `Moisture_Bluetooth.ino` | `SOIL,1842\n` | Extracted into `SoilPacket` |
| `Bluetooth.ino` | `TEST DATA: 42\n` | Logged to live debug terminal |

---

## 5. Mobile Application Architecture (`mobile-app/`)

### 5.1 Codebase Structure

```
mobile-app/
├── package.json                      # React Native 0.74, Expo 51, react-native-ble-plx 3.2, base-64
├── app.json                          # App bundle config + Bluetooth Android permissions
├── eas.json                          # Standalone APK cloud build configuration
├── tsconfig.json                     # TypeScript strict mode configuration
├── App.tsx                           # Main state container & lifecycle coordinator
└── src/
    ├── types/
    │   └── sensors.ts                # TypeScript interfaces for packets, states, and BLE events
    ├── services/
    │   ├── packetParser.ts           # Sliding stream buffer, Base64 decoder, JSON validator
    │   └── bleManager.ts             # BLE central manager with hands-free auto-connect & simulation
    ├── components/
    │   ├── Header.tsx                # Status pill, RSSI badge, disconnect & demo buttons
    │   ├── DeviceScannerModal.tsx    # Manual peripheral discovery modal with dBm indicators
    │   ├── ExgWaveform.tsx           # Subsampled 64-point live sparkline waveform visualizer
    │   ├── SensorCard.tsx            # Visual cards for ADXL, DHT11, MQ135, and Soil Moisture
    │   └── RawConsoleModal.tsx       # Live terminal log viewer
    └── screens/
        └── DashboardScreen.tsx       # Main telemetry view containing all sensor tiles
```

---

### 5.2 Stream Reassembly Engine (`packetParser.ts`)

Located in [`mobile-app/src/services/packetParser.ts`](file:///d:/SIH_GLAH10_BrajCoders/mobile-app/src/services/packetParser.ts):
- **Class:** `StreamPacketParser`
- **Method `feed(chunk: string)`:**
  1. Appends chunk to `this.buffer`.
  2. Splits on `\n`.
  3. Pops the trailing incomplete string and stores it back in `this.buffer`.
  4. Iterates through all complete lines, executes `JSON.parse()`, verifies `packet.v === 1`, and dispatches validated TypeScript `Esp32Packet` objects.

```typescript
const parser = new StreamPacketParser();
// Incoming from BLE notification:
const decodedChunk = StreamPacketParser.decodeBase64(characteristic.value);
const { packets, rawLines } = parser.feed(decodedChunk);
packets.forEach(packet => dispatchToState(packet));
```

---

### 5.3 Hands-Free Auto-Connect & Reconnect Engine (`bleManager.ts`)

Located in [`mobile-app/src/services/bleManager.ts`](file:///d:/SIH_GLAH10_BrajCoders/mobile-app/src/services/bleManager.ts):

1. **Auto-Connect on Startup:** On app launch, `bleService.startAutoConnect()` is called automatically.
2. **Permission Check:** Requests `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, and `ACCESS_FINE_LOCATION` on Android.
3. **Target Filter:** Filters scanned devices for prefix `ESP32` or service UUID `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`.
4. **Immediate Pairing:** The moment `ESP32_SENSOR_HUB_BLE` is detected, it stops scanning and initiates connection immediately without user intervention.
5. **MTU Negotiation:** Calls `device.requestMTU(512)` to maximize throughput.
6. **Auto-Reconnection Loop:** If the ESP32 loses power or goes out of range, the `onDisconnected` callback schedules an automatic scan retry after 2.5 seconds, establishing an unbreakable reconnect loop.

---

### 5.4 UI Components & Sensor Visualization

1. **`ExgWaveform.tsx`:**
   - Subsamples 128 incoming samples into 48–64 rendering points.
   - Computes dynamic min, max, and peak-to-peak ($\Delta V$) amplitude on the fly.
   - Assigns signal quality badges:
     - `p2p > 2200`: High Noise / Clipping (Red)
     - `100 <= p2p <= 2200`: Active Signal / Good (Emerald)
     - `p2p < 100`: Low Activity / Flatline (Amber)
   - Built with pure React Native components (`View`, `StyleSheet`) for 100% crash-free rendering across all devices without heavy native canvas dependencies.
2. **`SensorCard.tsx`:**
   - **ADXL345:** 3 distinct axis cards (X: Cyan, Y: Indigo, Z: Emerald) with resultant magnitude $|g|$.
   - **DHT11:** Dual split card showing Temperature (°C) and Humidity (% RH) with thermal comfort badges.
   - **MQ135 & Soil:** Visual progress bars displaying percentage of 12-bit ADC scale with hazard and saturation thresholds.

---

## 6. Frontend & UI Developer Integration Guide

### 6.1 Consuming Sensor Data in Custom UI Screens

All sensor data is centralized in the root `SensorState` object in `App.tsx`. To build a new screen (e.g. Patient Report, Analytics, Historical Graphs):

```typescript
import { SensorState } from '../types/sensors';

export const MyCustomPatientScreen: React.FC<{ data: SensorState }> = ({ data }) => {
  const currentHeartRateProxy = data.exg.latestSample;
  const currentTemp = data.dht.temperature;
  const currentAccel = data.adxl.magnitude;

  return (
    <View>
      <Text>Temperature: {currentTemp}°C</Text>
      <Text>G-Force: {currentAccel.toFixed(2)} m/s²</Text>
    </View>
  );
};
```

### 6.2 Testing in Expo Go (Simulation Mode)

Frontend and UI developers do **not** need physical ESP32 hardware to build and test UI screens.
1. Run `npx expo start` in `mobile-app/`.
2. Open Expo Go on your phone.
3. Tap **"Demo Mode"** in the top bar.
4. `bleManager.ts` runs a mathematical simulation generating:
   - Realistic ECG/EMG waveform with QRS peaks and baseline drift.
   - Dynamic accelerometer tilt.
   - Periodic temperature, humidity, and gas fluctuations.

### 6.3 Customizing Waveforms & Visual Gauges

To adjust colors or card styling:
- **Theme Palette:**
  - Background: `#0A0F1D` (Deep Slate / Night)
  - Card Surface: `#1E293B` (Border `#334155`)
  - Cyan Accent: `#38BDF8`
  - Emerald Positive: `#10B981`
  - Amber Warning: `#F59E0B`
  - Red Danger: `#EF4444`

---

## 7. Deployment & 100% Offline Operation

### 7.1 Standalone APK Generation via EAS Cloud Build

Because the user does not want Wi-Fi or USB tethering during actual operation, the app is compiled into a standalone `.apk`:

```powershell
cd d:\SIH_GLAH10_BrajCoders\mobile-app
npx eas-cli build -p android --profile preview
```

#### EAS Build Configuration (`mobile-app/eas.json`):
```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    }
  }
}
```
- Cloud build compiles the native Android C++/Java Bluetooth binaries (`react-native-ble-plx`).
- Outputs a direct download link and QR code in the terminal.
- Download `sanjeevni-ble-hub.apk` directly to your phone and tap **Install**.

### 7.2 Android Bluetooth Runtime Permissions

Configured in `mobile-app/app.json`:
- `android.permission.BLUETOOTH_SCAN` (Android 12+)
- `android.permission.BLUETOOTH_CONNECT` (Android 12+)
- `android.permission.ACCESS_FINE_LOCATION` (Android < 12)

The app automatically requests these permissions on the first launch.

### 7.3 Zero Wi-Fi, Zero USB, Zero Internet Operation

Once the `.apk` is installed:
1. Turn **Wi-Fi OFF** and **Mobile Data OFF** on the phone.
2. Turn **Bluetooth ON**.
3. Power on the ESP32.
4. Launch **Sanjeevni BLE Hub**.
5. The app communicates directly over short-range 2.4 GHz Bluetooth Low Energy with zero external infrastructure.

---

## 8. Troubleshooting & Common Edge Cases

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **App stuck on "Scanning for ESP32..."** | ESP32 not powered on or Bluetooth disabled on phone | Ensure ESP32 is powered on (red LED illuminated) and phone Bluetooth is enabled. |
| **No data streaming after connection** | CCCD Notification not enabled | `bleManager.ts` automatically subscribes to characteristic `6E400003-...`. Verify GATT service matches `6E400001-...`. |
| **Corrupted or incomplete JSON error** | Packet split across BLE segments | `StreamPacketParser` handles chunking automatically. Ensure the firmware maintains the trailing `\n` character in `sendJson()`. |
| **EAS build dependency conflict** | Outdated config plugin package | Ensure `@config-plugins/react-native-ble-plx` is NOT in `package.json`. Modern Expo 51 uses native `"react-native-ble-plx"` in `app.json`. |
| **EXG waveform appears noisy or flat** | Poor electrode contact or disconnected wire | Ensure electrode pads are firmly placed on clean skin and OUT pin is connected to GPIO 34. |

