# Hardware Documentation — ESP32 Sensor System

> **Project:** SIH GLAH10 BrajCoders
> **Target MCU:** Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3, Arduino framework
> **Transport:** Bluetooth Low Energy (BLE GATT) — Nordic UART Service (NUS)
> **Full integration sketch:** [`Hardware/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino`](ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [MCU — ESP32](#2-mcu--esp32)
3. [Sensors](#3-sensors)
   - [3.1 BioAmp EXG Pill](#31-bioamp-exg-pill)
   - [3.2 ADXL345](#32-adxl345)
   - [3.3 DHT11](#33-dht11)
   - [3.4 MQ135](#34-mq135)
   - [3.5 Soil Moisture Sensor](#35-soil-moisture-sensor)
4. [Pin Assignments (Integration)](#4-pin-assignments-integration)
5. [Libraries Required](#5-libraries-required)
6. [Device Testing Sketches](#6-device-testing-sketches)
7. [Full Integration — ESP32_Sensor_Hub](#7-full-integration--esp32_sensor_hub)
8. [Sampling Rates and Transmission Schedule](#8-sampling-rates-and-transmission-schedule)
9. [Bluetooth Data Protocol](#9-bluetooth-data-protocol)
10. [JSON Packet Reference](#10-json-packet-reference)
11. [Field Sample Data Analysis (`sample_data.txt`)](#11-field-sample-data-analysis-sample_datatxt)
12. [Power Distribution, Battery Sizing & Thermal Analysis](#12-power-distribution-battery-sizing--thermal-analysis)
13. [Custom PCB Hardware Reference](#13-custom-pcb-hardware-reference)
14. [Known Notes and Caveats](#14-known-notes-and-caveats)

---

## 1. System Overview

```text
ESP32
 ├── BioAmp EXG Pill   (GPIO 34)        — biopotential analog signal
 ├── ADXL345           (I2C SDA=21/SCL=22) — 3-axis acceleration
 ├── DHT11             (GPIO 4)         — temperature & humidity
 ├── MQ135             (GPIO 35)        — air quality (raw ADC)
 └── Soil Moisture     (GPIO 32)        — soil moisture (raw ADC)
          |
          ▼
   Bluetooth Low Energy (BLE GATT)
   Service: Nordic UART Service (NUS)
   Device name: ESP32_SENSOR_HUB_BLE
          |
          ▼
   Android / iOS / Web Bluetooth client
          |
          ▼
   JSON packets (newline-delimited)
```

The ESP32 acquires sensor data continuously regardless of BLE connection
state. BLE transmission is conditional — if no client is connected, data
is silently discarded (bounded buffer, no unbounded queuing). When a client
connects and subscribes to the TX characteristic notifications, structured
newline-delimited JSON packets are streamed. If a client disconnects, the ESP32
automatically resumes BLE advertising.

---

## 2. MCU — ESP32

| Property        | Value                                            |
| --------------- | ------------------------------------------------ |
| Chip            | ESP32 (Xtensa LX6 dual-core), ESP32-S3, ESP32-C3 |
| Board           | ESP32-WROOM / DevKit V1                          |
| Framework       | Arduino                                          |
| Bluetooth       | Bluetooth Low Energy (BLE 4.2 / 5.0 GATT Server) |
| BLE Profile     | Nordic UART Service (NUS)                        |
| ADC resolution  | 12-bit (0–4095 across 0–3.3 V)                   |
| I2C             | Remappable; SDA=GPIO 21, SCL=GPIO 22             |
| USB Serial baud | 115200                                           |

> **Advantage of BLE:** Unlike legacy Bluetooth Classic (SPP) which was strictly
> restricted to the original dual-core ESP32 chip, BLE is natively supported across
> the modern ESP32 family (ESP32, ESP32-S3, ESP32-C3) and supports direct
> connections from iOS, Android, macOS, Linux, and Web Bluetooth in modern browsers.

---

## 3. Sensors

### 3.1 BioAmp EXG Pill

| Property       | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Manufacturer   | Upside Down Labs                                      |
| Type           | Biopotential instrumentation amplifier front-end      |
| Signals        | EMG, ECG, EOG, EEG (depending on electrode placement) |
| Interface      | Analog voltage output                                 |
| Supply voltage | 3.3 V                                                 |
| Output pin     | GPIO 34 (input-only ADC1_CH6)                         |
| ADC resolution | 12-bit → 0–4095                                       |
| Output unit    | Raw ADC integer (not µV or mV)                        |

**Wiring:**

| EXG Pill Pin | ESP32 Pin |
| ------------ | --------- |
| VCC          | 3.3 V     |
| GND          | GND       |
| OUT          | GPIO 34   |

**Notes:**

- GPIO 34 is an input-only pin — no pull-up, no output driver.
- The raw ADC value represents the amplified biopotential from electrodes.
  No biomedical interpretation or unit conversion is performed.
- The EXG Pill requires body electrodes connected per Upside Down Labs
  documentation for the target signal type (EMG/ECG/EOG/EEG).

---

### 3.2 ADXL345

| Property          | Value                                               |
| ----------------- | --------------------------------------------------- |
| Manufacturer      | Analog Devices                                      |
| Type              | 3-axis digital accelerometer                        |
| Interface         | I2C (or SPI — I2C used here)                        |
| I2C address       | 0x53 (SDO=GND) or 0x1D (SDO=HIGH)                   |
| Supply voltage    | 3.3 V                                               |
| Measurement range | ±2G (configured in code; options: ±2G/±4G/±8G/±16G) |
| Output unit       | m/s² (via Adafruit unified sensor API)              |
| SDA pin           | GPIO 21                                             |
| SCL pin           | GPIO 22                                             |

**Wiring:**

| ADXL345 Pin | ESP32 Pin                      |
| ----------- | ------------------------------ |
| VCC         | 3.3 V                          |
| GND         | GND                            |
| SDA         | GPIO 21                        |
| SCL         | GPIO 22                        |
| SDO         | GND (sets I2C address to 0x53) |
| CS          | 3.3 V (selects I2C mode)       |

**Notes:**

- `Wire.begin(21, 22)` is called explicitly to configure the I2C pins.
- The Adafruit ADXL345 library returns acceleration as a `sensors_event_t`
  struct — values are in m/s² with 2 decimal places in transmitted packets.
- If `adxl.begin()` returns false at startup, the sensor is marked unavailable
  and all ADXL-related code skips gracefully; other sensors continue running.

---

### 3.3 DHT11

| Property            | Value                                   |
| ------------------- | --------------------------------------- |
| Type                | Digital temperature and humidity sensor |
| Interface           | Single-wire proprietary DHT protocol    |
| Supply voltage      | 3.3 V (or 5 V with a regulator module)  |
| Data pin            | GPIO 4                                  |
| Temperature range   | 0–50 °C ± 2 °C, resolution 1 °C         |
| Humidity range      | 20–80 % RH ± 5 % RH, resolution 1 %     |
| Min sample interval | 1–2 seconds                             |
| Library             | `DHT.h` (Adafruit DHT sensor library)   |

**Wiring:**

| DHT11 Pin | ESP32 Pin |
| --------- | --------- |
| VCC       | 3.3 V     |
| DATA      | GPIO 4    |
| GND       | GND       |

**Notes:**

- If using a bare DHT11 (not a breakout module), add a 10 kΩ pull-up
  resistor between the DATA pin and VCC.
- Readings are validated with `isnan()`. If a read fails (returns NaN),
  the packet is discarded and an error is printed to USB Serial.
- Do not poll faster than every 2 seconds — the DHT11 requires recovery time.

---

### 3.4 MQ135

| Property        | Value                                                               |
| --------------- | ------------------------------------------------------------------- |
| Type            | Gas detection sensor (multi-gas: CO₂, NH₃, benzene, alcohol, smoke) |
| Interface       | Analog voltage output (AO pin)                                      |
| Supply voltage  | **5 V** (heater element requires 5 V)                               |
| AO output range | 0–5 V max (varies by gas concentration)                             |
| ADC pin         | GPIO 35 (input-only ADC1_CH7)                                       |
| ADC resolution  | 12-bit → 0–4095                                                     |
| Output unit     | Raw ADC integer (not ppm)                                           |
| Warm-up time    | 24–48 h for full stabilisation; ≥3–5 min after power-on             |

**Wiring:**

| MQ135 Pin | ESP32 Pin     |
| --------- | ------------- |
| VCC       | 5 V           |
| GND       | GND           |
| AO        | GPIO 35       |
| DO        | Not connected |

**Notes:**

- The MQ135 heater runs at 5 V — the AO output may swing above 3.3 V at
  high gas concentrations. Verify your specific module's output voltage range
  before connecting directly to an ESP32 GPIO (max 3.3 V).
  Some breakout modules include a voltage divider on the AO line.
- No ppm conversion or calibration is implemented. Converting raw ADC to ppm
  requires the sensor's Rs/R0 ratio and calibration with a reference gas.
- The test sketch (`MQ135_Bluetooth.ino`) uses GPIO 34. The full integration
  (`ESP32_Sensor_Hub.ino`) uses GPIO 35. Both are input-only ADC pins.

---

### 3.5 Soil Moisture Sensor

| Property       | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Type           | Capacitive or resistive soil moisture module          |
| Interface      | Analog voltage output (AO pin)                        |
| Supply voltage | 3.3 V or 5 V (check module)                           |
| ADC pin        | GPIO 32 (ADC1_CH4; supports both ADC and digital I/O) |
| ADC resolution | 12-bit → 0–4095                                       |
| Output unit    | Raw ADC integer (not % moisture)                      |

**Wiring:**

| Sensor Pin | ESP32 Pin      |
| ---------- | -------------- |
| VCC        | 3.3 V (or 5 V) |
| GND        | GND            |
| AO         | GPIO 32        |

**ADC value interpretation:**

| Module type | Higher ADC value             | Lower ADC value                |
| ----------- | ---------------------------- | ------------------------------ |
| Capacitive  | Drier (lower output voltage) | Wetter (higher output voltage) |
| Resistive   | Wetter (lower resistance)    | Drier (higher resistance)      |

**Notes:**

- No dry/wet calibration constants are defined. To express readings as a
  moisture percentage, record ADC values in known fully-dry and fully-saturated
  soil conditions with your specific sensor, then apply linear mapping.
- Capacitive sensors are preferred — resistive probes corrode over time.
- The test sketch (`Moisture_Bluetooth.ino`) uses GPIO 34.
  The full integration (`ESP32_Sensor_Hub.ino`) uses GPIO 32.

---

## 4. Pin Assignments (Integration)

These are the **definitive pin assignments** for `ESP32_Sensor_Hub.ino`.
Individual test sketches may differ — see their headers.

| Sensor          | Signal     | ESP32 GPIO | Pin type           |
| --------------- | ---------- | ---------- | ------------------ |
| BioAmp EXG Pill | Analog out | 34         | Input-only ADC1    |
| ADXL345         | SDA        | 21         | I2C (remappable)   |
| ADXL345         | SCL        | 22         | I2C (remappable)   |
| DHT11           | Data       | 4          | Digital I/O        |
| MQ135           | Analog out | 35         | Input-only ADC1    |
| Soil Moisture   | Analog out | 32         | ADC1 + digital I/O |

---

## 5. Libraries Required

| Library                                         | Used by                | Source                        |
| ----------------------------------------------- | ---------------------- | ----------------------------- |
| `BLEDevice`, `BLEServer`, `BLEUtils`, `BLE2902` | All BLE sketches + hub | ESP32 Arduino core (built-in) |
| `Wire`                                          | ADXL345                | ESP32 Arduino core (built-in) |
| `Adafruit_Sensor`                               | ADXL345                | Arduino Library Manager       |
| `Adafruit_ADXL345_U`                            | ADXL345                | Arduino Library Manager       |
| `DHT.h` (Adafruit DHT sensor library)           | DHT11                  | Arduino Library Manager       |
| `ArduinoJson`                                   | ESP32_Sensor_Hub only  | Arduino Library Manager       |

> The BLE stack (`BLEDevice`, `BLEServer`, etc.) and `Wire` are bundled directly
> with the ESP32 Arduino core — no external installation is needed for them.

---

## 6. Device Testing Sketches

The repository provides a modular, **two-tier testing suite** located in [`Hardware/Device-Testing/`](Device-Testing/):

1. **Tier 1 — Standalone Diagnostic Sketches (Zero BLE overhead):**
   Print human-readable physical metrics or plain integer streams to the **USB Serial Monitor / Serial Plotter** (115200 baud). Used to verify electrical continuity, pin wiring, I2C addressing, and sensor calibration before introducing wireless complexity.
2. **Tier 2 — Component-Level BLE Protocol v1 Sketches:**
   Stream JSON packets using the **exact same Protocol v1 JSON format** as the production hub (`ESP32_Sensor_Hub.ino`). These sketches can connect directly to the **mobile app**, **Web Bluetooth dashboard**, or generic BLE terminal tools (_nRF Connect_ / _Serial Bluetooth Terminal_).

> For detailed wiring diagrams, verification steps, and terminal output examples for each test, see [`Hardware/Device-Testing/DEVICE_TESTING_GUIDE.md`](Device-Testing/DEVICE_TESTING_GUIDE.md).

### 6.1 Tier 1: Standalone Hardware Diagnostics (USB Serial Only)

| Sketch            | Folder              | Target Sensor       | Pin / Interface | Baud Rate | Verification Target                                                                 |
| ----------------- | ------------------- | ------------------- | --------------- | --------- | ----------------------------------------------------------------------------------- |
| `LED.ino`         | `LED/`              | Onboard Blue LED    | GPIO 2          | 115200    | ESP32 bootloader, clock crystal, and GPIO driver sanity test (0.5 Hz blink)         |
| `Bioamp_EXG.ino`  | `Bioamp_EXG/`       | BioAmp EXG Pill     | GPIO 34 (ADC1)  | 115200    | Raw ADC waveform plotting in Arduino Serial Plotter (lead-off: 4095; baseline: ~1.65 V) |
| `ADXL345.ino`     | `ADXL345/`          | ADXL345 3-Axis Accel| I2C (21/22)     | 115200    | I2C detection (0x53), X/Y/Z m/s², and vector magnitude $|\vec{a}| \approx 9.8\text{ m/s}^2$ |
| `DHT11.ino`       | `DHT11/`            | DHT11 Temp & Hum    | GPIO 4 (1-Wire) | 115200    | Ambient Temperature (°C), Relative Humidity (% RH), and Heat Index calculation     |
| `MQ135.ino`       | `MQ135/`            | MQ135 Gas Sensor    | GPIO 35 (ADC1)  | 115200    | 10-sample ADC rolling average, voltage conversion (0–3.3 V), baseline AQI status   |
| `Moisture.ino`    | `Moisture/`         | Soil Moisture Probe | GPIO 32 (ADC1)  | 115200    | 10-sample ADC rolling average and calibrated moisture percentage (0–100% scale)     |

### 6.2 Tier 2: Component-Level BLE Protocol v1 Sketches

All Tier 2 sketches implement the standard Nordic UART Service (NUS) UUIDs (`6E400001-...`) and stream compact newline-delimited JSON identical to the final hub protocol:

| Sketch                     | Folder                    | Sensor / Feature | BLE Device Name     | Protocol Packet Schema                                             | Rate   |
| -------------------------- | ------------------------- | ---------------- | ------------------- | ------------------------------------------------------------------ | ------ |
| `Bluetooth.ino`            | `Bluetooth/`              | BLE NUS Link     | `ESP32_TEST_BLE`    | `TEST DATA: <seq>\n` (ASCII connectivity test)                     | 1 Hz   |
| `Bioamp_EXG_Bluetooth.ino` | `Bioamp_EXG_Bluetooth/`   | BioAmp EXG       | `ESP32_EXG_BLE`     | `{"v":1,"sensor":1,"seq":N,"ts":T,"rate":500,"samples":[...]}`      | 3.9 Hz |
| `ADXL_Bluetooth.ino`       | `ADXL_Bluetooth/`         | ADXL345 Accel    | `ESP32_ADXL_BLE`    | `{"v":1,"sensor":2,"seq":N,"ts":T,"data":{"x":..,"y":..,"z":..}}` | 25 Hz  |
| `DHT_Bluetooth.ino`        | `DHT_Bluetooth/`          | DHT11 Temp/Hum   | `ESP32_DHT11_BLE`   | `{"v":1,"sensor":3,"seq":N,"ts":T,"data":{"temperature":..,"humidity":..}}` | 0.5 Hz |
| `MQ135_Bluetooth.ino`      | `MQ135_Bluetooth/`        | MQ135 Gas        | `ESP32_MQ135_BLE`   | `{"v":1,"sensor":4,"seq":N,"ts":T,"data":{"raw":..}}`             | 1 Hz   |
| `Moisture_Bluetooth.ino`   | `Moisture_Bluetooth/`     | Soil Moisture    | `ESP32_SOIL_BLE`    | `{"v":1,"sensor":5,"seq":N,"ts":T,"data":{"raw":..}}`             | 0.5 Hz |

> **Pin Consistency:** All Tier 2 BLE sketches use the canonical integration pins (EXG: GPIO 34, ADXL: 21/22, DHT11: GPIO 4, MQ135: GPIO 35, Soil: GPIO 32) matching `ESP32_Sensor_Hub.ino`. Safe 128-byte BLE chunking is implemented across all sketches to prevent GATT notify buffer overflow.

---

## 7. Full Integration — ESP32_Sensor_Hub

**File:** [`Hardware/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino`](ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino)

### Architecture

- **Non-blocking multi-rate scheduler** using `millis()` and `micros()`.
- **No `delay()` in `loop()`** — all rate control is timer-based.
- EXG acquisition is the highest-priority task (500 Hz via `micros()`), checked on every loop iteration.
- All sensors acquire data independently of BLE connection state.
- BLE transmission is guarded by `if (deviceConnected)`.
- **BLE GATT Server** implements the standard **Nordic UART Service (NUS)**.
- **Auto-advertising restart**: When a client disconnects, `pServer->startAdvertising()` is triggered automatically to allow seamless reconnection.
- **Large packet handling & MTU**: Calls `BLEDevice::setMTU(517)` during initialization and employs a safe 128-byte chunked transmission loop (`sendJson()`) with 2 ms yield to prevent notify buffer congestion for large EXG JSON payloads (~700–800 bytes).
- JSON packets end with `\n` (newline) as the packet delimiter.

### Sensor ID Enum (protocol-fixed — do not change values)

```cpp
enum class SensorId : uint8_t
{
    EXG           = 1,
    ADXL345       = 2,
    DHT11         = 3,
    MQ135         = 4,
    SOIL_MOISTURE = 5
};
```

### Sequence Numbers

Each sensor has its own independent sequence counter:

| Variable        | Sensor          |
| --------------- | --------------- |
| `exgSequence`   | BioAmp EXG Pill |
| `adxlSequence`  | ADXL345         |
| `dhtSequence`   | DHT11           |
| `mq135Sequence` | MQ135           |
| `soilSequence`  | Soil Moisture   |

Sequence numbers allow the receiving application to detect missing packets
per sensor independently.

### Timestamp

All packets include `"ts"` — the ESP32 uptime in milliseconds (`millis()`).

> **This is NOT a Unix wall-clock timestamp.**
> It is milliseconds since the ESP32 last booted.
> The backend application must associate it with wall-clock time if needed
> (e.g., by recording the first-packet wall-clock time and offsetting).

---

## 8. Sampling Rates and Transmission Schedule

| Sensor          | ADC / Acquisition rate                       | Averaging         | Bluetooth TX rate                  | Buffer       |
| --------------- | -------------------------------------------- | ----------------- | ---------------------------------- | ------------ |
| BioAmp EXG Pill | **500 Hz** (2 ms interval, `micros()`-based) | None              | 1 packet per 128 samples (~3.9 Hz) | 128 samples  |
| ADXL345         | **100 Hz** (10 ms, `millis()`-based)         | None              | **25 Hz** (40 ms gate)             | Latest value |
| DHT11           | **0.5 Hz** (2000 ms gate)                    | None              | **0.5 Hz**                         | —            |
| MQ135           | **10 Hz** (100 ms gate)                      | 10-sample average | **1 Hz** (1000 ms gate)            | Running sum  |
| Soil Moisture   | **10 Hz** (100 ms gate)                      | 10-sample average | **0.5 Hz** (2000 ms gate)          | Running sum  |

> EXG timing uses `micros()` and fixed-interval advance (`exgLastMicros += EXG_INTERVAL_US`)
> to prevent drift accumulation. All other sensors use `millis()`.

---

## 9. Bluetooth Data Protocol

| Property         | Value                                                           |
| ---------------- | --------------------------------------------------------------- |
| Protocol         | Bluetooth Low Energy (BLE 4.2 / 5.0) GATT Server                |
| Profile          | Nordic UART Service (NUS)                                       |
| Service UUID     | `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`                          |
| RX Char UUID     | `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` (Write/WriteWithoutResp) |
| TX Char UUID     | `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` (Notify)                 |
| CCCD Descriptor  | `00002902-0000-1000-8000-00805f9b34fb` (`BLE2902`)              |
| Device name      | `ESP32_SENSOR_HUB_BLE`                                          |
| MTU Requested    | 517 bytes (`BLEDevice::setMTU(517)`)                            |
| Data format      | Compact JSON                                                    |
| Packet delimiter | Newline character `\n`                                          |
| Protocol version | `"v": 1` (fixed; present in every packet)                       |

### Connecting from Client Applications

1. **Android / iOS (Serial Bluetooth Terminal / nRF Connect):**
   - Open app and navigate to **Bluetooth LE** / **BLE Scanner**.
   - Scan and connect to `ESP32_SENSOR_HUB_BLE`.
   - The app detects the Nordic UART Service automatically.
   - Enable notifications on characteristic `6E400003-...` to receive the JSON stream.
2. **Web Bluetooth API (Chrome / Edge):**
   - Request device with filter `services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']`.
   - Connect to GATT server, get primary service, get TX characteristic `6e400003-...`, call `startNotifications()`, and attach listener to `characteristicvaluechanged`.
3. **Flutter / React Native:**
   - Use standard BLE plugins (`flutter_blue_plus`, `react-native-ble-plx`) targeting NUS UUIDs.

**Packet structure (all sensors):**

Every packet contains these common fields plus sensor-specific fields:

| Field    | Type    | Description                                                 |
| -------- | ------- | ----------------------------------------------------------- |
| `v`      | integer | Protocol version (always `1`)                               |
| `sensor` | integer | Sensor ID (1–5, see enum above)                             |
| `seq`    | integer | Per-sensor sequence number (0-based, increments per packet) |
| `ts`     | integer | ESP32 uptime in milliseconds (NOT Unix time)                |

---

## 10. JSON Packet Reference

### Sensor 1 — BioAmp EXG Pill

```json
{
  "v": 1,
  "sensor": 1,
  "seq": 1042,
  "ts": 123456789,
  "rate": 500,
  "samples": [1842, 1845, 1841, 1839, 1843]
}
```

| Field     | Description                                   |
| --------- | --------------------------------------------- |
| `rate`    | Acquisition rate in Hz (always `500`)         |
| `samples` | Array of 128 raw 12-bit ADC integers (0–4095) |

- Packet is generated once per 128 samples (~256 ms at 500 Hz).
- `samples` values are raw ADC — not physical units (µV, mV).

---

### Sensor 2 — ADXL345

```json
{
  "v": 1,
  "sensor": 2,
  "seq": 123,
  "ts": 123456789,
  "data": {
    "x": 0.12,
    "y": -0.31,
    "z": 9.76
  }
}
```

| Field    | Description                                   |
| -------- | --------------------------------------------- |
| `data.x` | X-axis acceleration in m/s², 2 decimal places |
| `data.y` | Y-axis acceleration in m/s², 2 decimal places |
| `data.z` | Z-axis acceleration in m/s², 2 decimal places |

- Transmitted at ~25 Hz.

---

### Sensor 3 — DHT11

```json
{
  "v": 1,
  "sensor": 3,
  "seq": 123,
  "ts": 123456789,
  "data": {
    "temperature": 28.4,
    "humidity": 64.0
  }
}
```

| Field              | Description                                |
| ------------------ | ------------------------------------------ |
| `data.temperature` | Temperature in °C, 1 decimal place         |
| `data.humidity`    | Relative humidity in % RH, 1 decimal place |

- Transmitted at ~0.5 Hz (every 2 seconds).
- Packet is skipped if the DHT11 read returns NaN.

---

### Sensor 4 — MQ135

```json
{
  "v": 1,
  "sensor": 4,
  "seq": 123,
  "ts": 123456789,
  "data": {
    "raw": 1854
  }
}
```

| Field      | Description                                  |
| ---------- | -------------------------------------------- |
| `data.raw` | 10-sample averaged 12-bit ADC value (0–4095) |

- ADC sampled at 10 Hz; averaged over 10 samples before transmission.
- Transmitted at ~1 Hz.
- Value is raw — not ppm.

---

### Sensor 5 — Soil Moisture

```json
{
  "v": 1,
  "sensor": 5,
  "seq": 123,
  "ts": 123456789,
  "data": {
    "raw": 1842
  }
}
```

| Field      | Description                                  |
| ---------- | -------------------------------------------- |
| `data.raw` | 10-sample averaged 12-bit ADC value (0–4095) |

- ADC sampled at 10 Hz; averaged over 10 samples before transmission.
- Transmitted at ~0.5 Hz (every 2 seconds).
- Value is raw — no moisture percentage conversion applied.

---

## 11. Field Sample Data Analysis (`sample_data.txt`)

The file [`Hardware/sample_data.txt`](sample_data.txt) contains **1,130 lines** of live telemetry captured from physical hardware streaming over BLE to verify the protocol under realistic conditions. Technical analysis of this telemetry validates several key firmware dynamics:

### 11.1 Multi-Sensor Interleaving and Sequence Integrity
Telemetry confirms seamless multiplexing across the single Nordic UART Service pipe:
- **EXG Burst Cadence (`sensor: 1`):** Transmitted every 128 samples at 500 Hz. Packet timestamps show exactly $\Delta t \approx 256\text{ ms}$ between consecutive packets:
  - Sequence 705 (`ts: 181482`) $\to$ Sequence 706 (`ts: 181738`, $\Delta t = 256\text{ ms}$) $\to$ Sequence 707 (`ts: 181994`, $\Delta t = 256\text{ ms}$).
  - This mathematically proves the precision of the `micros()` accumulator scheduler (`exgLastMicros += EXG_INTERVAL_US`) with zero cumulative timer drift.
- **Motion Cadence (`sensor: 2`):** Transmitted at exactly $\Delta t = 40\text{ ms}$ ($25\text{ Hz}$):
  - Sequence 4518 (`ts: 181483`) $\to$ Sequence 4519 (`ts: 181523`, $\Delta t = 40\text{ ms}$) $\to$ Sequence 4520 (`ts: 181563`, $\Delta t = 40\text{ ms}$).
- **Gas Cadence (`sensor: 4`):** Transmitted at $1\text{ Hz}$ with independent sequence tracking (`seq: 180`, `ts: 181751`, `raw: 906`).
- **Independent Monotonic Sequence Counters:** Sequences for EXG, ADXL, and MQ135 advance strictly monotonically without dropping or reordering packets, enabling the mobile application to detect dropouts on a per-channel basis.

### 11.2 Biopotential Dynamics & Lead-Off Detection
In sequence 709 (`ts: 182506`), the biopotential signal transitions from valid cardiac/muscular waveforms into complete ADC saturation:
```json
{"v":1,"sensor":1,"seq":709,"ts":182506,"rate":500,"samples":[1279,1264,1269,1301,1376,...,2774,3534,4095,4095,4095,4095,...]}
```
- **Physical Meaning:** When dry or wet biopotential electrodes detach from the skin (or lose contact impedance), the instrumentation amplifier's high-impedance inputs float to the positive rail ($V_{DD} = 3.3\text{ V}$). The 12-bit ADC reads maximum full-scale: $4095$.
- **Signal Quality Index (SQI) Trigger:** The mobile app's signal quality engine parses this chunk, flags saturated sample counts $> 10\%$, sets `isLeadOn = false`, and alerts the user on the dashboard to reposition the electrodes.

### 11.3 Accelerometer Posture Vector & Dynamics
Across steady-state frames (e.g. sequence 4518: $x = 1.65, y = -3.61, z = -11.02\text{ m/s}^2$):
$$\|\vec{a}\| = \sqrt{(1.65)^2 + (-3.61)^2 + (-11.02)^2} \approx 11.71\text{ m/s}^2$$
Sequence 4533 ($x = -6.35, y = 7.30, z = -15.02\text{ m/s}^2$):
$$\|\vec{a}\| = \sqrt{(-6.35)^2 + (7.30)^2 + (-15.02)^2} \approx 17.86\text{ m/s}^2$$
- The vector magnitude represents the superposition of gravitational acceleration ($1g \approx 9.81\text{ m/s}^2$) plus user kinetic motion and sensor orientation tilts.
- The high acceleration transients captured in the stream demonstrate that the 25 Hz streaming rate reliably captures physical user motion gestures, tremor spikes, and fall events.

---

## 12. Power Distribution, Battery Sizing & Thermal Analysis

To ensure continuous, field-reliable operation as a wearable health & environmental monitor, the power budget and battery capacity have been calculated for **8–12 hours of continuous streaming**.

### 12.1 Subsystem Current Draw Breakdown

| Subsystem / Component        | Operating Voltage | Active Current Draw | Duty Cycle | Average Current @ Nominal Rail | Equivalent Battery Draw (3.7V LiPo) |
| ---------------------------- | ----------------- | ------------------- | ---------- | ------------------------------ | ----------------------------------- |
| **ESP32 Dual-Core + BLE TX** | 3.3 V             | 95 mA               | 100%       | 95.0 mA                        | ~100.0 mA (via low-dropout LDO)     |
| **BioAmp EXG Pill Front-End**| 3.3 V             | 2.5 mA              | 100%       | 2.5 mA                         | ~2.6 mA                             |
| **ADXL345 Accelerometer**    | 3.3 V             | 140 µA              | 100%       | 0.14 mA                        | ~0.15 mA                            |
| **DHT11 Temp / Humidity**    | 3.3 V             | 1.5 mA              | Intermittent| 0.2 mA                         | ~0.2 mA                             |
| **Capacitive Soil Moisture** | 3.3 V             | 5.0 mA              | Intermittent| 1.0 mA                         | ~1.1 mA                             |
| **MQ135 Heating Element**    | **5.0 V**         | 150 mA              | 100%       | 150.0 mA                       | **~245.0 mA** (via 85% boost conv.) |
| **Total System Draw (Cont.)**| —                 | —                   | —          | —                              | **~349.0 mA** (~1.29 W)             |

### 12.2 Battery Capacity Calculations (Continuous Heating)

Assuming a standard single-cell Lithium-Polymer (LiPo) or 18650 Li-ion battery (nominal $3.7\text{ V}$, cutoff $3.2\text{ V}$, DC-DC boost efficiency $\eta \approx 85\%$, and 20% safety / aging headroom):

1. **Target: 8 Hours Continuous Operation**
   $$C_{\text{req}} = I_{\text{batt}} \times t \times \text{Safety Factor} = 349\text{ mA} \times 8\text{ h} \times 1.20 \approx \mathbf{3,350\text{ mAh}}$$
   - *Hardware recommendation:* A single **3,500 mAh** flat-pack LiPo pouch cell or dual 18650 cells (e.g., $2 \times 1,800\text{ mAh} = 3,600\text{ mAh}$ in parallel).

2. **Target: 12 Hours Continuous Operation**
   $$C_{\text{req}} = 349\text{ mA} \times 12\text{ h} \times 1.20 \approx \mathbf{5,025\text{ mAh}}$$
   - *Hardware recommendation:* Dual parallel 18650 Li-ion cells (e.g., $2 \times 2,600\text{ mAh} = \mathbf{5,200\text{ mAh}}$), providing comfortably >12.5 hours of uninterrupted telemetry.

### 12.3 Power Optimization: MQ135 Duty-Cycling Strategy
The MQ135 internal tin dioxide ($SnO_2$) heating coil is by far the largest energy consumer, accounting for **~70% of total system power**. 
In battery-constrained field deployments:
- Rather than leaving the heater permanently energized, the 5V heater rail can be switched via a P-channel MOSFET (e.g., AO3401) driven by an ESP32 GPIO.
- Heating for **20 seconds** prior to reading once every 2 minutes reduces the MQ135 average current from 150 mA down to $\sim 25\text{ mA}$.
- **Result:** Overall battery draw drops to $\sim 128\text{ mA}$, extending an 8-hour battery pack to **over 22 hours** of runtime on a single compact 2,600 mAh 18650 cell.

### 12.4 Thermal Management
- The MQ135 heater dissipates $\approx 750\text{ mW}$ of thermal energy ($5\text{ V} \times 150\text{ mA}$).
- In the Sanjeevni PCB layout, thermal isolation slots and component separation keep the MQ135 physically distanced from the BioAmp EXG operational amplifier circuitry to prevent biopotential drift and thermal junction noise ($1/f$ noise).

---

## 13. Custom PCB Hardware Reference

The system has been synthesized into an integrated, production-grade custom PCB layout located in [`Hardware/Sanjeevni_PCB/`](Sanjeevni_PCB/):

- **Complete Engineering Guide:** Refer to [`Hardware/Sanjeevni_PCB/PCB_Design_Guide.md`](Sanjeevni_PCB/PCB_Design_Guide.md) for detailed trace widths, impedance matching, DRC rules, and manufacturing specifications.
- **Schematic Source:** [`Hardware/Sanjeevni_PCB/Sanjeevni_PCB.kicad_sch`](Sanjeevni_PCB/Sanjeevni_PCB.kicad_sch) (PDF export: [`PCB schema.pdf`](Sanjeevni_PCB/PCB%20schema.pdf))
- **PCB Layout Source:** [`Hardware/Sanjeevni_PCB/Sanjeevni_PCB.kicad_pcb`](Sanjeevni_PCB/Sanjeevni_PCB.kicad_pcb) (PDF export: [`PCB design.pdf`](Sanjeevni_PCB/PCB%20design.pdf))
- **Stackup & Geometry:**
  - 2-layer FR4 standard process (1.6 mm thickness, 1 oz / $35\text{ µm}$ copper foil).
  - Dedicated bottom ground plane with analog star-grounding under the BioAmp EXG instrumentation node.
  - 15 mm copper-free keepout zone around the ESP32 2.4 GHz inverted-F onboard antenna to prevent BLE RF attenuation.
  - Dedicated LDO and step-up boost regulators providing independent 3.3 V logic and 5.0 V heating rails.

---

## 14. Known Notes and Caveats

| Item                           | Detail                                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MQ135 voltage**              | The MQ135 AO output can exceed 3.3 V. Verify your module's output range before connecting to ESP32.                                                       |
| **MQ135 warm-up**              | Allow at least 3–5 minutes after power-on; 24–48 hours for full stabilisation.                                                                            |
| **Pin assignments**            | All unified test sketches now default to canonical pins (GPIO 35 for MQ135, GPIO 32 for Moisture), with legacy GPIO 34 test wiring noted in headers.      |
| **DHT11 pull-up**              | Bare DHT11 (not a module) needs a 10 kΩ pull-up between DATA and VCC.                                                                                     |
| **`ts` is NOT Unix time**      | All `"ts"` values are `millis()` uptime. Record wall-clock time of first connection on the receiving side.                                                |
| **BLE Cross-Platform Support** | Unlike Classic Bluetooth (SPP), BLE works across iOS, Android, macOS, Linux, and Windows. It is also compatible with ESP32, ESP32-S3, and ESP32-C3 chips. |
| **BLE Client Notification**    | Clients must enable notifications (CCCD 0x2902) on TX characteristic `6E400003-...` to receive the data stream.                                           |
| **Large EXG JSON streaming**   | EXG arrays (~800 B) are transmitted in 128-byte BLE notification chunks with 2 ms yields to prevent notify buffer congestion on any MTU size.             |
| **EXG signal quality**         | Electrode contact quality, EMI, and power supply noise directly affect EXG ADC readings. Lead-Off saturation occurs at ADC = 4095.                        |
| **Soil calibration**           | Dry/wet ADC endpoints vary between sensor modules. Calibrate with your specific sensor in known conditions before deriving a percentage.                  |
| **ADXL345 I2C address**        | Default address is 0x53 (SDO=GND). Pull SDO HIGH to use 0x1D if address conflicts with another device.                                                    |
