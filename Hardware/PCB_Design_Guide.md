# PCB Design Guide — ESP32 Sensor Hub (Prototype)

> **Project:** SIH GLAH10 BrajCoders
> **Tool:** KiCad 7 / KiCad 8
> **Goal:** Prototype PCB integrating sensors onto one board — designed for field deployment, not bench use
> **Strategy:** Bare ICs for ADXL345, DHT11; EXG instrumentation amplifier on board; MQ135 as raw element; no USB connector
> **MCU:** ESP32-WROOM-32 module (not bare chip — avoids RF design complexity)
> **Programming:** One-time via exposed UART pads using a removable jig — no USB connector on board
> **Power:** LiPo battery (3.7V) → AMS1117-3.3 → 3.3V rail; MQ135 powered via small boost converter

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Full Bill of Materials (BOM)](#2-full-bill-of-materials-bom)
3. [Power Architecture](#3-power-architecture)
4. [Schematic Guide — Section by Section](#4-schematic-guide--section-by-section)
   - [4.1 ESP32 Core Circuit](#41-esp32-core-circuit)
   - [4.2 Power Supply — LiPo + AMS1117](#42-power-supply--lipo--ams1117)
   - [4.3 Programming Pads](#43-programming-pads)
   - [4.4 BioAmp EXG — Instrumentation Amplifier Circuit](#44-bioamp-exg--instrumentation-amplifier-circuit)
   - [4.5 ADXL345 Accelerometer](#45-adxl345-accelerometer)
   - [4.6 DHT11 Temperature & Humidity](#46-dht11-temperature--humidity)
   - [4.7 MQ135 Air Quality Sensor](#47-mq135-air-quality-sensor)
5. [PCB Layout Guide](#5-pcb-layout-guide)
6. [Layer Stackup](#6-layer-stackup)
7. [EXG Circuit — Deep Dive](#7-exg-circuit--deep-dive)
8. [KiCad Step-by-Step Workflow](#8-kicad-step-by-step-workflow)
9. [What "Partially Working" Means for This Board](#9-what-partially-working-means-for-this-board)
10. [Common Mistakes to Avoid](#10-common-mistakes-to-avoid)

---

## 1. Design Philosophy

### What goes on the PCB as a bare IC vs as a module

| Component     | Approach                                          | Reason                                                                      |
| ------------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| ESP32         | WROOM-32 **module**                               | RF antenna design is complex and not worth it for a prototype               |
| BioAmp EXG    | **Full circuit on PCB** (INA128 + filters)        | This is the flagship feature — showing it as a proper circuit is impressive |
| ADXL345       | **Bare IC** (LGA-14)                              | Standard digital IC, well-supported in KiCad                                |
| DHT11         | **Bare IC** (SIP-4 through-hole)                  | Simplest possible integration                                               |
| MQ135         | **Raw sensing element** (6-pin) + support circuit | Sensor element is bare; module's PCB not needed                             |
| USB connector | **Not present**                                   | This is a field-deployed device — programmed once, then sealed              |
| Programming   | **6 exposed UART pads** on board edge             | Factory jig connects temporarily; no port needed after deployment           |
| Power         | **JST-PH 2-pin** (LiPo battery)                   | Portable, wearable form factor                                              |

### "Partially working" definition for this guide

- All digital and analog circuits are correctly designed
- EXG front-end is a real instrumentation amplifier circuit
- The board **could** be manufactured and would function
- Some hand-soldering of fine-pitch parts (ADXL345 LGA) may need a reflow oven
- MQ135 connected as raw element with a boost converter for its 5V heater

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

### Power Supply

| Ref | Component                          | Package        | Qty | Notes                                  |
| --- | ---------------------------------- | -------------- | --- | -------------------------------------- |
| J1  | JST-PH 2-pin connector             | SMD horizontal | 1   | LiPo battery input (3.7V)              |
| U2  | AMS1117-3.3 LDO regulator          | SOT-223        | 1   | 3.7V LiPo → 3.3V for ESP32 and sensors |
| U3  | MT3608 boost converter (or module) | SOT-23-6       | 1   | 3.7V → 5V for MQ135 heater             |
| C3  | 100 nF ceramic                     | 0402           | 2   | Input and output bypass on AMS1117     |
| C4  | 10 µF electrolytic                 | 0805           | 1   | Bulk cap on AMS1117 output             |
| C_B | 100 µF electrolytic                | 0805           | 1   | Bulk cap on MT3608 5V output           |

### Programming Pads

| Ref     | Component                       | Package         | Qty | Notes                     |
| ------- | ------------------------------- | --------------- | --- | ------------------------- |
| PP1–PP6 | Exposed copper programming pads | 1.5mm round pad | 6   | GND, 3V3, TX, RX, EN, IO0 |

> These 6 pads sit in a row on one edge of the board.
> During factory programming, a pogo-pin jig or a USB-to-UART dongle
> clips onto these pads, loads the firmware, then is removed.
> No USB connector is soldered to the board.

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
LiPo Battery (3.7V) via JST-PH connector
     │
     ├──[MT3608 Boost Converter]─────────── 5V rail
     │                                          │
     │                                   [MQ135 heater]
     │                                   [C_B 100µF bulk]
     │
     └──[AMS1117-3.3 LDO]─────────────── 3.3V rail
                                               │
                    ┌──────────────────────────┼──────────────────────┐
                    │                          │                      │
              [ESP32-WROOM]           [ADXL345 + DHT11]       [INA128 EXG]
                                      [Bypass caps]            [Bypass caps]
```

> **Why a boost converter for MQ135?**
> The LiPo outputs 3.7V. The MQ135 heater needs 5V. The MT3608 is a compact
> step-up converter (SOT-23-6) that converts 3.7V → 5V efficiently.
> Keep its switching traces away from the analog EXG section to avoid noise.

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
  EN   ─────────── SW1 ─── GND      (RESET button — also accessible via programming pad)

  GPIO0 ──[10kΩ]── 3V3              (pull HIGH for normal boot)
  GPIO0 ─────────── SW2 ─── GND    (BOOT button — also tied to IO0 programming pad)

  GPIO34 ─────────────────────────── EXG output (input-only ADC pin)
  GPIO21 ─────────────────────────── ADXL345 SDA
  GPIO22 ─────────────────────────── ADXL345 SCL
  GPIO4  ─────────────────────────── DHT11 DATA
  GPIO35 ─────────────────────────── MQ135 AO (after voltage divider)

  TXD0 (GPIO1)  ──────────────────── TX programming pad (PP3)
  RXD0 (GPIO3)  ──────────────────── RX programming pad (PP4)
```

### 4.2 Power Supply — LiPo + AMS1117

```text
LiPo Battery (JST-PH J1):
  BAT+ ──────────────────────────── 3.7V input rail
  BAT- ──────────────────────────── GND

AMS1117-3.3:
  IN  ──── 3.7V input rail
  OUT ──── 3.3V rail ──[10µF]──[100nF]── GND
  GND ──── GND

MT3608 Boost Converter:
  VIN  ──── 3.7V input rail
  VOUT ──── 5V rail ──[100µF]── GND
  GND  ──── GND
  (Set VOUT to 5V using the feedback resistor per MT3608 datasheet)
```

> MT3608 switching frequency is ~1.2 MHz. Use short, thick traces on its
> inductor and keep them far from EXG analog traces.

### 4.3 Programming Pads

```text
Board edge — 6 pads in a row, 2.54mm pitch, labelled in silkscreen:

  ┌──────┬──────┬──────┬──────┬──────┬──────┐
  │ GND  │ 3V3  │  TX  │  RX  │  EN  │ IO0  │
  │ PP1  │ PP2  │ PP3  │ PP4  │ PP5  │ PP6  │
  └──────┴──────┴──────┴──────┴──────┴──────┘

Connections:
  PP1 (GND)  ──── GND plane
  PP2 (3V3)  ──── 3.3V rail  (powers the external USB-to-UART dongle if needed)
  PP3 (TX)   ──── ESP32 TXD0 / GPIO1
  PP4 (RX)   ──── ESP32 RXD0 / GPIO3
  PP5 (EN)   ──── ESP32 EN pin  (toggle LOW then HIGH to reset into bootloader)
  PP6 (IO0)  ──── ESP32 GPIO0  (hold LOW during EN toggle to enter flash mode)

Programming procedure:
  1. Connect USB-to-UART adapter to pads GND, TX, RX
  2. Hold IO0 pad LOW (short to GND)
  3. Pulse EN pad LOW briefly → ESP32 enters bootloader
  4. Flash firmware using esptool.py or Arduino IDE
  5. Disconnect jig → device runs normally on next reset
```

---

### 4.4 BioAmp EXG — Instrumentation Amplifier Circuit

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

### 4.5 ADXL345 Accelerometer

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

### 4.6 DHT11 Temperature & Humidity

```text
DHT11 (4-pin SIP):
  Pin 1 (VCC)  ──[C13: 100nF]── GND ── 3.3V
  Pin 2 (DATA) ──[R12: 10kΩ]── 3.3V ──────── ESP32 GPIO4
  Pin 3 (NC)   ── not connected
  Pin 4 (GND)  ─────────────────────────────── GND
```

---

### 4.7 MQ135 Air Quality Sensor

```text
MQ135 element (6 pins: H-H-A-B-B-A pairs):
  H pins (heater) ─────────────────────────── 5V rail (from MT3608) and GND
  A/B pins (sensor) — internal resistance varies with gas concentration

Load resistor circuit:
  3.3V ──────────────────────────────────────────── MQ135 A pin
  MQ135 B pin ──[R_L: trim pot 10kΩ]────────────── GND
              └─── AO_raw node

Voltage divider (output may exceed 3.3V → divide down for ESP32 safety):
  AO_raw ──[R13: 10kΩ]──┬──[R14: 20kΩ]── GND
                         │
                    ESP32 GPIO35
  (Divider ratio: 20k/(10k+20k) = 0.667 → max ~3.3V at GPIO35 — safe)

Bulk decoupling for heater switching noise:
  5V ──[C14: 100µF]── GND   (place right next to MQ135)
```

> The trimmer pot R_L lets you adjust the sensor's load resistance.
> Different load resistances shift the characteristic curve — useful
> for optimising sensitivity in your environment.

---

## 5. PCB Layout Guide

### Board dimensions

- Suggested size: **80 mm × 60 mm** (fits most PCB services' cheapest tier)

### Component placement zones

```text
┌─────────────────────────────────────────────────────┐
│  [PROG PADS] ←── board edge (silkscreen labelled)   │
│─────────────────────────────────────────────────────│
│  [JST-PH]  [AMS1117]  [MT3608]    [ESP32-WROOM]     │
│                                                      │
│─────────────────────────────────────────────────────│
│   DIGITAL SENSOR ZONE                               │
│   [ADXL345]  [DHT11]  [RESET btn]  [BOOT btn]       │
│                                                      │
│─────────────────────────────────────────────────────│
│   ANALOG ZONE (AGND)       │   5V ZONE              │
│   [INA128 EXG circuit]     │   [MQ135 element]      │
│   [Electrode connector J2] │   [MT3608 bulk cap]    │
└─────────────────────────────────────────────────────┘
```

- **Top edge** — programming pads row (board edge, accessible with pogo jig)
- **Top zone** — JST battery connector, LDO, boost converter, ESP32 module
- **Middle zone** — digital sensors (ADXL345, DHT11) and buttons
- **Bottom-left** — EXG instrumentation amplifier in its own analog ground island
- **Bottom-right** — MQ135 element at board corner (needs airflow; 5V traces here)

### Ground plane rules

- Use a **solid copper pour** for GND on the bottom layer across the whole board
- **Split the analog and digital grounds** under the EXG circuit:
  - AGND (analog ground) — under INA128 and its components
  - DGND (digital ground) — everywhere else
  - Join AGND and DGND at **exactly one point** — right at the AMS1117 LDO output GND
- The MQ135 heater current and MT3608 switching current must return through DGND — never through AGND

### Trace widths

| Signal                 | Width                       |
| ---------------------- | --------------------------- |
| 3.3V power             | 0.5 mm                      |
| 5V / MQ135 heater      | 1.0 mm                      |
| MT3608 inductor traces | 1.0 mm (short as possible)  |
| GND copper pour        | Solid pour                  |
| I2C (SDA/SCL)          | 0.25 mm                     |
| EXG analog signals     | 0.25 mm (short as possible) |
| Electrode traces to J2 | 0.5 mm                      |
| Programming pad traces | 0.5 mm                      |

### Critical spacing rules

- Keep EXG analog traces **away from** all clock lines, ESP32, and MQ135
- Keep MT3608 boost converter **away from** the EXG analog zone — its switching is noisy
- Place INA128 bypass cap C9 within **3 mm** of the V+ pin
- Place ADXL345 bypass caps within **2 mm** of the IC
- Keep MQ135 at the **edge** of the board — it needs airflow to sense gases
- DHT11 must not be placed near heat-generating components (MQ135 heater, AMS1117)

---

## 6. Layer Stackup

For a standard 2-layer PCB (cheapest, available everywhere):

| Layer                    | Used for                                            |
| ------------------------ | --------------------------------------------------- |
| **Top copper (F.Cu)**    | All components, most signal traces, 3.3V/5V fills   |
| **Bottom copper (B.Cu)** | Solid GND pour                                      |
| **F.Silkscreen**         | Component labels, reference designators, board name |
| **F.Courtyard**          | Component boundaries (auto-generated in KiCad)      |
| **Edge.Cuts**            | Board outline                                       |

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
2. JST-PH connector + AMS1117 + MT3608 boost converter (power section)
3. ESP32-WROOM-32 with all GPIO labels
4. Programming pads (PP1–PP6) connected to ESP32 TX, RX, EN, GPIO0
5. INA128 EXG circuit (most complex — do this before you get tired)
6. ADXL345
7. DHT11
8. MQ135 + voltage divider

Use **global labels** in KiCad to connect nets across schematic sheets
without drawing long wires:

- `EXG_OUT` — from INA128 output to ESP32 GPIO34
- `SDA`, `SCL` — I2C bus
- `DHT_DATA` — GPIO4
- `MQ135_AO` — GPIO35

### Step 3 — Assign footprints

Use the footprint assignment tool. Key footprints:

| Symbol                     | KiCad Footprint                                         |
| -------------------------- | ------------------------------------------------------- |
| ESP32-WROOM-32D            | `RF_Module:ESP32-WROOM-32`                              |
| INA128                     | `Package_SO:SOIC-8_3.9x4.9mm_P1.27mm`                   |
| ADXL345BCCZ                | `Sensor_Motion:Analog_ADXL345BCCZ_LGA-14`               |
| DHT11                      | `Sensor_Humidity:DHT11_SIP-4`                           |
| AMS1117-3.3                | `Package_TO_SOT_SMD:SOT-223-3_TabPin2`                  |
| MT3608 boost               | `Package_TO_SOT_SMD:SOT-23-6`                           |
| JST-PH 2-pin               | `Connector_JST:JST_PH_S2B-PH-K_1x02_P2.00mm_Horizontal` |
| Programming pads (PP1–PP6) | `TestPoint:TestPoint_Pad_1.5x1.5mm` (×6, in a row)      |
| 0402 resistors/caps        | `Resistor_SMD:R_0402_1005Metric`                        |
| BAV99                      | `Package_TO_SOT_SMD:SOT-23`                             |
| Tactile switch             | `Button_Switch_SMD:SW_SPST_CK_RS282G05A3`               |

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

| Section                   | Status                | Notes                                                         |
| ------------------------- | --------------------- | ------------------------------------------------------------- |
| ESP32 + programming pads  | ✅ Fully functional   | Standard one-time UART flash procedure                        |
| LiPo power + AMS1117      | ✅ Fully functional   | Well-proven LDO circuit                                       |
| MT3608 5V boost for MQ135 | ✅ Functional         | Set feedback resistors for 5V output per datasheet            |
| ADXL345 I2C               | ✅ Fully functional   | Standard digital IC                                           |
| DHT11                     | ✅ Fully functional   | Simple 3-pin circuit                                          |
| MQ135 (raw ADC)           | ✅ Functional         | Adjust R_L trim pot for your environment                      |
| EXG (INA128 circuit)      | ✅ Circuit is correct | Signal quality depends on PCB layout and electrode quality    |
| EXG (signal quality)      | ⚠️ May need tuning    | Gain and filter values may need adjustment per electrode type |

**"Partially working"** means every circuit is real and correct —
it is not a dummy board. With good assembly and layout it should work.
Signal quality on the EXG section may need one round of R_G / filter tuning.

---

## 10. Common Mistakes to Avoid

| Mistake                                     | Consequence                                           | Fix                                                  |
| ------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| MQ135 heater on 3.3V instead of 5V          | Sensor won't heat → no gas detection                  | Connect heater pins to MT3608 5V output              |
| MT3608 feedback resistors wrong             | 5V output becomes 4V or 7V                            | Calculate R_FB per MT3608 datasheet for exactly 5V   |
| Missing ESD protection on EXG inputs        | First static discharge destroys INA128                | Always add BAV99 on IN+ and IN−                      |
| Single ground plane under EXG and digital   | Digital switching noise on EXG output                 | Split AGND / DGND, join at one point                 |
| MT3608 near EXG analog section              | Boost converter switching induces noise on EXG        | Keep MT3608 physically far from INA128               |
| Skipping mid-supply REF on INA128           | Output clipped on one half of signal                  | R7, R8, C8 divider on REF pin is mandatory           |
| I2C pull-ups on each device separately      | Parallel resistors = too low pull-up impedance        | One pair of 4.7kΩ pull-ups for the whole I2C bus     |
| ADXL345 CS left floating                    | Random mode selection, I2C may not work               | Tie CS to 3.3V for I2C mode                          |
| MQ135 AO connected directly to ESP32 GPIO   | GPIO sees >3.3V → damage                              | Always use R13/R14 voltage divider                   |
| DHT11 near MQ135 heater                     | Temperature readings falsely high                     | Place DHT11 on opposite side of board                |
| Gain resistor R_G too far from INA128       | Stray capacitance alters gain at high freq            | Place R_G between pins 1 and 8 directly on the IC    |
| Programming pads not labelled in silkscreen | Cannot identify which pad is TX/RX during programming | Always label GND, 3V3, TX, RX, EN, IO0 in silkscreen |
