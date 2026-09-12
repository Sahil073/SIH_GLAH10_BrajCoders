# Sanjeevni: Offline Wearable Telemetry & Edge AI Companion

[![Smart India Hackathon](https://img.shields.io/badge/Smart%20India%20Hackathon-SIH%20Prototype-orange.svg)](https://sih.gov.in)
[![Platform](https://img.shields.io/badge/Platform-ESP32%20%7C%20React%20Native%20Expo-blue.svg)](#)
[![BLE](<https://img.shields.io/badge/BLE-Nordic%20UART%20Service%20(NUS)-green.svg>)](#)
[![DSP Engine](https://img.shields.io/badge/DSP-Pan--Tompkins%20%7C%20Biquad%20IIR-purple.svg)](#)
[![Storage](<https://img.shields.io/badge/Storage-On--Device%20SQLite%20(Offline)-cyan.svg>)](#)

Sanjeevni is an offline-first wearable telemetry system and on-device health safety companion. Designed for industrial workers, underground miners, high-altitude workers, and remote patients, it continuously captures physiological and environmental vitals via a multi-sensor ESP32 wearable and streams them over Bluetooth Low Energy (BLE) to an Android smartphone.

All biomedical signal processing, Pan-Tompkins QRS detection, motion classification, heat-stress modeling, and risk scoring execute locally on the mobile device CPU. No internet connection, cellular data, or external cloud infrastructure is required.

---

## System Architecture & Data Pipeline

```text
  +-----------------------------------------------------------------------------------+
  |                                PHYSICAL WEARABLE                                  |
  |  • BioAmp EXG Pill (500 Hz Biopotential)   • ADXL345 (100 Hz Acq / 25 Hz Motion)  |
  |  • DHT11 (0.5 Hz Ambient Temp & Humidity)  • MQ135 (10 Hz Acq / 1 Hz Gas ADC)     |
  |  • Moisture Sensor (10 Hz Acq / 0.5 Hz)    • Custom 2-Layer PCB / 3.7V LiPo       |
  +-----------------------------------------------------------------------------------+
                                           │
                                           ▼
  +-----------------------------------------------------------------------------------+
  |                          ESP32 SENSOR HUB (FIRMWARE)                              |
  |  • Non-blocking multi-rate timer scheduler (Hardware/ESP32_Sensor_Hub/)          |
  |  • 128-sample circular buffering for high-frequency biopotential                  |
  |  • Nordic UART Service (NUS) GATT Server (Advertised: ESP32_SENSOR_HUB_BLE)       |
  |  • 128-byte chunking with 2 ms yield to prevent GATT notify buffer overflow       |
  +-----------------------------------------------------------------------------------+
                                           │ Bluetooth Low Energy (100% Offline)
                                           ▼
  +-----------------------------------------------------------------------------------+
  |                             MOBILE APP: BLE INGESTION                             |
  |  • bleManager.ts: Auto-scan, zero-click reconnect loop, MTU 517 negotiation       |
  |  • packetParser.ts: Multi-chunk reassembly buffer & newline-delimited JSON parser |
  |  • bleStore.ts: Reactive telemetry state store                                    |
  +-----------------------------------------------------------------------------------+
                                           │
                                           ▼
  +-----------------------------------------------------------------------------------+
  |                          ON-DEVICE AI & DSP ENGINE (TS)                           |
  |  • 0.5–40 Hz Biquad Bandpass + 50 Hz Notch Filter for AC hum rejection            |
  |  • Pan-Tompkins adaptive dual-threshold R-peak detector & 200 ms refractory blank |
  |  • 300–2000 ms physiological RR interval validation & HRV (RMSSD, SDNN)           |
  |  • Dynamic 3-axis motion classification (REST / LIGHT / ACTIVE)                   |
  |  • 3-Stage Fall Detection FSM (Freefall <0.5g -> Impact >2.5g -> Immobility)      |
  |  • NWS Rothfusz polynomial Heat Index (°C) & MQ135 AQI severity mapping           |
  |  • Multi-window false-alarm gate, Welford's running baseline & SOS trigger logic  |
  +-----------------------------------------------------------------------------------+
                     │                                            │
                     ▼                                            ▼
  +-------------------------------------+      +--------------------------------------+
  |      LOCAL SQLITE DATABASE          |      |         REACTIVE MOBILE UI           |
  |  • readings: Sensor telemetry       |      |  • Live EXG Waveform Oscilloscope    |
  |  • alerts: Severity-checked stream  |      |  • Dynamic Vitals Sparkline Cards    |
  |  • user_profile: Medical parameters |      |  • Interactive Historical Analytics  |
  |  • rolling_baseline: Welford stats  |      |  • Real-Time Multi-Sensor Risk Banner|
  |  • Automated 7-day data pruning     |      |  • Direct Emergency SOS Modal        |
  +-------------------------------------+      +--------------------------------------+
```

---

## Repository Structure

```text
SIH_GLAH10_BrajCoders/
├── Hardware/                          # Firmware, testing sketches, PCB and hardware docs
│   ├── Device-Testing/                # 2-Tier component verification suite
│   │   ├── ADXL345/                   # Standalone I2C accelerometer serial test
│   │   ├── ADXL_Bluetooth/            # BLE stream test for ADXL345 (25 Hz)
│   │   ├── Bioamp_EXG/                # Standalone biopotential ADC serial test
│   │   ├── Bioamp_EXG_Bluetooth/      # BLE stream test for BioAmp EXG (500 Hz, 128-sample)
│   │   ├── Bluetooth/                 # BLE NUS loopback echo test
│   │   ├── DHT11/                     # Standalone digital temperature/humidity test
│   │   ├── DHT_Bluetooth/             # BLE stream test for DHT11 (0.5 Hz)
│   │   ├── LED/                       # GPIO and ESP32 clock sanity check
│   │   ├── MQ135/                     # Standalone hazardous gas ADC serial test
│   │   ├── MQ135_Bluetooth/           # BLE stream test for MQ135 (1 Hz)
│   │   ├── Moisture/                  # Standalone moisture ADC serial test
│   │   ├── Moisture_Bluetooth/        # BLE stream test for moisture sensor (0.5 Hz)
│   │   └── DEVICE_TESTING_GUIDE.md    # Modular hardware verification instructions
│   ├── ESP32_Sensor_Hub/              # Production multi-sensor BLE firmware
│   │   └── ESP32_Sensor_Hub.ino       # Full FreeRTOS multi-rate scheduler
│   ├── Sanjeevni_PCB/                 # Custom KiCad PCB files & manufacturing guide
│   │   ├── Sanjeevni_PCB.kicad_sch    # Schematic design
│   │   ├── Sanjeevni_PCB.kicad_pcb    # 2-layer PCB layout
│   │   ├── PCB schema.pdf             # Exported schematic reference
│   │   ├── PCB design.pdf             # Exported board layout reference
│   │   ├── PCB_Design_Guide.md        # Comprehensive electrical BOM and layout notes
│   │   ├── README.md                  # PCB subsystem overview and stackup
│   │   └── images/                    # 3D board renders
│   ├── HARDWARE_DOCS.md               # Pinouts, electrical specifications and BLE format
│   ├── README.md                      # Hardware overview and getting started guide
│   └── sample_data.txt                # 1,130 lines of verified field telemetry
│
├── docs/                              # Project specifications and hackathon decks
│   ├── BrajCoder's_SIH_Round1.pdf     # Smart India Hackathon Round 1 presentation
│   ├── BrajCoders_SIH_2026.pdf        # SIH project submission & architectural slides
│   ├── sanjeevni_app_spec.pdf         # Mobile application technical specification
│   ├── sanjeevni_buildguide.pdf       # Hardware assembly and prototyping guide
│   └── DOCS_GUIDE.md                  # Index and overview of project documents
│
├── mobile-app/                        # React Native + Expo mobile application
│   ├── ai-engine/                     # On-device biomedical DSP and decision pipeline
│   │   ├── baseline/                  # Welford's online running baseline engine
│   │   ├── buffers/                   # High-performance RingBuffer
│   │   ├── decision/                  # Multi-window false-alarm gate & risk rules
│   │   ├── ecg/                       # Biquad IIR filters, Pan-Tompkins, HR & HRV
│   │   ├── environment/               # NWS Rothfusz heat index & AQI classifier
│   │   ├── fusion/                    # Multi-modal cross-sensor risk fusion
│   │   ├── mock/                      # Synthetic telemetry generator for simulator mode
│   │   ├── motion/                    # Dynamic activity state & 3-stage fall FSM
│   │   ├── __tests__/                 # Automated 7-test AI pipeline test suite
│   │   ├── index.ts                   # processSensorTick() main entrypoint
│   │   ├── types.ts                   # Strict data contracts for all sensor inputs
│   │   └── README.md                  # Comprehensive mathematical specification
│   ├── databaseConnections/           # On-device SQLite persistence layer
│   │   ├── database.ts                # Schema v4 table definitions, CRUD & pruning
│   │   ├── database.web.ts            # Web-safe mock fallback for browsers
│   │   ├── __tests__/                 # Automated 12-test database test suite
│   │   └── README.md                  # Table schemas, indices & retention policy
│   ├── src/                           # Mobile frontend source code
│   │   ├── app/                       # Expo Router tab layouts and navigation screens
│   │   │   ├── (auth)/                # Sign-in and sign-up flows (Clerk auth)
│   │   │   ├── (tabs)/                # Dashboard, Alerts, History, SOS, Profile
│   │   │   ├── _layout.tsx            # App initialization, providers & DB/AI bridge
│   │   │   └── connect-device.tsx     # BLE device discovery and pairing screen
│   │   ├── ble/                       # BLE Central manager, reassembly & reactive store
│   │   ├── components/                # Reusable UI widgets, sparklines, modals
│   │   ├── hooks/                     # Custom hooks (useDashboardData, useBle, useAiRisk)
│   │   └── services/                  # aiBridge.ts (BLE -> AI Pipeline -> SQLite)
│   ├── __tests__/                     # End-to-end hardware-to-UI integration test
│   ├── app.json                       # Expo configuration, Android permissions & plugins
│   ├── eas.json                       # Standalone APK build profile (arm64-v8a)
│   ├── package.json                   # Mobile dependencies and npm scripts
│   └── README.md                      # Mobile subsystem documentation
│
├── package.json                       # Root developer convenience test scripts
└── README.md                          # Project documentation and run guide
```

---

## Hardware Setup & Firmware Flashing

### 1. Prerequisites

- **Arduino IDE**: Version 2.x ([Download Arduino IDE](https://www.arduino.cc/en/software))
- **ESP32 Board Package**: Install `esp32` by Espressif via `Boards Manager`
- **Required Libraries** (via `Tools > Manage Libraries...`):
  - `Adafruit ADXL345`
  - `Adafruit Unified Sensor`
  - `DHT sensor library` (by Adafruit)
  - `ArduinoJson` (by Benoit Blanchon, v6.x or v7.x)

### 2. Sensor Pinout Mapping

| Sensor Module       | Physical Interface | ESP32 GPIO                         | Operating Voltage           | Notes                                        |
| :------------------ | :----------------- | :--------------------------------- | :-------------------------- | :------------------------------------------- |
| **BioAmp EXG Pill** | Analog Voltage     | `GPIO 34`                          | 3.3V                        | ADC1_CH6 (Input-only, 500 Hz sampling)       |
| **ADXL345**         | I2C                | `GPIO 21` (SDA)<br>`GPIO 22` (SCL) | 3.3V                        | I2C Address `0x53` (SDO to GND)              |
| **DHT11**           | Proprietary 1-Wire | `GPIO 4`                           | 3.3V / 5V                   | Digital I/O (10 kΩ pull-up required if bare) |
| **MQ135**           | Analog Voltage     | `GPIO 35`                          | 5.0V (Heater)<br>3.3V (ADC) | ADC1_CH7 (Input-only, heater requires 5V)    |
| **Moisture Sensor** | Analog Voltage     | `GPIO 32`                          | 3.3V                        | ADC1_CH4 (Supports digital and analog)       |

> **Critical ADC Note:** Only ADC1 pins are used. ADC2 pins (`GPIO 0, 2, 4, 12, 13, 14, 15, 25, 26, 27`) cannot be used for analog reads when Bluetooth or Wi-Fi is active.

### 3. Flashing the Sensor Hub Firmware

1. Connect your ESP32 Dev Module via micro-USB.
2. In Arduino IDE, select:
   - **Board**: `ESP32 Dev Module`
   - **Upload Speed**: `921600`
   - **Flash Frequency**: `80MHz`
   - **Port**: Select your active COM port.
3. Open [`Hardware/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino`](Hardware/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino).
4. Click **Upload**.
5. Once uploaded, open the Serial Monitor at `115200 baud`. The ESP32 will initialize all sensors and start advertising over BLE as **`ESP32_SENSOR_HUB_BLE`**.

---

## Mobile App Setup & Execution

### 1. Prerequisites

- **Node.js**: v18.x or v20.x LTS ([Download Node.js](https://nodejs.org))
- **npm**: v9.x or higher
- **Physical Android Phone**: Bluetooth 4.2+ and Location enabled (for native BLE testing).

### 2. Installation & Configuration

```bash
# 1. Navigate to the mobile app directory
cd mobile-app

# 2. Copy the sample environment file
cp .env.example .env

# 3. Install dependencies
npm install --legacy-peer-deps
```

### 3. Running in Development

#### Option A: Expo Go (Simulation Mode)

```bash
npm start
```

- Scan the displayed QR code with the **Expo Go** application on Android.
- Because native BLE binary drivers are unavailable inside Expo Go, Sanjeevni automatically engages its built-in mathematical synthetic generator (`syntheticDataGenerator.ts`). It generates realistic 500 Hz ECG waveforms, accelerometer tilts, and ambient thermal cycles for full UI testing.

#### Option B: Standalone Android APK (Physical BLE Mode)

To connect to the physical ESP32 hardware, compile an installable standalone `.apk`:

```bash
# Via EAS Cloud Build:
npm install -g eas-cli
npx eas login
npx eas build -p android --profile preview

# Or compile locally with Gradle:
npx expo prebuild --platform android
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

Install the resulting `.apk` on your phone, enable Bluetooth, power on the ESP32, and launch Sanjeevni. The app will pair and start streaming telemetry without internet or Wi-Fi.

---

## Automated Verification & Test Suites

The project includes unit and integration tests across the entire stack. Run them from the workspace root:

### Run All Test Suites:

```bash
npm test
```

### Run Individual Test Suites:

1. **On-Device AI Engine Test Suite** (`7/7 Passed`):

   ```bash
   npm run test:ai
   ```

   - Test 1: Biquad IIR Bandpass (0.5–40 Hz) & 50 Hz Notch filter attenuation.
   - Test 2: Pan-Tompkins QRS peak detection and RR interval validation.
   - Test 3: Mathematical derivation of BPM, RMSSD, and SDNN.
   - Test 4: Dynamic motion classification and 3-stage fall detection FSM.
   - Test 5: Environmental Heat Index calculation against NOAA benchmark tables.
   - Test 6: Full end-to-end `processSensorTick()` pipeline orchestration.
   - Test 7: Multi-window emergency alarm and false-alarm gate trigger logic.

2. **SQLite Database & Schema Test Suite** (`12/12 Passed`):

   ```bash
   npm run test:db
   ```

   - Test 1: Schema creation, tables (`readings`, `alerts`, `user_profile`, `rolling_baseline`), and indices.
   - Test 2: Readings insertion and query operations.
   - Test 3: Alerts table insertion and severity enum check constraint (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
   - Test 4: Single-profile configuration constraint.
   - Test 5: Rolling baseline upsert via `ON CONFLICT DO UPDATE`.
   - Test 6: Automated 7-day circular data pruning.
   - Test 7: Sensor aggregate statistics calculations.
   - Test 8: Historical sensor queries with timestamp ordering and pagination limits.
   - Test 9: Alert deletion and bulk clear operations.
   - Test 10: Rich user profile persistence and local session management.
   - Test 11: Multi-user data isolation and tenant partitioning.
   - Test 12: 6-month historical data rollup downsampling and user erasure utility.

3. **End-to-End System Integration Test**:

   ```bash
   npm run test:e2e
   ```

   - Step 1: Parses raw multi-chunk ESP32 Nordic UART BLE packets.
   - Step 2: Executes the sliding-window AI pipeline.
   - Step 3: Verifies persistent storage in the local SQLite database.

4. **TypeScript Type Checking**:
   ```bash
   npm run typecheck
   ```

   - Validates TypeScript types across the entire mobile codebase (0 errors).

---

## BLE Protocol Reference (Nordic UART Service)

The ESP32 communicates using the Nordic UART Service (NUS):

| Identifier                     | UUID Value                             |
| :----------------------------- | :------------------------------------- |
| **Service UUID**               | `6E400001-B5A3-F393-E0A9-E50E24DCCA9E` |
| **RX Characteristic (Write)**  | `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` |
| **TX Characteristic (Notify)** | `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` |

### Telemetry Packet Payloads (Newline Delimited `\n`)

- **BioAmp EXG (Sensor ID 1)**:
  `{"v":1,"sensor":1,"seq":104,"rate":500,"samples":[2048,2060,2090,...],"ts":181482}\n`
- **ADXL345 (Sensor ID 2)**:
  `{"v":1,"sensor":2,"seq":4518,"data":{"x":0.15,"y":-0.22,"z":9.81},"ts":181483}\n`
- **DHT11 (Sensor ID 3)**:
  `{"v":1,"sensor":3,"seq":120,"data":{"temperature":32.5,"humidity":68.0},"ts":181500}\n`
- **MQ135 (Sensor ID 4)**:
  `{"v":1,"sensor":4,"seq":180,"data":{"raw":480},"ts":181751}\n`
- **Moisture Sensor (Sensor ID 5)**:
  `{"v":1,"sensor":5,"seq":95,"data":{"raw":520},"ts":181800}\n`

---

## Offline Privacy & Data Integrity

- **Zero Cloud Transmission**: All ECG analysis, Pan-Tompkins QRS detection, and environmental evaluations execute on the smartphone CPU. No biometric data leaves the device.
- **Local SQLite Retention**: Telemetry and safety alerts are stored in an encrypted/sandboxed local SQLite database (`sanjeevni.db`) with an automated 7-day circular pruning policy to preserve phone storage.
- **Credential Protection**: Environment files and keys are excluded via `.gitignore`.
