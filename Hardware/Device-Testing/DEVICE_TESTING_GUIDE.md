# Sanjeevni Hardware Device Testing & Verification Guide

> **Project:** SIH GLAH10 — BrajCoders  
> **Subsystem:** Wearable Sensor Hub Hardware Testing (`Hardware/Device-Testing/`)  
> **Target Hardware:** ESP32 (DevKit V1 / WROOM-32D), BioAmp EXG Pill, ADXL345, DHT11, MQ135, Conductive Sweat Electrode  
> **Mobile App Target:** Sanjeevni Mobile Telemetry & Edge AI App  

---

## 1. Overview & Test Architecture

Before deploying the unified **`ESP32_Sensor_Hub.ino`** firmware, every hardware sensor and communication interface was subjected to isolated component testing. This modular testing strategy guarantees that electrical shorts, bus contention, timing jitter, or sensor miswiring are discovered and resolved in isolation.

Device testing is organized into two distinct verification tiers:

```
                      ┌────────────────────────────────────────┐
                      │ Tier 1: Standalone Hardware Diagnostics│
                      │       (USB Serial @ 115200 Baud)       │
                      │  • Verify I2C, ADC, digital timing     │
                      │  • Check power, ground & pull-ups      │
                      │  • View live waveforms in Serial Plotter│
                      └──────────────────┬─────────────────────┘
                                         │ Passed
                                         ▼
                      ┌────────────────────────────────────────┐
                      │ Tier 2: Dedicated Component BLE Tests  │
                      │    (Nordic UART Service - Protocol v1) │
                      │  • Exact JSON schema matching Hub      │
                      │  • Test throughput, MTU & notifications│
                      │  • Verify parsing in mobile app        │
                      └──────────────────┬─────────────────────┘
                                         │ Passed
                                         ▼
                      ┌────────────────────────────────────────┐
                      │ Tier 3: Unified ESP32_Sensor_Hub.ino   │
                      │  • Concurrent 500 Hz EXG acquisition   │
                      │  • Multi-sensor scheduling & fusion    │
                      │  • Continuous transmission to Edge AI  │
                      └────────────────────────────────────────┘
```

---

## 2. Directory Structure & Sketch Inventory

The `Device-Testing/` directory contains standalone diagnostic sketches and individual BLE test sketches:

| Folder | Sketch | Type | Target Sensor / Purpose | Protocol / Output |
|---|---|---|---|---|
| `Bioamp_EXG/` | `Bioamp_EXG.ino` | **Standalone** | BioAmp EXG Pill | Raw 12-bit ADC integer over USB Serial (Serial Plotter) |
| `Bioamp_EXG_Bluetooth/` | `Bioamp_EXG_Bluetooth.ino` | **BLE** | BioAmp EXG Pill | Protocol v1 JSON (Sensor 1, 500 Hz, 128-sample chunked) |
| `ADXL345/` | `ADXL345.ino` | **Standalone** | ADXL345 3-Axis Accelerometer | X, Y, Z acceleration + Vector Magnitude over USB Serial |
| `ADXL_Bluetooth/` | `ADXL_Bluetooth.ino` | **BLE** | ADXL345 3-Axis Accelerometer | Protocol v1 JSON (Sensor 2, 25 Hz transmission) |
| `DHT11/` | `DHT11.ino` | **Standalone** | DHT11 Temp & Humidity | Temp (°C), Humidity (%), Heat Index over USB Serial |
| `DHT_Bluetooth/` | `DHT_Bluetooth.ino` | **BLE** | DHT11 Temp & Humidity | Protocol v1 JSON (Sensor 3, 0.5 Hz transmission) |
| `MQ135/` | `MQ135.ino` | **Standalone** | MQ135 Hazardous Gas | 10-sample smoothed ADC & estimated AQI over USB Serial |
| `MQ135_Bluetooth/` | `MQ135_Bluetooth.ino` | **BLE** | MQ135 Hazardous Gas | Protocol v1 JSON (Sensor 4, 1 Hz transmission) |
| `Moisture/` | `Moisture.ino` | **Standalone** | Sweat / Skin Moisture | 10-sample smoothed ADC & 0-100% moisture over USB Serial |
| `Moisture_Bluetooth/` | `Moisture_Bluetooth.ino` | **BLE** | Sweat / Skin Moisture | Protocol v1 JSON (Sensor 5, 0.5 Hz transmission) |
| `Bluetooth/` | `Bluetooth.ino` | **BLE Utility** | BLE Stack Loopback | Nordic UART Service bidirectional echo / latency test |
| `LED/` | `LED.ino` | **Diagnostic** | Status GPIO / LED | Visual blink and sanity check for ESP32 GPIOs |

---

## 3. Protocol v1 Specification (Identical to `ESP32_Sensor_Hub.ino`)

All Bluetooth test sketches have been synchronized to transmit newline-delimited JSON matching the exact schema consumed by the Sanjeevni mobile application ([`packetParser.ts`](../../mobile-app/src/ble/packetParser.ts)):

### GATT Service Configuration
- **Device Advertising Name:** `ESP32_SENSOR_HUB_BLE`
- **Nordic UART Service (NUS) UUID:** `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
- **TX Characteristic (Notify):** `6E400003-B5A3-F393-E0A9-E50E24DCCA9E`
- **RX Characteristic (Write):** `6E400002-B5A3-F393-E0A9-E50E24DCCA9E`
- **Negotiated MTU:** Up to 517 bytes (with safe 128-byte packet chunking for large buffers)

### Sensor Packet Schemas

```json
// 1. BioAmp EXG Pill (Sensor ID 1) — 500 Hz Biopotential Stream
{"v":1,"sensor":1,"seq":705,"ts":181482,"rate":500,"samples":[1470,1453,1424,1387,1360,1377,...]}

// 2. ADXL345 Accelerometer (Sensor ID 2) — 25 Hz Motion Stream
{"v":1,"sensor":2,"seq":4518,"ts":181483,"data":{"x":1.65,"y":-3.61,"z":-11.02}}

// 3. DHT11 Temp & Humidity (Sensor ID 3) — 0.5 Hz Thermal Stream
{"v":1,"sensor":3,"seq":90,"ts":182749,"data":{"temperature":24.8,"humidity":47.7}}

// 4. MQ135 Gas / Air Quality (Sensor ID 4) — 1 Hz Environmental Stream
{"v":1,"sensor":4,"seq":180,"ts":181751,"data":{"raw":906}}

// 5. Soil / Sweat Moisture (Sensor ID 5) — 0.5 Hz Hydration Stream
{"v":1,"sensor":5,"seq":90,"ts":182752,"data":{"raw":4095}}
```

---

## 4. Dissection of Field Telemetry (`sample_data.txt`)

The file [`Hardware/sample_data.txt`](../sample_data.txt) contains 1,130 lines of real telemetry captured live from the ESP32. Analysis of this file provides proof of hardware functionality:

### 1. Packet Interleaving & Asynchronous Transmission
In lines 1–10 of `sample_data.txt`:
```json
{"v":1,"sensor":1,"seq":705,"ts":181482,"rate":500,"samples":[1470,1453,1424,1387,...]}
{"v":1,"sensor":2,"seq":4518,"ts":181483,"data":{"x":1.65,"y":-3.61,"z":-11.02}}
{"v":1,"sensor":2,"seq":4519,"ts":181523,"data":{"x":1.57,"y":-3.22,"z":-10.43}}
{"v":1,"sensor":2,"seq":4520,"ts":181563,"data":{"x":1.92,"y":-3.26,"z":-10.32}}
{"v":1,"sensor":2,"seq":4521,"ts":181603,"data":{"x":1.84,"y":-4.86,"z":-9.89}}
{"v":1,"sensor":2,"seq":4522,"ts":181643,"data":{"x":1.96,"y":-3.53,"z":-10.28}}
{"v":1,"sensor":2,"seq":4523,"ts":181683,"data":{"x":1.84,"y":-3.41,"z":-10.47}}
{"v":1,"sensor":2,"seq":4524,"ts":181723,"data":{"x":1.8,"y":-3.3,"z":-10.24}}
{"v":1,"sensor":1,"seq":706,"ts":181738,"rate":500,"samples":[1707,1723,1723,1686,...]}
{"v":1,"sensor":4,"seq":180,"ts":181751,"data":{"raw":906}}
```

**Key Observations:**
1. **Sequence Number Tracking**:
   - `sensor 2` (ADXL345) increments sequentially: `4518` $\to$ `4519` $\to$ `4520` $\to$ `4521` $\to$ `4522` $\to$ `4523` $\to$ `4524`. Exactly 0 lost packets!
   - `sensor 1` (EXG) increments from `705` to `706`.
   - `sensor 4` (MQ135) increments at `seq: 180`.
2. **Timing Consistency**:
   - ADXL timestamps advance by exactly 40 ms: $181483 \to 181523 \to 181563 \to 181603$ ($= 25\text{ Hz}$).
   - EXG timestamps advance by 256 ms: $181738 - 181482 = 256\text{ ms}$ ($= 128 \text{ samples} \times 2\text{ ms} = 500\text{ Hz}$).
3. **Electrode Coupling Dynamics**:
   - In lines 1–9, the EXG biopotential oscillates smoothly between `1300` and `1800` counts (~1.0V to 1.45V), reflecting active ECG biopotential capture.
   - In line 42, samples saturate at `4095`, indicating a momentary **Lead-Off / electrode disconnection** event. The mobile app's Signal Quality Index (SQI) algorithm detects this saturation and flags `Noise / Lead-Off` rather than producing false heart rate calculations.
4. **Accelerometer Posture Baseline**:
   - In lines 2–8: $x \approx 1.6\text{ m/s}^2$, $y \approx -3.3\text{ m/s}^2$, $z \approx -10.3\text{ m/s}^2$.
   - Vector magnitude: $|\vec{a}| = \sqrt{1.6^2 + (-3.3)^2 + (-10.3)^2} = \sqrt{2.56 + 10.89 + 106.09} = \sqrt{119.54} \approx 10.93\text{ m/s}^2 \approx 1.11\text{g}$.
   - This verifies the worker was seated / resting with slight tilt against gravity ($1.0\text{g}$).
5. **Environmental Readings**:
   - Line 39: `temperature: 24.8 °C`, `humidity: 47.7 %`.
   - Line 40: MQ135 `raw: 883` (ambient clean air voltage: $(883 / 4095) \times 3.3 = 0.71\text{ V}$).
   - Line 41: Moisture `raw: 4095` (dry garment sensor before sweating occurs).

---

## 5. Step-by-Step Component Verification Procedure

Follow this checklist to test each component independently before flashing `ESP32_Sensor_Hub.ino`:

### Step 1: ADXL345 Verification
1. Upload [`ADXL345/ADXL345.ino`](ADXL345/ADXL345.ino).
2. Open Serial Monitor at `115200 baud`.
3. Verify that sensor returns `[SUCCESS] ADXL345 detected`.
4. Place board flat: verify $Z \approx 9.8\text{ m/s}^2$, $X \approx 0$, $Y \approx 0$.
5. Next, upload [`ADXL_Bluetooth/ADXL_Bluetooth.ino`](ADXL_Bluetooth/ADXL_Bluetooth.ino) and verify the Sanjeevni mobile app connects and plots live acceleration.

### Step 2: BioAmp EXG Pill Verification
1. Upload [`Bioamp_EXG/Bioamp_EXG.ino`](Bioamp_EXG/Bioamp_EXG.ino).
2. Open Arduino Serial Plotter (Tools $\to$ Serial Plotter) at `115200 baud`.
3. Connect gel electrodes to skin (Lead I configuration).
4. Verify clear biopotential baseline centered around 1800–2200 counts with periodic QRS spikes.
5. Next, upload [`Bioamp_EXG_Bluetooth/Bioamp_EXG_Bluetooth.ino`](Bioamp_EXG_Bluetooth/Bioamp_EXG_Bluetooth.ino) and open the mobile app's **Real-Time ECG Oscilloscope** to observe the live 500 Hz waveform.

### Step 3: DHT11 Thermal Verification
1. Upload [`DHT11/DHT11.ino`](DHT11/DHT11.ino).
2. Verify Serial output updates every 2.5 seconds with room temperature (~20–30°C) and humidity (~40–70%).
3. Upload [`DHT_Bluetooth/DHT_Bluetooth.ino`](DHT_Bluetooth/DHT_Bluetooth.ino) and check that the mobile app updates the Temperature card.

### Step 4: MQ135 Air Quality Verification
1. Upload [`MQ135/MQ135.ino`](MQ135/MQ135.ino).
2. Verify 5V power supply to heater (sensor should become warm to the touch after 2 minutes).
3. Confirm clean air ADC reading is between 600 and 1200 counts.
4. Upload [`MQ135_Bluetooth/MQ135_Bluetooth.ino`](MQ135_Bluetooth/MQ135_Bluetooth.ino).

### Step 5: Moisture / Sweat Electrode Verification
1. Upload [`Moisture/Moisture.ino`](Moisture/Moisture.ino).
2. Open air should read ~4095 counts (Dry). Touching damp cloth or skin should cause ADC to drop below 2000 counts.
3. Upload [`Moisture_Bluetooth/Moisture_Bluetooth.ino`](Moisture_Bluetooth/Moisture_Bluetooth.ino).

### Step 6: Full Hub Integration
Once all 5 sensors pass standalone and individual BLE tests, flash [`ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino`](../ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino) to run the full concurrent 5-sensor system.
