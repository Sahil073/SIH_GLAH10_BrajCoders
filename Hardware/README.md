# Hardware Subsystem — ESP32 Sensor Hub

This directory contains the firmware, modular hardware testing suite, KiCad custom PCB designs, and hardware documentation for the Sanjeevni wearable device.

---

## Directory Structure

```text
Hardware/
├── ESP32_Sensor_Hub/              # Production multi-sensor BLE GATT firmware
│   └── ESP32_Sensor_Hub.ino       # Non-blocking multi-rate scheduler and NUS streamer
├── Device-Testing/                # Modular 2-tier testing sketches & verification guide
│   ├── ADXL345/                   # Standalone I2C accelerometer diagnostic
│   ├── ADXL_Bluetooth/            # Component-level BLE test for ADXL345 (25 Hz)
│   ├── Bioamp_EXG/                # Standalone biopotential ADC diagnostic (Serial Plotter)
│   ├── Bioamp_EXG_Bluetooth/      # Component-level BLE test for BioAmp EXG (500 Hz, 128-sample chunks)
│   ├── Bluetooth/                 # BLE NUS bidirectional loopback and throughput test
│   ├── DHT11/                     # Standalone digital temperature and humidity diagnostic
│   ├── DHT_Bluetooth/             # Component-level BLE test for DHT11 (0.5 Hz)
│   ├── LED/                       # GPIO driver and ESP32 clock sanity check
│   ├── MQ135/                     # Standalone hazardous gas ADC diagnostic
│   ├── MQ135_Bluetooth/           # Component-level BLE test for MQ135 (1 Hz)
│   ├── Moisture/                  # Standalone skin/soil moisture ADC diagnostic
│   ├── Moisture_Bluetooth/        # Component-level BLE test for moisture sensor (0.5 Hz)
│   └── DEVICE_TESTING_GUIDE.md    # Complete test procedure and output reference
├── Sanjeevni_PCB/                 # Custom hardware PCB design files
│   ├── Sanjeevni_PCB.kicad_sch    # KiCad schematic
│   ├── Sanjeevni_PCB.kicad_pcb    # KiCad 2-layer PCB layout
│   ├── PCB schema.pdf             # Exported schematic PDF
│   ├── PCB design.pdf             # Exported board layout PDF
│   ├── PCB_Design_Guide.md        # Circuit theory, BOM, and assembly guide
│   ├── README.md                  # PCB folder overview and layer stackup
│   └── images/                    # 3D renders (top view, isometric views)
├── HARDWARE_DOCS.md               # Detailed hardware specification and electrical reference
└── sample_data.txt                # 1,130 lines of live captured telemetry from field testing
```

---

## Sensor Interface & Pin Allocations

These pin allocations are strictly adhered to by the production firmware [`ESP32_Sensor_Hub.ino`](ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino) and all Tier 2 BLE testing sketches:

| Sensor Module | Physical Interface | ESP32 GPIO | Channel / Type | Sampling Rate | BLE Transmission Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BioAmp EXG Pill** | Analog Voltage Out | `GPIO 34` | ADC1_CH6 (Input-only) | 500 Hz (2 ms period via `micros()`) | ~3.9 Hz (128 samples / packet) |
| **ADXL345** | I2C (Address `0x53`) | `GPIO 21` (SDA)<br>`GPIO 22` (SCL) | Hardware I2C | 100 Hz (10 ms period) | 25 Hz (40 ms period) |
| **DHT11** | Proprietary 1-Wire | `GPIO 4` | Digital I/O | 0.5 Hz (2000 ms period) | 0.5 Hz |
| **MQ135** | Analog Voltage Out | `GPIO 35` | ADC1_CH7 (Input-only) | 10 Hz (100 ms period) | 1 Hz (10-sample rolling average) |
| **Moisture Sensor** | Analog Voltage Out | `GPIO 32` | ADC1_CH4 (ADC + Digital) | 10 Hz (100 ms period) | 0.5 Hz (10-sample rolling average) |

> **ADC Note:** All analog sensors use ADC1 pins (`GPIO 32`, `34`, `35`). In ESP32 microcontrollers, ADC2 cannot be used simultaneously with active Wi-Fi or Bluetooth Low Energy due to internal RF hardware multiplexing.

---

## Bluetooth Low Energy Protocol (NUS)

The ESP32 firmware operates as a BLE GATT Server running the **Nordic UART Service (NUS)**:

- **Advertised Peripheral Name:** `ESP32_SENSOR_HUB_BLE`
- **Primary Service UUID:** `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
- **TX Characteristic (Notify):** `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` (Descriptor: `0x2902`)
- **RX Characteristic (Write):** `6E400002-B5A3-F393-E0A9-E50E24DCCA9E`
- **Negotiated MTU:** 517 bytes (`BLEDevice::setMTU(517)`)
- **Chunking:** Payloads are split into max 128-byte notifications with 2 ms yields to prevent notify buffer congestion.
- **Framing:** Compact JSON terminated by `\n` (newline).

### Packet Format Overview

Every packet includes version `"v": 1`, a numeric `"sensor"` ID (1–5), an independent per-sensor sequence number `"seq"`, and uptime `"ts"` in milliseconds:

```json
// Sensor 1: BioAmp EXG (500 Hz batch)
{"v":1,"sensor":1,"seq":104,"ts":181482,"rate":500,"samples":[2048,2060,2090,2085,...]}

// Sensor 2: ADXL345 Accelerometer (m/s²)
{"v":1,"sensor":2,"seq":4518,"ts":181483,"data":{"x":0.15,"y":-0.22,"z":9.81}}

// Sensor 3: DHT11 Temperature & Humidity
{"v":1,"sensor":3,"seq":120,"ts":181500,"data":{"temperature":32.5,"humidity":68.0}}

// Sensor 4: MQ135 Air Quality (raw 12-bit ADC)
{"v":1,"sensor":4,"seq":180,"ts":181751,"data":{"raw":480}}

// Sensor 5: Moisture (raw 12-bit ADC)
{"v":1,"sensor":5,"seq":95,"ts":181800,"data":{"raw":520}}
```

---

## Flashing Instructions

### Required Environment
- **Arduino IDE**: Version 2.0 or higher
- **Board Package**: `esp32` by Espressif Systems (v2.0.x or v3.0.x)
- **Board Selection**: `Tools > Board > esp32 > ESP32 Dev Module`
- **Upload Settings**:
  - Upload Speed: `921600`
  - CPU Frequency: `240MHz`
  - Flash Frequency: `80MHz`
  - Flash Mode: `QIO`
  - Partition Scheme: `Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)`

### Required Arduino Libraries
Install these via the Arduino Library Manager (`Ctrl+Shift+I` / `Cmd+Shift+I`):
1. `Adafruit ADXL345` (Unified accelerometer driver)
2. `Adafruit Unified Sensor` (Base sensor abstraction)
3. `DHT sensor library` by Adafruit
4. `ArduinoJson` by Benoit Blanchon (version 6.x or 7.x)

The BLE stack (`BLEDevice`, `BLEServer`, `BLEUtils`, `BLE2902`) and `Wire` are included in the ESP32 core.

---

## Verification Workflow

1. **Standalone Validation**:
   Follow [`Device-Testing/DEVICE_TESTING_GUIDE.md`](Device-Testing/DEVICE_TESTING_GUIDE.md) to flash the standalone sketches (`ADXL345.ino`, `Bioamp_EXG.ino`, `DHT11.ino`, `MQ135.ino`, `Moisture.ino`) and view live physical metrics on the Serial Plotter (115200 baud).
2. **BLE Validation**:
   Flash the corresponding `*_Bluetooth.ino` sketches to verify BLE GATT discovery, characteristic subscriptions, and packet throughput.
3. **Full Integration**:
   Flash [`ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino`](ESP32_Sensor_Hub/ESP32_Sensor_Hub.ino). Verify serial output confirms all sensors initialized, then connect using the Sanjeevni mobile application.
4. **Captured Telemetry**:
   Review [`sample_data.txt`](sample_data.txt) for real-world serial logs and payload samples recorded during field testing.

