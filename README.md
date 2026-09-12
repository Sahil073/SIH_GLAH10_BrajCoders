# Sanjeevni: AI-Powered Offline Wearable Health Companion

[![Smart India Hackathon](https://img.shields.io/badge/Smart%20India%20Hackathon-SIH%202024-orange.svg)](https://sih.gov.in)
[![Platform](https://img.shields.io/badge/Platform-ESP32%20%7C%20React%20Native%20Expo-blue.svg)](#)
[![BLE](<https://img.shields.io/badge/Connectivity-Bluetooth%20Low%20Energy%20(NUS)-green.svg>)](#)
[![AI Engine](https://img.shields.io/badge/DSP%20%26%20AI-Pan--Tompkins%20%7C%20Sensor%20Fusion-purple.svg)](#)
[![Storage](<https://img.shields.io/badge/Storage-On--Device%20SQLite%20(Offline)-cyan.svg>)](#)

> **Sanjeevni** is an offline-first wearable biometric telemetry and on-device AI health safety system. It continuously monitors high-risk workers, athletes, and patients in bandwidth-constrained, offline environments without requiring active Wi-Fi, cellular internet, or USB connections.

---

## System Architecture & Data Flow

```text
  +-------------------------------------------------------------------------------+
  |                             1. PHYSICAL WEARABLE                              |
  |  BioAmp EXG (500Hz) | ADXL345 (50Hz) | DHT11 (Temp/Hum) | MQ135 (Air Quality) |
  +-------------------------------------------------------------------------------+
                                         │
                                         ▼
  +-------------------------------------------------------------------------------+
  |                        2. ESP32 SENSOR HUB (FIRMWARE)                         |
  |  Serial sampling -> 20-byte segmentation -> Nordic UART Service (NUS) BLE     |
  +-------------------------------------------------------------------------------+
                                         │  Bluetooth Low Energy (100% Offline)
                                         ▼
  +-------------------------------------------------------------------------------+
  |                          3. MOBILE APP: BLE INGESTION                         |
  |  bleManager.ts -> packetParser.ts (Chunk reassembly & Base64 decoding)        |
  +-------------------------------------------------------------------------------+
                                         │
                                         ▼
  +-------------------------------------------------------------------------------+
  |                        4. ON-DEVICE AI ENGINE (TS DSP)                        |
  |  • 0.5-40Hz Bandpass + 50Hz Notch Filter (IIR Biquad)                         |
  |  • Pan-Tompkins Adaptive R-Peak Detection & RR-Interval Validation            |
  |  • Heart Rate (BPM) & HRV Statistics (RMSSD, SDNN)                            |
  |  • ADXL345 Shock & Posture Fall Detection Engine                              |
  |  • NWS Rothfusz Heat Index & Environmental Air Quality Fusion                 |
  |  • Multi-Window False-Alarm Gate & Dynamic SOS Recommendation                 |
  +-------------------------------------------------------------------------------+
                    │                                            │
                    ▼                                            ▼
  +-----------------------------------+        +----------------------------------+
  |    5. LOCAL SQLITE DATABASE       |        |      6. REACTIVE MOBILE UI       |
  |  • readings: Sensor telemetry     |        |  • Live EXG Waveform Visualizer  |
  |  • alerts: Critical safety stream |        |  • Real-Time AI Risk Badges      |
  |  • user_profile: Emergency contact|        |  • Interactive Vitals History    |
  |  • rolling_baseline: Personal AI  |        |  • Automatic Emergency SOS Modal |
  +-----------------------------------+        +----------------------------------+
```

---

## Repository Structure

```text
D:\SIH_GLAH10_BrajCoders\
├── Hardware/                          # ESP32 embedded firmware & schematics
│   ├── Device-Testing/                # Individual sensor validation sketches
│   │   ├── ADXL345_Test/              # 3-axis I2C accelerometer sketch
│   │   ├── BioAmp_EXG_Test/           # Biopotential ADC analog stream sketch
│   │   ├── DHT11_Test/                # Digital temp & humidity test sketch
│   │   ├── MQ135_Test/                # Analog air quality test sketch
│   │   └── Soil_Moisture_Test/        # Analog moisture sensor sketch
│   ├── ESP32_Sensor_Hub/              # Production multi-sensor BLE GATT sketch
│   │   └── ESP32_Sensor_Hub.ino       # Non-blocking FreeRTOS packet streamer
│   ├── Sanjeevni_PCB/                 # Hardware PCB layout & Gerber files
│   ├── HARDWARE_DOCS.md               # Hardware pinout table & BLE UUID map
│   ├── PCB_Design_Guide.md            # Hardware design rationale
│   └── sample_data.txt                # Captured hardware telemetry verification data
│
├── mobile-app/                        # React Native + Expo mobile application
│   ├── ai-engine/                     # On-device biomedical DSP & AI pipeline
│   │   ├── baseline/                  # Personal baseline tracking & cold-start
│   │   ├── buffers/                   # High-performance RingBuffer
│   │   ├── decision/                  # False-alarm gate & risk decision engine
│   │   ├── ecg/                       # Biquad IIR filters, Pan-Tompkins, HR & HRV
│   │   ├── environment/               # NWS Rothfusz heat index & AQI classifier
│   │   ├── fusion/                    # Cross-sensor weighted risk fusion
│   │   ├── motion/                    # Activity state & fall detection
│   │   └── __tests__/                 # AI pipeline unit test suite
│   ├── databaseConnections/           # On-device SQLite schema & migrations
│   │   ├── database.ts                # Table creation, bound checks, pruning
│   │   └── __tests__/                 # Database schema unit test suite
│   ├── src/                           # Mobile frontend source code
│   │   ├── app/                       # Expo Router tab layouts & screens
│   │   │   ├── (tabs)/                # index (Dashboard), alerts, history, sos, profile
│   │   │   └── _layout.tsx            # Startup initializer (SQLite + AI Bridge)
│   │   ├── ble/                       # BleManager (react-native-ble-plx), packetParser, bleStore
│   │   ├── components/                # AIRiskBanner, ModernGraphs, MetricDetailModal
│   │   ├── database/                  # Safe SQLite wrapper
│   │   ├── hooks/                     # useDashboardData, useBle, useAiRisk
│   │   └── services/                  # aiBridge (BLE -> DSP AI -> SQLite)
│   ├── __tests__/                     # End-to-end hardware-to-UI integration test
│   ├── .env.example                   # Template for environment credentials
│   ├── package.json                   # Mobile dependencies & build scripts
│   └── tsconfig.json                  # TypeScript configuration
│
├── .gitignore                         # Comprehensive ignore rules (secrets, DBs, node_modules)
├── package.json                       # Root developer convenience scripts
└── README.md                          # Project documentation & run guide
```

---

## Getting Started: Installation & Run Guide

### 1. Prerequisites

- **Node.js**: v18.x or v20.x LTS installed ([Download Node.js](https://nodejs.org))
- **Git**: Installed and configured
- **Arduino IDE**: Version 2.x ([Download Arduino IDE](https://www.arduino.cc/en/software))
- **Android Device**: Physical Android phone with Bluetooth 4.2+ (BLE) and Location enabled

---

### 2. Hardware Setup & ESP32 Firmware Flashing

1. Connect your **ESP32 Dev Module** to your computer via micro-USB.
2. Open **Arduino IDE** and configure the board:
   - **Board**: `Tools > Board > esp32 > ESP32 Dev Module`
   - **Upload Speed**: `921600`
   - **Flash Frequency**: `80MHz`
   - **Port**: Select the active COM port (e.g., `COM3`, `COM4`).
3. Install required libraries via `Tools > Manage Libraries...`:
   - `Adafruit ADXL345` (by Adafruit)
   - `Adafruit Unified Sensor` (by Adafruit)
   - `DHT sensor library` (by Adafruit)
4. Open the firmware sketch:
   [`Hardware/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino`](file:///d:/SIH_GLAH10_BrajCoders/Hardware/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino)
5. Click **Upload**. Once uploaded, the ESP32 will start advertising with BLE device name: **`ESP32_Sensor_Hub`**.

#### Sensor Pinout Reference

| Sensor            | Physical Pins          | ESP32 GPIO                        | Description                    |
| :---------------- | :--------------------- | :-------------------------------- | :----------------------------- |
| **BioAmp EXG**    | Signal / VCC / GND     | `GPIO 34` (ADC1_CH6)              | Biopotential bi-polar ECG lead |
| **ADXL345**       | SDA / SCL / VCC / GND  | `GPIO 21` (SDA) / `GPIO 22` (SCL) | 3-axis I2C Accelerometer       |
| **DHT11**         | DATA / VCC / GND       | `GPIO 4`                          | Ambient Temperature & Humidity |
| **MQ135**         | Analog OUT / VCC / GND | `GPIO 35` (ADC1_CH7)              | Air Quality / Gas Sensor       |
| **Soil Moisture** | Analog OUT / VCC / GND | `GPIO 32` (ADC1_CH4)              | Perspiration / Soil Sensor     |

---

### 3. Mobile App Setup

1. Open your terminal and navigate to the `mobile-app` directory:
   ```powershell
   cd d:\SIH_GLAH10_BrajCoders\mobile-app
   ```
2. Create your `.env` configuration file from `.env.example`:

   ```powershell
   cp .env.example .env
   ```

   _Edit `.env` to provide your Clerk Auth Publishable Key (or use the test key provided)._

3. Install mobile app dependencies:
   ```powershell
   npm install --legacy-peer-deps
   ```

---

### 4. Running the Mobile App

#### Option A: Run directly on Android Device (Recommended for Native BLE)

To test true hardware Bluetooth Low Energy connectivity, generate and run a native development build:

```powershell
# From mobile-app directory:
npx expo run:android
```

_Note: Make sure your Android device has **Bluetooth** and **Location** permissions enabled._

#### Option B: Run in Expo Go (with Simulation Mode fallback)

```powershell
# From workspace root or mobile-app directory:
npm start
```

- Scan the displayed QR code using the **Expo Go** app on your Android device.
- If running inside standard Expo Go (where native BLE binary drivers are unavailable), Sanjeevni automatically switches to **Simulation Mode**, generating realistic synthetic telemetry identical to the hardware format.

---

## Verification & Automated Tests

The repository includes test suites covering all architectural layers. You can run them directly from the workspace root:

### Run All Tests:

```powershell
npm run test
```

### Run Individual Test Suites:

1. **AI Biomedical DSP & Decision Engine Test** (7/7 tests):

   ```powershell
   npm run test:ai
   ```

   _Validates Biquad IIR filtering, Pan-Tompkins peak detection, RR interval calculation, Motion state classification, NWS Heat Index, and False-Alarm Gate SOS trigger._

2. **SQLite Database & Schema Constraints Test** (6/6 tests):

   ```powershell
   npm run test:db
   ```

   _Validates table creation, bound check constraints, alert severity constraints, single-user profile enforcement, rolling baseline upserts, and 7-day data pruning._

3. **End-to-End Integration Test**:

   ```powershell
   npm run test:e2e
   ```

   _Simulates incoming hardware BLE packets, reassembles chunks, executes the continuous AI sliding window, and verifies SQLite telemetry persistence._

4. **TypeScript Typecheck**:
   ```powershell
   npm run typecheck
   ```
   _Validates TypeScript compilation across the entire mobile codebase (0 errors)._

---

## BLE Protocol Reference (Nordic UART Service)

The ESP32 communicates using the industry-standard Nordic UART Service (NUS):

| UUID Identifier                | Value                                  |
| :----------------------------- | :------------------------------------- |
| **Service UUID**               | `6E400001-B5A3-F393-E0A9-E50E24DCCA9E` |
| **RX Characteristic (Write)**  | `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` |
| **TX Characteristic (Notify)** | `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` |

### Telemetry Packet Payloads (JSON, Newline Delimited `\n`)

- **BioAmp EXG (Sensor 1)**:
  `{"v":1,"sensor":1,"seq":104,"rate":500,"samples":[2048,2060,2090,...],"ts":181482}\n`
- **ADXL345 (Sensor 2)**:
  `{"v":1,"sensor":2,"seq":4518,"data":{"x":0.15,"y":-0.22,"z":9.81},"ts":181483}\n`
- **DHT11 (Sensor 3)**:
  `{"v":1,"sensor":3,"seq":120,"data":{"temperature":32.5,"humidity":68.0},"ts":181500}\n`
- **MQ135 (Sensor 4)**:
  `{"v":1,"sensor":4,"seq":180,"data":{"raw":480},"ts":181751}\n`
- **Soil Moisture (Sensor 5)**:
  `{"v":1,"sensor":5,"seq":95,"data":{"raw":520},"ts":181800}\n`

---

## Security & Offline Privacy

- **100% Offline by Design**: All ECG analysis, Pan-Tompkins QRS detection, and risk evaluations run locally on the smartphone CPU. No health data is transmitted to external servers or cloud services.
- **Local SQLite Storage**: Health readings and alerts are stored in an on-device SQLite database (`sanjeevni.db`) with an automatic 7-day pruning cycle.
- **Credential Protection**: `.env` and sensitive certificate files are strictly excluded via `.gitignore`. Always use `.env.example` as a template for local development.
