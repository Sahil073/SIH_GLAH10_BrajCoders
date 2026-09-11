# PCB Design Guide — ESP32 Sensor Hub (Prototype)

> **Purpose:** Prototype PCB design for presentation — shows a plausible,
> credible board layout with all key components. Not intended for
> manufacturing at this stage.
>
> **Tool:** KiCad 7 / KiCad 8
> **Board size:** 80 mm × 60 mm (standard cheap-tier PCB size)

---

## Sensors on This Board

| Block                  | Component                   | Interface            |
| ---------------------- | --------------------------- | -------------------- |
| MCU                    | ESP32-WROOM-32 module       | —                    |
| Biopotential           | BioAmp EXG Pill (as module) | Analog → GPIO 34     |
| Accelerometer          | ADXL345                     | I2C (SDA=21, SCL=22) |
| Temperature / Humidity | DHT11                       | Digital → GPIO 4     |
| Air Quality            | MQ135                       | Analog → GPIO 35     |
| Power                  | USB Type-C + AMS1117-3.3    | 5V → 3.3V            |
| USB Programming        | CP2102N or CH340C           | UART → ESP32         |

> **Note:** Soil moisture sensor is **not included** on this PCB.
> It was used in the prototype testing phase only as a stand-in for a
> sweat/perspiration sensor. The final product would use a dedicated
> bioimpedance or sweat sensor module in that role.

---

## Component Placement (Board Layout)

```text
┌──────────────────────────────────────────────┐
│  [USB-C]  [CP2102N]  [AMS1117-3.3]           │
│  ─────────────────────────────────────────── │
│                                              │
│           ESP32-WROOM-32                    │
│           (centre of board)                 │
│                                              │
│  ─────────────────────────────────────────── │
│  [ADXL345]   [DHT11]   [BOOT] [RESET]       │
│  ─────────────────────────────────────────── │
│  [BioAmp EXG Pill module]   [MQ135 element] │
│  [Electrode header J1]                      │
└──────────────────────────────────────────────┘
```

- **Top section** — power input, USB programming chip, voltage regulator
- **Centre** — ESP32 module (the largest component; everything connects to it)
- **Bottom-left** — EXG Pill module on pin headers, electrode connector
- **Bottom-right** — MQ135 sensing element (near board edge for airflow)
- **Middle row** — ADXL345, DHT11, push buttons

---

## Power Supply

```text
USB Type-C (5V)
  │
  ├──────────────────────────────── 5V rail → MQ135 heater
  │
  └── AMS1117-3.3 (LDO regulator)
            │
            └──────────────────── 3.3V rail → ESP32, ADXL345, DHT11, EXG Pill
```

- USB Type-C provides 5V
- AMS1117-3.3 converts it to 3.3V for the ESP32 and all 3.3V sensors
- MQ135 heater element runs directly from 5V (it needs 5V — not 3.3V)
- Add 100 µF bulk capacitor on the 5V line near the MQ135

---

## Key Connections (Schematic Summary)

### ESP32 GPIO Assignments

| GPIO        | Connected to                              |
| ----------- | ----------------------------------------- |
| GPIO 34     | BioAmp EXG Pill analog output             |
| GPIO 21     | ADXL345 SDA                               |
| GPIO 22     | ADXL345 SCL                               |
| GPIO 4      | DHT11 DATA                                |
| GPIO 35     | MQ135 analog output (via voltage divider) |
| GPIO 1 (TX) | CP2102N RX                                |
| GPIO 3 (RX) | CP2102N TX                                |
| GPIO 0      | BOOT button (pull to GND to flash)        |
| EN          | RESET button                              |

### BioAmp EXG Pill

Mounted as a **module on 2.54mm pin headers** — not as bare IC.
Connect its analog output pin directly to GPIO 34.
Add a 3-pin electrode connector (IN+, IN−, REF) on the board edge.

```text
Electrode connector (J1)  →  EXG Pill module  →  GPIO 34 (ESP32)
```

### ADXL345

```text
3.3V ──[100nF cap]── ADXL345 VCC
SDA  ──[4.7kΩ to 3.3V]── GPIO 21
SCL  ──[4.7kΩ to 3.3V]── GPIO 22
SDO  ── GND  (I2C address 0x53)
CS   ── 3.3V (I2C mode)
```

### DHT11

```text
3.3V ── DHT11 VCC
GPIO 4 ──[10kΩ to 3.3V]── DHT11 DATA
GND  ── DHT11 GND
```

### MQ135

```text
5V  ── MQ135 heater pins (H)
MQ135 sensor pins (A/B) ──[load resistor 10kΩ]── GND
                          └──[voltage divider]──── GPIO 35
```

The voltage divider (10kΩ + 20kΩ) is needed because the MQ135 output
can swing above 3.3V — this brings it safely into the ESP32's ADC range.

---

## What to Show on Each KiCad View for PPT

| View              | What it shows                                           |
| ----------------- | ------------------------------------------------------- |
| **Schematic**     | All components, their connections, power rails, labels  |
| **PCB 2D layout** | Top-down view — component outlines, board shape, traces |
| **PCB 3D render** | Photorealistic board — most impressive for PPT slides   |

### Getting the 3D render in KiCad

```text
PCB Editor → View → 3D Viewer → View → Raytracing (toggle on)
→ Screenshot → paste into PPT
```

The 3D view will show the ESP32 module, sensor ICs, and connectors as
recognisable 3D shapes on a green PCB — exactly what you need for a slide.

---

## KiCad Quick Steps

1. **New project** → `ESP32_Sensor_Hub`
2. **Schematic editor** → Add symbols for each component → Connect with wires and net labels
3. **Assign footprints** → ESP32 module footprint, SOIC-8 for CP2102, etc.
4. **PCB editor** → Import from schematic → Place components per layout above
5. **Add board outline** in Edge.Cuts layer (80×60mm)
6. **Route traces** (or use auto-router for a prototype appearance)
7. **Add GND copper pour** on bottom layer
8. **3D Viewer** → Screenshot for PPT

---

## Key KiCad Footprints

| Component        | KiCad Footprint                                                               |
| ---------------- | ----------------------------------------------------------------------------- |
| ESP32-WROOM-32   | `RF_Module:ESP32-WROOM-32`                                                    |
| CP2102N          | `Package_SO:SOIC-16` (use CH340C SOIC-16 if simpler)                          |
| AMS1117-3.3      | `Package_TO_SOT_SMD:SOT-223-3_TabPin2`                                        |
| ADXL345          | `Sensor_Motion:Analog_ADXL345BCCZ_LGA-14`                                     |
| DHT11            | `Sensor_Humidity:DHT11_SIP-4`                                                 |
| MQ135            | Use generic `Connector_PinHeader_2.54mm:PinHeader_1x06` for the 6-pin element |
| EXG Pill module  | Use `Connector_PinHeader_2.54mm:PinHeader_1x04` (4-pin header)                |
| USB Type-C       | `Connector_USB:USB_C_Receptacle_GCT_USB4085`                                  |
| Resistors / caps | `Resistor_SMD:R_0402_1005Metric`                                              |
| Tactile buttons  | `Button_Switch_SMD:SW_SPST_CK_RS282G05A3`                                     |
