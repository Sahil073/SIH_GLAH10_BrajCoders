# Hardware Documentation — ESP32 Sensor System

> **Project:** SIH GLAH10 BrajCoders
> **Target MCU:** Classic ESP32 (ESP32-WROOM / DevKit V1), Arduino framework
> **Transport:** Bluetooth Classic SPP (`BluetoothSerial`)
> **Full integration sketch:** [`Hardware/Device-Testing/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino`](Device-Testing/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino)

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
11. [Known Notes and Caveats](#11-known-notes-and-caveats)

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
   Bluetooth Classic SPP
   Device name: ESP32_SENSOR_HUB
          |
          ▼
   Android / Windows client
          |
          ▼
   JSON packets (newline-delimited)
```

The ESP32 acquires sensor data continuously regardless of Bluetooth connection
state. Bluetooth transmission is conditional — if no client is connected, data
is silently discarded (bounded buffer, no unbounded queuing).

---

## 2. MCU — ESP32

| Property        | Value                                     |
| --------------- | ----------------------------------------- |
| Chip            | ESP32 (Xtensa LX6 dual-core)              |
| Board           | ESP32-WROOM / DevKit V1                   |
| Framework       | Arduino                                   |
| Bluetooth       | Classic Bluetooth SPP (`BluetoothSerial`) |
| ADC resolution  | 12-bit (0–4095 across 0–3.3 V)            |
| I2C             | Remappable; SDA=GPIO 21, SCL=GPIO 22      |
| USB Serial baud | 115200                                    |

> **Important:** Bluetooth Classic SPP is available **only** on the original
> ESP32 chip. It is **not** available on ESP32-S2, S3, or C3. Do not replace
> the chip variant without updating the Bluetooth architecture.

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

| Library                               | Used by               | Source                        |
| ------------------------------------- | --------------------- | ----------------------------- |
| `BluetoothSerial`                     | All BT sketches + hub | ESP32 Arduino core (built-in) |
| `Wire`                                | ADXL345               | ESP32 Arduino core (built-in) |
| `Adafruit_Sensor`                     | ADXL345               | Arduino Library Manager       |
| `Adafruit_ADXL345_U`                  | ADXL345               | Arduino Library Manager       |
| `DHT.h` (Adafruit DHT sensor library) | DHT11                 | Arduino Library Manager       |
| `ArduinoJson`                         | ESP32_Sensor_Hub only | Arduino Library Manager       |

> `BluetoothSerial` and `Wire` are bundled with the ESP32 Arduino core —
> no separate installation is needed for them.

---

## 6. Device Testing Sketches

These sketches are individual sensor validation programs. Each tests one sensor
(or one capability) in isolation. They use plain-text CSV data formats over
Bluetooth — **not** the JSON protocol used by the full integration.

| Sketch                     | Location                | Sensor / Feature           | BT device name  | Data format                           | Rate    |
| -------------------------- | ----------------------- | -------------------------- | --------------- | ------------------------------------- | ------- |
| `LED.ino`                  | `LED/`                  | Onboard LED blink          | — (no BT)       | —                                     | 0.5 Hz  |
| `Bluetooth.ino`            | `Bluetooth/`            | BT Classic connectivity    | `ESP32_TEST`    | `TEST DATA: <counter>`                | 1 Hz    |
| `Bioamp_EXG.ino`           | `Bioamp_EXG/`           | EXG Pill (USB Serial only) | — (no BT)       | `<integer>` per line                  | ~100 Hz |
| `Bioamp_EXG_Bluetooth.ino` | `Bioamp_EXG_Bluetooth/` | EXG Pill + BT              | `ESP32_EXG`     | `EXG,<integer>`                       | ~100 Hz |
| `ADXL_Bluetooth.ino`       | `ADXL_Bluetooth/`       | ADXL345 + BT               | `ESP32_ADXL345` | `ADXL345,<x>,<y>,<z>`                 | ~10 Hz  |
| `DHT_Bluetooth.ino`        | `DHT_Bluetooth/`        | DHT11 + BT                 | `ESP32_DHT11`   | `Temperature: <t> C, Humidity: <h> %` | 0.5 Hz  |
| `MQ135_Bluetooth.ino`      | `MQ135_Bluetooth/`      | MQ135 + BT                 | `ESP32_MQ135`   | `MQ135,<integer>`                     | 2 Hz    |
| `Moisture_Bluetooth.ino`   | `Moisture_Bluetooth/`   | Soil moisture + BT         | `ESP32_SOIL`    | `SOIL,<integer>`                      | 1 Hz    |

> **Note on test sketch pin differences:**
> `MQ135_Bluetooth.ino` uses GPIO **34** (not 35).
> `Moisture_Bluetooth.ino` uses GPIO **34** (not 32).
> These differ from the integration pin assignments. Update the `#define` in
> each test sketch if you want them to match the integration wiring.

---

## 7. Full Integration — ESP32_Sensor_Hub

**File:** [`Device-Testing/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino`](Device-Testing/ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino)

### Architecture

- **Non-blocking multi-rate scheduler** using `millis()` and `micros()`.
- **No `delay()` in `loop()`** — all rate control is timer-based.
- EXG acquisition is the highest-priority task; checked on every loop iteration.
- All sensors acquire data independently of Bluetooth connection state.
- Bluetooth transmission is guarded by `if (SerialBT.hasClient())`.
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

| Property         | Value                                     |
| ---------------- | ----------------------------------------- |
| Protocol         | Bluetooth Classic SPP (RFCOMM)            |
| Library          | `BluetoothSerial` (ESP32 Arduino core)    |
| Device name      | `ESP32_SENSOR_HUB`                        |
| Data format      | Compact JSON                              |
| Packet delimiter | Newline character `\n`                    |
| Protocol version | `"v": 1` (fixed; present in every packet) |

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

## 11. Known Notes and Caveats

| Item                           | Detail                                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MQ135 voltage**              | The MQ135 AO output can exceed 3.3 V. Verify your module's output range before connecting to ESP32.                                                       |
| **MQ135 warm-up**              | Allow at least 3–5 minutes after power-on; 24–48 hours for full stabilisation.                                                                            |
| **Test sketch pin difference** | `MQ135_Bluetooth.ino` and `Moisture_Bluetooth.ino` both use GPIO 34 (original test wiring). The full integration uses GPIO 35 (MQ135) and GPIO 32 (soil). |
| **DHT11 pull-up**              | Bare DHT11 (not a module) needs a 10 kΩ pull-up between DATA and VCC.                                                                                     |
| **`ts` is NOT Unix time**      | All `"ts"` values are `millis()` uptime. Record wall-clock time of first connection on the receiving side.                                                |
| **Bluetooth Classic only**     | `BluetoothSerial` is available only on the original ESP32 chip — not on S2, S3, or C3.                                                                    |
| **EXG signal quality**         | Electrode contact quality, EMI, and power supply noise directly affect EXG ADC readings.                                                                  |
| **Soil calibration**           | Dry/wet ADC endpoints vary between sensor modules. Calibrate with your specific sensor in known conditions before deriving a percentage.                  |
| **ADXL345 I2C address**        | Default address is 0x53 (SDO=GND). Pull SDO HIGH to use 0x1D if address conflicts with another device.                                                    |
