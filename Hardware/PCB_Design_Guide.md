# PCB Design Guide — ESP32 Sensor Hub (Prototype)

> **Project:** SIH GLAH10 BrajCoders
> **Tool:** KiCad 7 / KiCad 8
> **Goal:** Partially working prototype PCB integrating all 5 sensors onto one board
> **Strategy:** Bare ICs for ADXL345, DHT11, MQ135, Soil Moisture — full EXG instrumentation amplifier circuit on board
> **MCU:** ESP32-WROOM-32 module (not bare chip — avoids RF design complexity)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Full Bill of Materials (BOM)](#2-full-bill-of-materials-bom)
3. [Power Architecture](#3-power-architecture)
4. [Schematic Guide — Section by Section](#4-schematic-guide--section-by-section)
   - [4.1 ESP32 Core Circuit](#41-esp32-core-circuit)
   - [4.2 USB Power and Programming](#42-usb-power-and-programming)
   - [4.3 BioAmp EXG — Instrumentation Amplifier Circuit](#43-bioamp-exg--instrumentation-amplifier-circuit)
   - [4.4 ADXL345 Accelerometer](#44-adxl345-accelerometer)
   - [4.5 DHT11 Temperature & Humidity](#45-dht11-temperature--humidity)
   - [4.6 MQ135 Air Quality Sensor](#46-mq135-air-quality-sensor)
   - [4.7 Soil Moisture — PCB Trace Electrodes](#47-soil-moisture--pcb-trace-electrodes)
5. [PCB Layout Guide](#5-pcb-layout-guide)
6. [Layer Stackup](#6-layer-stackup)
7. [EXG Circuit — Deep Dive](#7-exg-circuit--deep-dive)
8. [KiCad Step-by-Step Workflow](#8-kicad-step-by-step-workflow)
9. [What "Partially Working" Means for This Board](#9-what-partially-working-means-for-this-board)
10. [Common Mistakes to Avoid](#10-common-mistakes-to-avoid)

---

## 1. Design Philosophy

### What goes on the PCB as a bare IC vs as a module

| Sensor        | Approach                                               | Reason                                                                      |
| ------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| ESP32         | WROOM-32 **module**                                    | RF antenna design is complex and not worth it for a prototype               |
| BioAmp EXG    | **Full circuit on PCB** (INA128 + filters)             | This is the flagship feature — showing it as a proper circuit is impressive |
| ADXL345       | **Bare IC** (LGA-14)                                   | Standard digital IC, well-supported in KiCad                                |
| DHT11         | **Bare IC** (SIP-4 through-hole)                       | Simplest possible integration                                               |
| MQ135         | **Raw sensing element** (6-pin) + your support circuit | Sensor element is bare; module's op-amp circuit not needed                  |
| Soil Moisture | **PCB copper traces** (interdigitated pattern)         | The PCB copper IS the sensor — elegant and compact                          |

### "Partially working" definition for this guide

- All digital and analog circuits are correctly designed
- Soil moisture sensing area is on the PCB itself
- EXG front-end is a real instrumentation amplifier circuit
- The board **could** be manufactured and would function
- Some hand-soldering of fine-pitch parts (ADXL345 LGA) may need a reflow oven

---

## 2. Full Bill of Materials (BOM)

### Microcontroller

| Ref  | Component                     | Package              | Qty | Notes                                                |
| ---- | ----------------------------- | -------------------- | --- | ---------------------------------------------------- |
| U1   | ESP32-WROOM-32D               | Module (stamp holes) | 1   | 4MB flash variant; use stamp-hole footprint in KiCad |
| C1   | 100 nF ceramic cap            | 0402                 | 4   | Decoupling on 3.3V pins                              |
| C2   | 10 µF electrolytic / tantalum | 0805                 | 2   | Bulk decoupling on 3.3V rail                         |
| LED1 | LED (green)                   | 0402                 | 1   | Power indicator                                      |
| R1   | 330 Ω resistor                | 0402                 | 1   | LED current limit                                    |
| SW1  | Tactile switch                | 4-pin SMD            | 1   | EN / RESET button                                    |
| SW2  | Tactile switch                | 4-pin SMD            | 1   | BOOT / GPIO0 button                                  |

### USB Power and Programming

| Ref | Component                    | Package        | Qty | Notes                                   |
| --- | ---------------------------- | -------------- | --- | --------------------------------------- |
| J1  | USB Type-C connector         | Horizontal SMD | 1   | For power + programming                 |
| U2  | CP2102N USB-to-UART          | QFN-24         | 1   | Or CH340C in SOIC-16 if QFN is too fine |
| U3  | AMS1117-3.3 LDO regulator    | SOT-223        | 1   | 5V USB → 3.3V for ESP32 and sensors     |
| C3  | 100 nF ceramic               | 0402           | 2   | Input and output bypass on AMS1117      |
| C4  | 10 µF electrolytic           | 0805           | 1   | Bulk cap on AMS1117 output              |
| F1  | 500 mA polyfuse (resettable) | 1812           | 1   | USB protection                          |

### BioAmp EXG — Instrumentation Amplifier

| Ref    | Component                    | Value               | Package | Qty           | Notes                                  |
| ------ | ---------------------------- | ------------------- | ------- | ------------- | -------------------------------------- |
| U4     | INA128 instrumentation amp   | —                   | SOIC-8  | 1             | Core EXG IC; SOIC-8 is hand-solderable |
| R_G    | Gain resistor                | 50 Ω                | 0402    | 1             | Sets gain to ~1000× for EMG            |
| R2, R3 | Input protection resistors   | 10 kΩ               | 0402    | 2             | On IN+ and IN− inputs                  |
| R4, R5 | High-pass filter resistors   | 10 kΩ               | 0402    | 2             | Removes DC electrode offset            |
| C5, C6 | High-pass filter capacitors  | 1 µF                | 0402    | 2             | fc = 16 Hz; blocks baseline wander     |
| R6     | Low-pass filter resistor     | 1 kΩ                | 0402    | 1             | Output low-pass filter                 |
| C7     | Low-pass filter capacitor    | 100 nF              | 0402    | 1             | fc ≈ 1.6 kHz; removes high-freq noise  |
| R7, R8 | Mid-supply reference divider | 10 kΩ each          | 0402    | 2             | Creates VCC/2 = 1.65V reference        |
| C8     | Reference bypass cap         | 10 µF               | 0805    | 1             | Stabilises mid-supply reference        |
| R9     | Output clamp resistor        | 10 kΩ               | 0402    | 1             | Protects ESP32 ADC input               |
| D1, D2 | ESD protection diodes        | BAV99               | SOT-23  | 1 each        | Clamps electrode input lines           |
| C9     | INA128 power bypass          | 100 nF              | 0402    | 1             | On V+ pin of INA128                    |
| J2     | Electrode connector          | 3-pin 2.54mm header | 1       | IN+, IN−, REF | -                                      |

### ADXL345 Accelerometer

| Ref      | Component    | Value  | Package        | Qty | Notes                       |
| -------- | ------------ | ------ | -------------- | --- | --------------------------- |
| U5       | ADXL345BCCZ  | —      | LGA-14 (3×5mm) | 1   | Needs hot air / reflow oven |
| C10, C11 | Bypass caps  | 100 nF | 0402           | 2   | On VS and VDD/IO pins       |
| C12      | Bulk bypass  | 10 µF  | 0805           | 1   | Near ADXL on 3.3V rail      |
| R10, R11 | I2C pull-ups | 4.7 kΩ | 0402           | 2   | On SDA and SCL lines        |

### DHT11 Temperature & Humidity

| Ref | Component    | Value  | Package            | Qty | Notes                                   |
| --- | ------------ | ------ | ------------------ | --- | --------------------------------------- |
| U6  | DHT11        | —      | SIP-4 through-hole | 1   | 4-pin bare IC; pin 3 (NC) left floating |
| R12 | Data pull-up | 10 kΩ  | 0402               | 1   | Between DATA pin and VCC                |
| C13 | Bypass cap   | 100 nF | 0402               | 1   | On VCC pin                              |

### MQ135 Air Quality

| Ref | Component                | Value        | Package             | Qty | Notes                                       |
| --- | ------------------------ | ------------ | ------------------- | --- | ------------------------------------------- |
| U7  | MQ135 sensing element    | —            | 6-pin bare element  | 1   | Two H pins (heater), two A pins, two B pins |
| R_L | Load resistor (trim pot) | 10 kΩ        | SMD trim pot 3296   | 1   | Adjustable for calibration                  |
| C14 | Heater bulk cap          | 100 µF / 10V | Electrolytic radial | 1   | On 5V near MQ135                            |
| R13 | Voltage divider top      | 10 kΩ        | 0402                | 1   | AO output → ESP32 voltage divider           |
| R14 | Voltage divider bottom   | 20 kΩ        | 0402                | 1   | Divides AO from 5V range → 3.3V             |

### Soil Moisture (PCB Trace Electrodes)

| Ref | Component                 | Value  | Package         | Qty | Notes                                |
| --- | ------------------------- | ------ | --------------- | --- | ------------------------------------ |
| —   | Interdigitated PCB traces | —      | PCB copper pour | —   | No component; designed in PCB layout |
| R15 | Sense resistor            | 100 kΩ | 0402            | 1   | Forms RC with trace capacitance      |
| C15 | Bypass / filter cap       | 100 nF | 0402            | 1   | On GPIO 32                           |

### Connectors and Miscellaneous

| Ref     | Component              | Qty | Notes                                                            |
| ------- | ---------------------- | --- | ---------------------------------------------------------------- |
| J3      | Debug / UART header    | 1   | 4-pin 2.54mm: GND, 3.3V, TX, RX                                  |
| J4      | JTAG header (optional) | 1   | 10-pin 1.27mm — for hardware debugging                           |
| TP1–TP6 | Test points            | 6   | On key signals: 3.3V, GND, EXG_OUT, ADXL_SDA, DHT_DATA, MQ135_AO |

---

## 3. Power Architecture

```text
USB Type-C (5V input)
     │
     ├──[F1 Polyfuse 500mA]──────────────────── 5V rail
     │                                               │
     │                                        [MQ135 heater]
     │                                        [C14 100µF bulk]
     │
     └──[AMS1117-3.3]────────────────────────── 3.3V rail
                                                    │
                          ┌─────────────────────────┼──────────────────────────┐
                          │                         │                          │
                    [ESP32-WROOM]           [ADXL345 + DHT11]          [INA128 EXG]
                    [CP2102N]               [Soil moisture]             [Bypass caps]
```

> **Critical:** The MQ135 heater draws ~150 mA from 5V and creates switching
> noise. Keep its supply traces separate from the analog EXG section.
> Use the polyfuse to protect the USB port.

---

## 4. Schematic Guide — Section by Section

### 4.1 ESP32 Core Circuit

```text
ESP32-WROOM-32D module connections:

  3V3  ──[100nF]──┬──[10µF]── GND   (decoupling; place caps as close to module as possible)
                  │
                 GND

  EN   ──[10kΩ]── 3V3               (pull EN HIGH for normal operation)
  EN   ──[100nF]── GND              (debounce cap for EN pin)
  EN   ─────────── SW1 ─── GND      (RESET button)

  GPIO0 ──[10kΩ]── 3V3              (pull HIGH for normal boot)
  GPIO0 ─────────── SW2 ─── GND    (BOOT button — pull LOW to enter flash mode)

  GPIO34 ─────────────────────────── EXG output (input-only ADC pin)
  GPIO21 ─────────────────────────── ADXL345 SDA
  GPIO22 ─────────────────────────── ADXL345 SCL
  GPIO4  ─────────────────────────── DHT11 DATA
  GPIO35 ─────────────────────────── MQ135 AO (after voltage divider)
  GPIO32 ─────────────────────────── Soil moisture electrode

  TXD0 (GPIO1)  ──────────────────── CP2102N RX
  RXD0 (GPIO3)  ──────────────────── CP2102N TX
```

### 4.2 USB Power and Programming

```text
USB Type-C
  VBUS ──[F1]────────────────────────── 5V rail
  D+   ─────────────────────────────── CP2102N D+
  D-   ─────────────────────────────── CP2102N D−
  GND  ─────────────────────────────── GND

CP2102N:
  TXD ──────────────────────────────── ESP32 RXD0 (GPIO3)
  RXD ──────────────────────────────── ESP32 TXD0 (GPIO1)
  VDD ──[100nF]──────────────────────── 3.3V
  GND ─────────────────────────────── GND

AMS1117-3.3:
  IN  ──────── 5V rail
  OUT ──────── 3.3V rail ──[10µF]──[100nF]── GND
  GND ──────── GND
```

> In KiCad: use the `Connector_USB:USB_C_Receptacle_GCT_USB4085` footprint
> for the USB-C connector.

---

### 4.3 BioAmp EXG — Instrumentation Amplifier Circuit

This is the most important section. Read [Section 7](#7-exg-circuit--deep-dive) for full details.

```text
ELECTRODE CONNECTOR (J2)
  Pin 1: IN+  (positive electrode — e.g. muscle/heart signal)
  Pin 2: IN−  (negative electrode — reference side)
  Pin 3: REF  (driven reference / ground electrode)

Input protection:
  IN+ ──[R2: 10kΩ]──[D1: BAV99]──── INA128 pin 3 (IN+)
  IN− ──[R3: 10kΩ]──[D2: BAV99]──── INA128 pin 2 (IN−)
  (BAV99 cathodes to 3.3V, anodes to GND — clamps any overvoltage)

High-pass filter (removes DC electrode offset):
  INA128 IN+ ──[C5: 1µF]──[R4: 10kΩ]── mid-supply (1.65V)
  INA128 IN− ──[C6: 1µF]──[R5: 10kΩ]── mid-supply (1.65V)

Gain setting (INA128 formula: G = 1 + 50kΩ/R_G):
  INA128 pin 1 (RG1) ──[R_G: 50Ω]── INA128 pin 8 (RG2)
  → Gain = 1 + 50000/50 = 1001× ≈ 1000× (suitable for EMG)

Mid-supply reference (1.65V = 3.3V/2):
  3.3V ──[R7: 10kΩ]──┬──[R8: 10kΩ]── GND
                     │
                    [C8: 10µF]── GND
                     │
                  INA128 pin 5 (REF)
  (This biases the output to 1.65V so the signal swings above and below it)

INA128 power:
  INA128 pin 7 (V+) ──[C9: 100nF]── GND ── 3.3V
  INA128 pin 4 (V−) ──────────────────────── GND

INA128 output:
  INA128 pin 6 (OUT) ──[low-pass R6: 1kΩ]──[C7: 100nF to GND]──[R9: 10kΩ]── GPIO34 (ESP32)
  (R9 + C15 on ESP32 input form a final clamp; keeps signal in 0–3.3V range)
```

---

### 4.4 ADXL345 Accelerometer

```text
ADXL345 (I2C mode):
  VDD/IO ──[C10: 100nF]── GND ── 3.3V
  VS     ──[C11: 100nF]── GND ── 3.3V
  SDO    ────────────────────────── GND     (I2C address = 0x53)
  CS     ────────────────────────── 3.3V    (enables I2C mode)
  SDA    ──[R10: 4.7kΩ]── 3.3V ──────────── ESP32 GPIO21
  SCL    ──[R11: 4.7kΩ]── 3.3V ──────────── ESP32 GPIO22
  GND    ────────────────────────── GND
  INT1, INT2 ── NC (not connected in this design)
```

> I2C pull-ups R10/R11 should be placed once on the bus, not per device.
> If both ADXL345 and any future I2C device share the bus, keep only one
> pair of pull-ups.

---

### 4.5 DHT11 Temperature & Humidity

```text
DHT11 (4-pin SIP):
  Pin 1 (VCC)  ──[C13: 100nF]── GND ── 3.3V
  Pin 2 (DATA) ──[R12: 10kΩ]── 3.3V ──────── ESP32 GPIO4
  Pin 3 (NC)   ── not connected
  Pin 4 (GND)  ─────────────────────────────── GND
```

---

### 4.6 MQ135 Air Quality Sensor

```text
MQ135 element (6 pins: H-H-A-B-B-A pairs):
  H pins (heater) ─────────────────────────── 5V and GND (150mA — use thick traces)
  A/B pins (sensor) — internal resistance varies with gas concentration

Load resistor circuit:
  3.3V ──────────────────────────────────────────── MQ135 A pin
  MQ135 B pin ──[R_L: trim pot 10kΩ]────────────── GND
              └─── AO_raw node

Voltage divider (5V range → 3.3V safe for ESP32):
  AO_raw ──[R13: 10kΩ]──┬──[R14: 20kΩ]── GND
                         │
                    ESP32 GPIO35
  (Divider ratio: 20k/(10k+20k) = 0.667 → 5V×0.667 = 3.33V max — safe)

Bulk decoupling for heater noise:
  5V ──[C14: 100µF]── GND   (place right next to MQ135)
```

> The trimmer pot R_L lets you adjust the sensor's load resistance.
> Different load resistances shift the characteristic curve — useful
> for optimising sensitivity in your environment.

---

### 4.7 Soil Moisture — PCB Trace Electrodes

The soil moisture sensing area is **designed into the PCB copper layer**. No separate component is needed for the sensing element itself.

```text
Interdigitated "comb" pattern (design in PCB layout, not schematic):

  ┌───┬───┬───┬───┬───┐
  │   │   │   │   │   │
  │   │   │   │   │   │   ← copper traces on PCB (bottom layer recommended)
  │   │   │   │   │   │   ← trace width: 1mm, gap: 1mm, length: 30mm
  └───┴───┴───┴───┴───┘
   A   B   A   B   A       ← alternating connections

  A traces ──────────────────── 3.3V (through R15: 100kΩ)
  B traces ──────────────────── ESP32 GPIO32
```

In the schematic, model this as:

```text
  3.3V ──[R15: 100kΩ]──┬── GPIO32 (ESP32)
                        │
                 [soil electrodes = variable resistor to GND]
                 (labelled as a symbol: "SOIL_ELECTRODE" or a generic resistor with a note)
```

When soil is dry → high resistance → GPIO32 reads near 3.3V (high ADC)
When soil is wet → low resistance → GPIO32 reads near 0V (low ADC)

---

## 5. PCB Layout Guide

### Board dimensions

- Suggested size: **80 mm × 60 mm** (fits most PCB services' cheapest tier)
- Or if including soil moisture sensing area: **100 mm × 70 mm**

### Component placement zones

```text
┌─────────────────────────────────────────────────┐
│                                                 │
│   [USB-C]  [CP2102N]  [AMS1117]    [ESP32]      │
│                                                 │
│─────────────────────────────────────────────────│
│   DIGITAL SENSOR ZONE                           │
│   [ADXL345]  [DHT11]  [Buttons]                 │
│                                                 │
│─────────────────────────────────────────────────│
│   ANALOG SENSOR ZONE          │  5V ZONE        │
│   [INA128 EXG circuit]        │  [MQ135]        │
│   [Electrode connector]       │  [100µF cap]    │
│                                                 │
│─────────────────────────────────────────────────│
│   SOIL MOISTURE ELECTRODE AREA (bottom copper)  │
│   ┌──┬──┬──┬──┬──┬──┬──┬──┬──┐                 │
│   │  │  │  │  │  │  │  │  │  │                 │
│   └──┴──┴──┴──┴──┴──┴──┴──┴──┘                 │
└─────────────────────────────────────────────────┘
```

### Ground plane rules

- Use a **solid copper pour** for GND on the bottom layer across the whole board
- **Split the analog and digital grounds** under the EXG circuit:
  - AGND (analog ground) — under INA128 and its components
  - DGND (digital ground) — everywhere else
  - Join AGND and DGND at **exactly one point** — right at the AMS1117 output GND
- The MQ135 heater current must return through DGND — never through AGND

### Trace widths

| Signal                 | Width                                                |
| ---------------------- | ---------------------------------------------------- |
| 3.3V power             | 0.5 mm                                               |
| 5V / MQ135 heater      | 1.0 mm                                               |
| GND copper pour        | Solid pour                                           |
| I2C (SDA/SCL)          | 0.25 mm                                              |
| EXG analog signals     | 0.25 mm (short as possible)                          |
| Electrode traces to J2 | 0.5 mm                                               |
| Soil moisture traces   | 1.0 mm (sensing area), 0.25 mm (signal back to GPIO) |

### Critical spacing rules

- Keep EXG analog traces **away from** all clock lines, ESP32, and MQ135
- Place INA128 bypass cap C9 within **3 mm** of the V+ pin
- Place ADXL345 bypass caps within **2 mm** of the IC
- Keep MQ135 at the **edge** of the board — it needs airflow to sense gases
- DHT11 must not be placed near heat-generating components (MQ135 heater, AMS1117)

---

## 6. Layer Stackup

For a standard 2-layer PCB (cheapest, available everywhere):

| Layer                    | Used for                                             |
| ------------------------ | ---------------------------------------------------- |
| **Top copper (F.Cu)**    | All components, most signal traces, 3.3V/5V pour     |
| **Bottom copper (B.Cu)** | Solid GND pour + soil moisture interdigitated traces |
| **F.Silkscreen**         | Component labels, reference designators, board name  |
| **F.Courtyard**          | Component boundaries (auto-generated in KiCad)       |
| **Edge.Cuts**            | Board outline                                        |

> For a 2-layer board: top = signals + components, bottom = GND + soil traces.
> This gives the EXG circuit a clean ground reference directly beneath it.

---

## 7. EXG Circuit — Deep Dive

This section explains every part of the instrumentation amplifier circuit so you can draw it confidently in KiCad.

### Why INA128?

| IC     | CMRR   | Package | Availability       | Price |
| ------ | ------ | ------- | ------------------ | ----- |
| INA128 | 120 dB | SOIC-8  | Easy (Mouser/LCSC) | ~$4   |
| INA129 | 120 dB | SOIC-8  | Easy               | ~$4   |
| AD8221 | 100 dB | SOIC-8  | Easy               | ~$6   |
| INA118 | 100 dB | SOIC-8  | Easy               | ~$3   |

All are pin-compatible. **INA128** is chosen here — widely available,
SOIC-8 is hand-solderable, and 120 dB CMRR is excellent for biopotential.

### Gain calculation

```text
INA128 gain formula:
  G = 1 + (50,000 Ω / R_G)

For EMG signal (needs high gain):
  Target G = 1000×
  R_G = 50,000 / (1000 - 1) ≈ 50 Ω

For ECG signal (lower amplitude electrodes, but uses body):
  Target G = 500×
  R_G = 50,000 / (500 - 1) ≈ 100 Ω

For EOG (eye movement):
  Target G = 200×
  R_G = 50,000 / 200 ≈ 250 Ω
```

For this design, use **R_G = 50 Ω** (1000× gain, EMG-optimised).
If you want to test multiple signals, replace R_G with a multi-position DIP switch
connecting different resistor values in parallel — this lets you change gain
without resoldering.

### Filter frequencies

```text
High-pass filter (removes DC baseline wander from electrodes):
  R4 = R5 = 10 kΩ
  C5 = C6 = 1 µF
  fc = 1 / (2π × R × C) = 1 / (2π × 10,000 × 0.000001) ≈ 16 Hz
  → Passes EMG (>20 Hz), ECG (0.5–150 Hz — set fc lower for ECG: use 0.1 µF → fc = 160 Hz)

Low-pass filter (removes high-frequency noise and EMI):
  R6 = 1 kΩ
  C7 = 100 nF
  fc = 1 / (2π × 1,000 × 0.0000001) ≈ 1,592 Hz
  → Passes all biopotential signals, attenuates mains harmonics and radio noise
```

### Mid-supply reference

The INA128 REF pin sets the output baseline. With a single 3.3V supply:

```text
  Without REF biasing: output swings from 0V to 3.3V — but negative
  signal components (below electrode baseline) would be clipped at 0V.

  With REF = 1.65V (VCC/2): output swings symmetrically around 1.65V
  → Signal can swing between ~0.2V and ~3.1V → full dynamic range.

  R7 = R8 = 10 kΩ (matched) → VCC/2 = 1.65V
  C8 = 10 µF on the mid-supply node → filters any ripple on the reference
```

### INA128 Pin Reference (SOIC-8)

```text
  Pin 1 — RG1    (one end of gain resistor)
  Pin 2 — IN−    (negative differential input)
  Pin 3 — IN+    (positive differential input)
  Pin 4 — V−     (negative supply — connect to GND for single supply)
  Pin 5 — REF    (output reference — connect to 1.65V mid-supply)
  Pin 6 — OUTPUT (amplified differential signal)
  Pin 7 — V+     (positive supply — connect to 3.3V)
  Pin 8 — RG2    (other end of gain resistor)
```

### EXG complete signal path

```text
Electrode (body) → [R2/R3 protection] → [ESD clamp D1/D2]
  → [C5/C6 high-pass filter] → INA128 differential inputs
  → [R_G gain resistor: 50Ω] → INA128 amplifies 1000×
  → [R6/C7 low-pass filter] → [R9 output clamp]
  → ESP32 GPIO34 → analogRead() → 12-bit value 0-4095
```

### PCB layout rules for EXG (critical)

1. **Keep INA128 in the analog zone** — away from ESP32, USB, I2C clock lines
2. **Input traces (from J2 to INA128)** must be short, side by side (differential pair), same length
3. **No other traces should run between or parallel to the differential input traces** — they will couple noise
4. **Place C5, C6, R4, R5 immediately** before the INA128 inputs — not further back at the connector
5. **R_G (50Ω)** must have its own clean ground return — place it directly between pins 1 and 8 on the IC
6. **AGND plane** under the entire EXG section — connected to DGND at one point only
7. **Shield the electrode traces** if possible: run a GND trace parallel to each differential trace on both sides

---

## 8. KiCad Step-by-Step Workflow

### Step 1 — Create KiCad project

```text
KiCad → New Project → "ESP32_Sensor_Hub_PCB"
```

### Step 2 — Draw schematic (Schematic Editor)

Draw schematic **section by section** in this order:

1. Power symbols first (VCC_5V, VCC_3V3, GND, AGND)
2. USB-C + CP2102N + AMS1117 (power input section)
3. ESP32-WROOM-32 with all GPIO labels
4. INA128 EXG circuit (most complex — do this before you get tired)
5. ADXL345
6. DHT11
7. MQ135 + voltage divider
8. Soil moisture (just a labelled net connection to GPIO32)

Use **global labels** in KiCad to connect nets across schematic sheets
without drawing long wires:

- `EXG_OUT` — from INA128 output to ESP32 GPIO34
- `SDA`, `SCL` — I2C bus
- `DHT_DATA` — GPIO4
- `MQ135_AO` — GPIO35
- `SOIL_AO` — GPIO32

### Step 3 — Assign footprints

Use the footprint assignment tool. Key footprints:

| Symbol              | KiCad Footprint                                       |
| ------------------- | ----------------------------------------------------- |
| ESP32-WROOM-32D     | `RF_Module:ESP32-WROOM-32`                            |
| INA128              | `Package_SO:SOIC-8_3.9x4.9mm_P1.27mm`                 |
| ADXL345BCCZ         | `Sensor_Motion:Analog_ADXL345BCCZ_LGA-14`             |
| DHT11               | `Sensor_Humidity:DHT11_SIP-4`                         |
| AMS1117-3.3         | `Package_TO_SOT_SMD:SOT-223-3_TabPin2`                |
| CP2102N             | `Package_DFN_QFN:QFN-24-1EP_4x4mm_P0.5mm_EP2.6x2.6mm` |
| USB Type-C          | `Connector_USB:USB_C_Receptacle_GCT_USB4085`          |
| 0402 resistors/caps | `Resistor_SMD:R_0402_1005Metric`                      |
| BAV99               | `Package_TO_SOT_SMD:SOT-23`                           |
| Tactile switch      | `Button_Switch_SMD:SW_SPST_CK_RS282G05A3`             |

### Step 4 — Run Electrical Rules Check (ERC)

Fix all errors before moving to PCB layout.
Common ERC errors and fixes:

- `Pin not connected` → add a no-connect flag (X) or wire it up
- `Power pin not driven` → ensure all power symbols have a PWR_FLAG

### Step 5 — PCB Layout (PCB Editor)

1. Import netlist from schematic
2. Set board outline in Edge.Cuts layer (80×60mm rectangle)
3. Place components per the zone map in Section 5
4. Route power traces first (3.3V, 5V, GND)
5. Route I2C bus (SDA/SCL) — keep them away from EXG traces
6. Route EXG differential pairs carefully
7. Add copper pour: top = 3.3V fill in digital zone, bottom = GND fill everywhere
8. Draw soil moisture interdigitated pattern in bottom copper

### Step 6 — Run Design Rule Check (DRC)

Fix all clearance violations before exporting.

### Step 7 — 3D View for PPT

```text
PCB Editor → View → 3D Viewer → Render → Export as PNG
```

---

## 9. What "Partially Working" Means for This Board

| Section                 | Status                | Notes                                                          |
| ----------------------- | --------------------- | -------------------------------------------------------------- |
| ESP32 + USB programming | ✅ Fully functional   | Standard, well-proven circuit                                  |
| ADXL345 I2C             | ✅ Fully functional   | Standard digital IC                                            |
| DHT11                   | ✅ Fully functional   | Simple 3-pin circuit                                           |
| MQ135 (raw ADC)         | ✅ Functional         | Adjust R_L trim pot for your environment                       |
| Soil moisture traces    | ✅ Functional         | PCB traces as electrodes — may need soil impedance calibration |
| EXG (INA128 circuit)    | ✅ Circuit is correct | Signal quality depends on PCB layout and electrode quality     |
| EXG (signal quality)    | ⚠️ May need tuning    | Gain and filter values may need adjustment per electrode type  |

**"Partially working"** means every circuit is real and correct —
it is not a dummy board. With good assembly and layout it should work.
Signal quality on the EXG section may need one round of R_G / filter tuning.

---

## 10. Common Mistakes to Avoid

| Mistake                                             | Consequence                                    | Fix                                               |
| --------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| MQ135 heater on 3.3V instead of 5V                  | Sensor won't heat → no gas detection           | Connect heater pins to 5V/GND                     |
| Missing ESD protection on EXG inputs                | First static discharge destroys INA128         | Always add BAV99 on IN+ and IN−                   |
| Single ground plane under EXG and digital           | Digital switching noise on EXG output          | Split AGND / DGND, join at one point              |
| Skipping mid-supply REF on INA128                   | Output clipped on one half of signal           | R7, R8, C8 divider on REF pin is mandatory        |
| I2C pull-ups on each device separately              | Parallel resistors = too low pull-up impedance | One pair of 4.7kΩ pull-ups for the whole I2C bus  |
| ADXL345 CS left floating                            | Random mode selection, I2C may not work        | Tie CS to 3.3V for I2C mode                       |
| MQ135 AO connected directly to ESP32 GPIO           | GPIO sees >3.3V → damage                       | Always use R13/R14 voltage divider                |
| Soil moisture traces on top copper (component side) | Difficult to insert into soil                  | Use bottom copper for the interdigitated pattern  |
| DHT11 near MQ135 heater                             | Temperature readings falsely high              | Place DHT11 on opposite side of board             |
| Gain resistor R_G too far from INA128               | Stray capacitance alters gain at high freq     | Place R_G between pins 1 and 8 directly on the IC |
