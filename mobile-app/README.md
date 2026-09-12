# Sanjeevni — AI-Powered Offline Health Companion

**Sanjeevni** is an offline-first mobile health companion built with **React Native** and **Expo**. Developed as a **Smart India Hackathon** prototype, it pairs with an ESP32 wearable sensor system via **Bluetooth Low Energy (BLE)** to provide continuous vital and environmental monitoring, on-device risk assessment, and emergency alerts—operating 100% offline without Wi-Fi or cellular internet.
> **Sub-repository / Mobile Application Module**  
> Designed for clean, modular integration into the main Smart India Hackathon repository: **[SIH_GLAH10_BrajCoders](https://github.com/Sahil073/SIH_GLAH10_BrajCoders)**.

**Sanjeevni** is an offline-first mobile health companion built with **React Native** and **Expo**. It connects to an ESP32 wearable sensor system via **Bluetooth Low Energy (BLE)** to provide real-time biopotential telemetry, environmental monitoring, on-device risk assessment, and emergency alerts—operating **100% offline** without cellular data or Wi-Fi.

---

## Key Features
## 🏛️ Decoupled Architecture

The codebase is organized into **three decoupled layers** to ensure independent maintainability and conflict-free merging into the main upstream repository:

```text
┌─────────────────────────────────────────────────────────────┐
│                       UI LAYER                              │
│  src/app/ (Screens: connect-device, tabs, onboarding)       │
│  src/components/ (ModernGraphs, UniversalNavBar, modals)    │
│  - Pure UI presentation, radar animations, styles & charts  │
└──────────────────────────────▲──────────────────────────────┘
                               │ High-level UI Hooks
                               │ (useBleConnection, useDashboardData)
┌──────────────────────────────┴──────────────────────────────┐
│                    DATA & ADAPTER LAYER                     │
│  src/hooks/useDashboardData.ts (Vitals & peak detection)    │
│  src/data/ (Mock & baseline data)                           │
│  src/store/userProfileStore.ts (User & SOS contacts)        │
│  - Physiological calculators: Heat Index, AQI, Step Counter │
└──────────────────────────────▲──────────────────────────────┘
                               │ Reactive Telemetry Packets
┌──────────────────────────────┴──────────────────────────────┐
│                     BLE / HARDWARE CORE                     │
│  src/ble/index.ts (Public module API)                       │
│  src/ble/bleManager.ts (GATT lifecycle, MTU, scan, reconn)  │
│  src/ble/packetParser.ts (Stream reassembly, Base64, JSON)  │
│  src/ble/bleStore.ts (Reactive state store & useBle hook)   │
│  src/ble/types.ts (Sensors 1-5 contracts, telemetry packets)│
│  src/ble/hooks/useBleConnection.ts (Clean UI hook)          │
│  src/ble/README.md (Integration doc for main repo)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

- **Real-Time Biopotential (ECG/EMG) Monitoring:** Streams 500 Hz biopotential signals from the BioAmp EXG Pill, extracting heart-rate metrics and dynamic wave trends.
- **3-Axis Motion & Activity Tracking:** Monitors acceleration vector magnitude $|g|$ and counts steps in real time via the ADXL345 accelerometer.
- **Environmental & Microclimate Sensing:** Real-time ambient temperature and relative humidity tracking via DHT11, calculating dynamic heat-index and heatstroke risks.
- **Air Quality & Hazard Detection:** Ingests raw 12-bit ADC data from the MQ135 air-quality sensor and maps it to actionable AQI levels (Good, Moderate, Unhealthy, Hazardous).
- **Galvanic Skin / Sweat Monitoring:** Tracks moisture saturation from capacitive/conductive probes to assess hydration status.
- **Robust BLE Stream Reassembly:** Automatically decodes Base64 notifications, handles multi-chunk 128-byte segments, and validates newline-delimited (`\n`) JSON packets.
- **Hands-Free Auto-Connect & Auto-Reconnect:** Zero-click pairing with `ESP32_SENSOR_HUB_BLE` and automatic reconnection backoff loop (2.5s) on signal drop.
- **Dual Runtime Support:**
  - **Expo Go (Simulation Mode):** Mathematical telemetry generator simulating realistic ECG QRS complexes, accelerometer tilt, and temperature cycles for rapid UI testing without physical hardware.
  - **Expo Go (Simulation Mode):** Built-in telemetry generator simulating realistic ECG waveforms, accelerometer tilt, and temperature cycles for rapid UI testing without physical hardware.
  - **Native Standalone APK Mode:** Full native BLE GATT driver (`react-native-ble-plx`) with negotiated MTU 512 for zero-latency streaming.
- **100% Offline Standalone Operation:** Pre-configured EAS build profiles generate installable `.apk` packages that function completely offline.
- **Optimized APK Builds:** Pre-configured with single-architecture targeting (`arm64-v8a`) to cut EAS cloud build times down from 25+ minutes to ~6–8 minutes.
- **100% Offline Operation:** Functions without internet connectivity or cellular network access.

---

## System Architecture
## 🔌 BLE Communication Protocol (Nordic UART Service)

```text
┌─────────────────────────────────────────────────────────────┐
│                 ESP32 WEARABLE SENSOR HUB                   │
│                                                             │
│  • BioAmp EXG Pill (GPIO 34)  ──► 500 Hz Biopotential ADC   │
│  • ADXL345 Accel   (I2C 21/22)──► 100 Hz acq / 25 Hz BLE    │
│  • DHT11 Temp/Hum  (GPIO 4)   ──► 0.5 Hz Environment        │
│  • MQ135 Air Qual  (GPIO 35)  ──► 10 Hz acq / 1 Hz BLE      │
│  • Soil / Moisture (GPIO 32)  ──► 10 Hz acq / 0.5 Hz BLE    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ BLE GATT (Nordic UART Service)
┌─────────────────────────────────────────────────────────────┐
│                   SANJEEVNI MOBILE APP                      │
│                                                             │
│  ┌──────────────────────┐        ┌───────────────────────┐  │
│  │ BleService           │        │ StreamPacketParser    │  │
│  │ - Permissions        ├───────►│ - Base64 Decode       │  │
│  │ - Scan & MTU 512     │        │ - Chunk Reassembly    │  │
│  │ - Auto-Reconnect     │        │ - JSON Validation     │  │
│  └──────────────────────┘        └───────────┬───────────┘  │
│                                              │              │
│                                              ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ bleStore & useDashboardData                           │  │
│  │ - Ingests live telemetry & updates reactive vitals    │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Responsive Dashboard UI                               │  │
│  │ - Heart Rate (BPM) & Sparkline Waveform               │  │
│  │ - Ambient Temperature (°C) & Heat Index Alert         │  │
│  │ - Air Quality (AQI) & Gas Hazard Level                │  │
│  │ - Skin Moisture / Hydration Bar                       │  │
│  │ - Step Activity Counter                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## BLE Communication Protocol (Nordic UART Service)

| Parameter                      | Value                                                          |
| :----------------------------- | :------------------------------------------------------------- |
| **Primary Service UUID**       | `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`                         |
| **TX Characteristic UUID**     | `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` (Notify, CCCD `0x2902`) |
| **RX Characteristic UUID**     | `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` (Write)                 |
| **Advertised Peripheral Name** | `ESP32_SENSOR_HUB_BLE`                                         |
| **Framing**                    | Base64-encoded, newline-delimited (`\n`), 128-byte chunked     |

### Sensor JSON Schema
### Telemetry Packet Schema (Version 1)

```json
// Sensor 1: BioAmp EXG Pill (128 integers @ 500 Hz)
{ "v": 1, "sensor": 1, "seq": 1042, "ts": 123456789, "rate": 500, "samples": [1842, 1845, "..."] }

// Sensor 2: ADXL345 Accelerometer (m/s²)
{ "v": 1, "sensor": 2, "seq": 2580, "ts": 123456810, "data": { "x": 0.12, "y": -0.31, "z": 9.76 } }

// Sensor 3: DHT11 Temperature & Humidity
{ "v": 1, "sensor": 3, "seq": 65, "ts": 123458000, "data": { "temperature": 28.4, "humidity": 64.0 } }

// Sensor 4: MQ135 Air Quality (12-bit raw ADC)
{ "v": 1, "sensor": 4, "seq": 130, "ts": 123457000, "data": { "raw": 1854 } }

// Sensor 5: Moisture / Sweat (12-bit raw ADC)
{ "v": 1, "sensor": 5, "seq": 65, "ts": 123458000, "data": { "raw": 1842 } }
```

---

## Repository Structure
## 📁 Repository Structure

```text
├── assets/                     # Fonts (Poppins) and images
├── assets/                             # Fonts (Poppins) and UI illustrations
├── plugins/
│   └── withReactNativeArchitectures.js # Expo config plugin enforcing arm64-v8a in gradle.properties
├── src/
│   ├── app/                    # Expo Router file-based routes
│   │   ├── (auth)/             # Sign-in & sign-up flows (Clerk)
│   │   ├── (tabs)/             # Main tab views (Dashboard, Alerts, History, Profile, SOS)
│   │   ├── _layout.tsx         # Root layout with providers & fonts
│   │   ├── connect-device.tsx  # Wearable BLE discovery & pairing screen
│   │   ├── onboarding.tsx      # Welcome walkthrough
│   │   └── onboarding-health.tsx # Patient baseline profile setup
│   ├── components/             # Reusable UI components (Dashboard cards, charts, modals)
│   ├── constants/              # Image & asset registries
│   ├── data/                   # Default datasets, metric details & mock fallbacks
│   ├── hooks/                  # Custom hooks (useDashboardData, etc.)
│   ├── services/               # Core BLE & packet parsing engines
│   │   ├── bleManager.ts       # Native BLE Central manager & auto-connect engine
│   │   └── packetParser.ts     # Chunk reassembly, Base64 decoder & JSON validator
│   ├── store/                  # Application state management
│   │   ├── bleStore.ts         # Reactive BLE telemetry store & useBle hook
│   │   └── userProfileStore.ts # SecureStore-backed user profile store
│   ├── theme/                  # Color palettes and typography constants
│   └── types/                  # TypeScript interfaces and sensor data contracts
├── app.json                    # Expo bundle config & Android runtime permissions
├── eas.json                    # Standalone Android APK build configuration
├── package.json                # Project dependencies and npm scripts
├── tailwind.config.js          # NativeWind / Tailwind CSS design configuration
└── tsconfig.json               # TypeScript configuration with @/* path aliases
│   ├── app/                            # Expo Router screens (Presentation Layer)
│   │   ├── (auth)/                     # Clerk authentication flows
│   │   ├── (tabs)/                     # Dashboard, Alerts, History, Profile, SOS
│   │   ├── _layout.tsx                 # Root layout & providers
│   │   ├── connect-device.tsx          # Wearable BLE discovery screen (uses useBleConnection)
│   │   ├── onboarding.tsx              # App welcome flow
│   │   └── onboarding-health.tsx       # Baseline user health profile
│   ├── ble/                            # Self-Contained BLE / Hardware Core
│   │   ├── index.ts                    # Public barrel export
│   │   ├── types.ts                    # Sensor contracts & BLE types
│   │   ├── packetParser.ts             # Stream reassembly & Base64/JSON parser
│   │   ├── bleManager.ts               # Nordic UART driver, auto-reconnect, simulation
│   │   ├── bleStore.ts                 # Reactive state store & useBle hook
│   │   ├── hooks/
│   │   │   └── useBleConnection.ts     # Presentational hook for UI connection screens
│   │   └── README.md                   # Integration guide for upstream repository
│   ├── components/                     # Reusable UI components (vitals cards, charts, modals)
│   ├── constants/                      # Image & asset registries
│   ├── data/                           # Default datasets & mock fallbacks
│   ├── hooks/                          # Bridge hooks (useDashboardData.ts)
│   ├── services/                       # Backwards-compatibility re-export shims
│   ├── store/                          # User profile store & backwards-compatibility shims
│   ├── theme/                          # Color palettes & design tokens
│   └── types/                          # Dashboard & sensor types re-exports
├── app.json                            # Expo bundle config & Android runtime permissions
├── eas.json                            # Standalone Android APK build configuration (arm64-v8a optimized)
├── package.json                        # Project dependencies and npm scripts
├── react-native.config.js              # Disables unused native transitive modules
├── tailwind.config.js                  # NativeWind / Tailwind CSS design configuration
└── tsconfig.json                       # TypeScript configuration with @/* path aliases
```

---

## Getting Started
## 💻 Getting Started

### 1. Prerequisites

- **Node.js:** v18 or later (v20+ recommended)
- **NPM:** v9 or later
- **Expo CLI:** `npx expo`

### 2. Install Dependencies

### 2. Installation
```bash
npm install
```

### 3. Run in Development (Expo Go / Simulator)

```bash
npx expo start
```

- In Expo Go, the app automatically runs in **Simulation Mode**, streaming realistic simulated ECG waveforms and multi-sensor data so you can test all screens without needing hardware.

---

## Compiling Standalone Android APK
## 📦 Compiling Standalone Android APK

Because `react-native-ble-plx` requires native Android Bluetooth drivers (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, C++/JNI bindings), building an APK is required for actual field hardware testing:
Because `react-native-ble-plx` requires native Android Bluetooth drivers (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`), compiling a standalone `.apk` is required for physical ESP32 hardware testing:

### Option A: EAS Cloud Build (Recommended)

```bash
# 1. Install EAS CLI if not already installed
npm install -g eas-cli

# 2. Login to your Expo account
# 1. Login to your Expo account
npx eas-cli login

# 3. Build standalone APK
# 2. Build standalone APK
npx eas-cli build -p android --profile preview
```

- EAS will compile the Android APK in the cloud using the profile defined in `eas.json` and generate a direct download link and QR code.
> **Build Optimization:** The build is pre-configured with `REACT_NATIVE_ARCHITECTURES=arm64-v8a` via `eas.json` and `plugins/withReactNativeArchitectures.js`. This skips compiling unused emulator C++ binaries (`x86`, `x86_64`, `armeabi-v7a`), cutting cloud build times down by over 60%.

### Option B: Local Android Build

```bash
# 1. Generate native android/ directory
npx expo prebuild --platform android

# 2. Compile release APK with Gradle
cd android
./gradlew assembleRelease
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

- Output APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## 100% Offline Operation Instructions
## 🔄 Merging into Upstream ([SIH_GLAH10_BrajCoders](https://github.com/Sahil073/SIH_GLAH10_BrajCoders))

Once the APK is installed on your Android device:
When integrating this sub-repository into the main repository:

1. Turn **Wi-Fi OFF** and **Mobile Data OFF** on the phone.
1. **BLE Module:** Copy or merge the self-contained `src/ble/` directory.
2. **UI Screen:** The `connect-device.tsx` screen communicates solely through `useBleConnection()` from `@/ble`.
3. **Telemetry Adapter:** The `src/hooks/useDashboardData.ts` hook consumes `@/ble` to power all UI dashboard vitals.
4. **Dependencies:** Ensure `react-native-ble-plx` and `base-64` are included in `package.json`.
5. **Permissions:** Ensure Bluetooth permissions and config plugin are included in `app.json`.
6. Refer to [`src/ble/README.md`](src/ble/README.md) for full step-by-step upstream integration instructions.

---

## 📴 100% Offline Hardware Operation

Once the APK is installed on your physical Android phone:

1. Turn **Wi-Fi OFF** and **Mobile Data OFF**.
2. Turn **Bluetooth ON**.
3. Power on the ESP32 sensor module (LED lights up).
3. Power on the ESP32 wearable sensor hub.
4. Launch **Sanjeevni**.
5. The application will discover `ESP32_SENSOR_HUB_BLE`, negotiate MTU 512, and start streaming live health telemetry with **zero internet, zero Wi-Fi, and zero USB cables**.
5. The application will discover `ESP32_SENSOR_HUB_BLE`, negotiate MTU 512, and start streaming live health telemetry with **zero internet, zero Wi-Fi, and zero cables**.
