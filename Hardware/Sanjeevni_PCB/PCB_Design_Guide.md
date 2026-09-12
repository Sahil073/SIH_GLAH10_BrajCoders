# PCB Design Guide — ESP32 Sensor Hub (Prototype)

> **Project:** SIH GLAH10 BrajCoders
> **Tool:** KiCad 7 / KiCad 8
> **Goal:** Prototype PCB integrating sensors onto one board — designed for field deployment, not bench use
> **Strategy:** Bare ICs for ADXL345, DHT11; MQ135 as raw element; BioAmp EXG Pill mounted as modular daughterboard; no USB connector
> **MCU:** ESP32-WROOM-32 module (not bare chip — avoids RF design complexity)
> **Programming:** One-time via exposed UART pads using a removable jig — no USB connector on board
> **Power:** LiPo battery (3.7V) → AMS1117-3.3 → 3.3V rail; MQ135 powered via small boost converter

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Full Bill of Materials (BOM) & KiCad Symbols](#2-full-bill-of-materials-bom--kicad-symbols)
3. [Power Architecture](#3-power-architecture)
4. [Schematic Guide — Section by Section](#4-schematic-guide--section-by-section)
   - [4.1 ESP32 Core Circuit](#41-esp32-core-circuit)
   - [4.2 Power Supply — LiPo + AMS1117](#42-power-supply--lipo--ams1117)
   - [4.3 Programming Pads](#43-programming-pads)
   - [4.4 BioAmp EXG Pill Module Interface](#44-bioamp-exg-pill-module-interface)
   - [4.5 ADXL345 Accelerometer](#45-adxl345-accelerometer)
   - [4.6 DHT11 Temperature & Humidity](#46-dht11-temperature--humidity)
   - [4.7 MQ135 Air Quality Sensor](#47-mq135-air-quality-sensor)
5. [PCB Layout Guide](#5-pcb-layout-guide)
6. [Layer Stackup](#6-layer-stackup)
7. [BioAmp EXG Pill Daughterboard Integration](#7-bioamp-exg-pill-daughterboard-integration)
8. [KiCad Step-by-Step Workflow](#8-kicad-step-by-step-workflow)
9. [What "Partially Working" Means for This Board](#9-what-partially-working-means-for-this-board)
10. [Common Mistakes to Avoid](#10-common-mistakes-to-avoid)

---

## 1. Design Philosophy

### What goes on the PCB as a bare IC vs as a module

| Component | Approach | Reason |
|---|---|---|
| ESP32 | WROOM-32 **module** | RF antenna design is complex and not worth it for a prototype |
| BioAmp EXG | **Modular daughterboard** (pin headers) | Preserves tuned 4th-order active bandpass filtering, 110 dB CMRR, and prevents switching noise coupling |
| ADXL345 | **Bare IC** (LGA-14) | Standard digital IC, well-supported in KiCad |
| DHT11 | **Bare IC** (SIP-4 through-hole) | Simplest possible integration |
| MQ135 | **Raw sensing element** (6-pin) + support circuit | Sensor element is bare; module's PCB not needed |
| USB connector | **Not present** | This is a field-deployed device — programmed once, then sealed |
| Programming | **6 exposed UART pads** on board edge | Factory jig connects temporarily; no port needed after deployment |
| Power | **JST-PH 2-pin** (LiPo battery) | Portable, wearable form factor |

### "Partially working" definition for this guide

- All digital and analog sensor interfaces are correctly designed
- BioAmp EXG Pill plugs directly into an onboard 2.54mm header socket
- The board **could** be manufactured and would function reliably
- Some hand-soldering of fine-pitch parts (ADXL345 LGA) may need a reflow oven
- MQ135 connected as raw element with a boost converter for its 5V heater

---

## 2. Full Bill of Materials (BOM) & KiCad Symbols

> **How to find symbols in KiCad:**
> In the Schematic Editor, press **`A`** (Add Symbol) and paste the exact name from the **KiCad Symbol** column into the search box.

### Microcontroller

| Ref | Component | KiCad Symbol (`Library:Symbol`) | Package / Footprint | Qty | Notes |
|---|---|---|---|---|---|
| U1 | ESP32-WROOM-32D | `RF_Module:ESP32-WROOM-32` | `RF_Module:ESP32-WROOM-32` | 1 | 4MB flash variant; classic ESP32 module |
| C1 | 100 nF ceramic cap | `Device:C` | `Capacitor_SMD:C_0402_1005Metric` | 4 | Decoupling on 3.3V pins |
| C2 | 10 µF tantalum/ceramic | `Device:C_Polarized` (or `Device:C`) | `Capacitor_SMD:C_0805_2012Metric` | 2 | Bulk decoupling on 3.3V rail |
| LED1 | LED (green) | `Device:LED` | `LED_SMD:LED_0402_1005Metric` | 1 | Power indicator |
| R1 | 330 Ω resistor | `Device:R` | `Resistor_SMD:R_0402_1005Metric` | 1 | LED current limit |
| SW1 | Tactile switch | `Switch:SW_Push` | `Button_Switch_SMD:SW_SPST_CK_RS282G05A3` | 1 | EN / RESET button |
| SW2 | Tactile switch | `Switch:SW_Push` | `Button_Switch_SMD:SW_SPST_CK_RS282G05A3` | 1 | BOOT / GPIO0 button |

### Power Supply

| Ref | Component | KiCad Symbol (`Library:Symbol`) | Package / Footprint | Qty | Notes |
|---|---|---|---|---|---|
| J1 | JST-PH 2-pin connector | `Connector_Generic:Conn_01x02` | `Connector_JST:JST_PH_S2B-PH-K_1x02_P2.00mm_Horizontal` | 1 | LiPo battery input (3.7V) |
| U2 | AMS1117-3.3 LDO regulator | `Regulator_Linear:AMS1117-3.3` | `Package_TO_SOT_SMD:SOT-223-3_TabPin2` | 1 | 3.7V LiPo → 3.3V for ESP32 and sensors |
| U3 | MT3608 boost converter | `Regulator_Switching:MT3608` | `Package_TO_SOT_SMD:SOT-23-6` | 1 | 3.7V → 5V for MQ135 heater |
| C3 | 100 nF ceramic | `Device:C` | `Capacitor_SMD:C_0402_1005Metric` | 2 | Input & output bypass on AMS1117 |
| C4 | 10 µF electrolytic | `Device:C_Polarized` | `Capacitor_SMD:C_0805_2012Metric` | 1 | Bulk cap on AMS1117 output |
| C_B | 100 µF electrolytic | `Device:C_Polarized` | `Capacitor_SMD:C_0805_2012Metric` | 1 | Bulk cap on MT3608 5V output |

### Programming Pads

| Ref | Component | KiCad Symbol (`Library:Symbol`) | Package / Footprint | Qty | Notes |
|---|---|---|---|---|---|
| PP1–PP6 | 6-pad programming interface | `Connector_Generic:Conn_01x06` (or 6× `TestPoint:TestPoint`) | `TestPoint:TestPoint_Pad_1.5x1.5mm` (×6 in a row) | 6 | GND, 3V3, TX, RX, EN, IO0 |

> These 6 pads sit in a row on the edge of the board.
> During factory programming, a pogo-pin jig or a USB-to-UART dongle clips onto these pads,
> loads the firmware, then is removed. No USB connector is soldered to the board.

### BioAmp EXG — Modular Daughterboard Interface

| Ref | Component | KiCad Symbol (`Library:Symbol`) | Package / Footprint | Qty | Notes |
|---|---|---|---|---|---|
| MOD1 | BioAmp EXG Pill Header | `Connector_Generic:Conn_01x04` | `Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical` | 1 | 2.54mm socket for EXG Pill (VCC, GND, OUT, REF) |
| C_EXG | ADC filter capacitor (100 nF) | `Device:C` | `Capacitor_SMD:C_0402_1005Metric` | 1 | Low-pass anti-aliasing / smoothing on GPIO 34 |

> **Why modular mounting?**
> The BioAmp EXG Pill already integrates an instrumentation amplifier, precision active bandpass filters,
> and electrode protection on its dedicated board. Mounting it via a 2.54mm socket saves board area,
> keeps sub-microvolt biopotential traces isolated from RF and boost converter noise, and allows quick module replacement.


### ADXL345 Accelerometer

| Ref | Component | KiCad Symbol (`Library:Symbol`) | Package / Footprint | Qty | Notes |
|---|---|---|---|---|---|
| U5 | ADXL345BCCZ | `Sensor_Motion:ADXL345` | `Sensor_Motion:Analog_ADXL345BCCZ_LGA-14` | 1 | 3-axis I2C accelerometer |
| C10, C11 | Bypass caps (100 nF) | `Device:C` | `Capacitor_SMD:C_0402_1005Metric` | 2 | On VS and VDD/IO pins |
| C12 | Bulk bypass (10 µF) | `Device:C_Polarized` (or `Device:C`) | `Capacitor_SMD:C_0805_2012Metric` | 1 | Near ADXL on 3.3V rail |
| R10, R11 | I2C pull-ups (4.7 kΩ) | `Device:R` | `Resistor_SMD:R_0402_1005Metric` | 2 | On SDA and SCL lines |

### DHT11 Temperature & Humidity

| Ref | Component | KiCad Symbol (`Library:Symbol`) | Package / Footprint | Qty | Notes |
|---|---|---|---|---|---|
| U6 | DHT11 sensor | `Sensor_Humidity:DHT11` | `Sensor_Humidity:DHT11_SIP-4` | 1 | 4-pin bare IC; pin 3 (NC) left floating |
| R12 | Data pull-up (10 kΩ) | `Device:R` | `Resistor_SMD:R_0402_1005Metric` | 1 | Between DATA pin and VCC |
| C13 | Bypass cap (100 nF) | `Device:C` | `Capacitor_SMD:C_0402_1005Metric` | 1 | On VCC pin |

### MQ135 Air Quality

| Ref | Component | KiCad Symbol (`Library:Symbol`) | Package / Footprint | Qty | Notes |
|---|---|---|---|---|---|
| U7 | MQ135 sensing element | `Sensor_Gas:MQ-135` (or `Connector_Generic:Conn_01x06`) | `Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical` | 1 | 6-pin element (heater + sensing) |
| R_L | Load resistor (trim pot 10 kΩ) | `Device:R_Potentiometer_Trim` | `Potentiometer_SMD:Potentiometer_Bourns_3296W_Vertical` | 1 | Adjustable for calibration |
| C14 | Heater bulk cap (100 µF / 10V) | `Device:C_Polarized` | `Capacitor_THT:CP_Radial_D6.3mm_P2.50mm` | 1 | On 5V near MQ135 |
| R13 | Voltage divider top (10 kΩ) | `Device:R` | `Resistor_SMD:R_0402_1005Metric` | 1 | AO output → ESP32 divider |
| R14 | Voltage divider bottom (20 kΩ) | `Device:R` | `Resistor_SMD:R_0402_1005Metric` | 1 | Divides AO to 0–3.3V safe range |

### Connectors & Test Points

| Ref | Component | KiCad Symbol (`Library:Symbol`) | Package / Footprint | Qty | Notes |
|---|---|---|---|---|---|
| J3 | Debug / UART header | `Connector_Generic:Conn_01x04` | `Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical` | 1 | 4-pin: GND, 3.3V, TX, RX |
| TP1–TP6 | Test points | `TestPoint:TestPoint` | `TestPoint:TestPoint_Pad_1.5x1.5mm` | 6 | 3.3V, GND, EXG_OUT, ADXL_SDA, DHT_DATA, MQ135_AO |

> **Power & Ground Schematic Symbols (KiCad `power` library):**
> - `+3.3V` / `+3V3` → `power:+3V3`
> - `+5V` → `power:+5V`
> - `+BATT` (3.7V) → `power:+BATT`
> - Digital Ground → `power:GND`
> - Analog Ground (for EXG) → `power:GNDA` (or `power:AGND`)
> - Power Flag → `power:PWR_FLAG` (attach to 3.3V, 5V, and GND to satisfy ERC)


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
                    ┌──────────────────────────┼──────────────────────────────┐
                    │                          │                              │
              [ESP32-WROOM]           [ADXL345 + DHT11]           [BioAmp EXG Pill Module]
                                      [Bypass caps]               [Decoupling cap]
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

  GPIO34 ─────────────────────────── BioAmp EXG OUT (input-only ADC1_CH6)
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

### 4.4 BioAmp EXG Pill Module Interface

The BioAmp EXG Pill is mounted onto the carrier PCB as a daughterboard via a 4-pin 2.54mm socket (`MOD1`).

```text
MOD1 (4-pin 2.54mm Female Header Socket):
  Pin 1 (VCC) ── 3.3V rail ──[100nF cap]── GND
  Pin 2 (GND) ── GND plane
  Pin 3 (OUT) ──┬── ESP32 GPIO34 (ADC1_CH6)
                │
              [C_EXG: 100nF]── GND  (low-pass noise smoothing)
  Pin 4 (REF) ── GND (or left unconnected if using Pill's onboard reference)

Electrode connections:
  Electrodes (IN+, IN-, REF) connect directly to the BioAmp EXG Pill's onboard
  3.5mm TRRS jack or snap-lead pads.
  Because biopotential amplification occurs entirely on the Pill daughterboard,
  microvolt electrode signals never travel across the main PCB, avoiding switching
  noise from the MT3608 boost converter and 2.4 GHz Bluetooth RF harmonics.
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
│   BIOAMP EXG DAUGHTERBOARD  │   5V ZONE             │
│   [MOD1 1x4 Socket Header]  │   [MQ135 element]     │
│   (TRRS jack faces edge)    │   [MT3608 bulk cap]   │
└─────────────────────────────────────────────────────┘
```

- **Top edge** — programming pads row (board edge, accessible with pogo jig)
- **Top zone** — JST battery connector, LDO, boost converter, ESP32 module
- **Middle zone** — digital sensors (ADXL345, DHT11) and buttons
- **Bottom-left** — BioAmp EXG Pill module socket (places the TRRS electrode jack near the board edge)
- **Bottom-right** — MQ135 element at board corner (needs airflow; 5V traces isolated here)

### Ground plane rules

- Use a **solid copper pour** for GND on the bottom layer across the whole board
- Because biopotential amplification occurs entirely on the BioAmp Pill daughterboard, the main PCB only handles high-level (0–3.3V) signals. A clean, continuous ground plane is recommended without needing risky ground splits.
- The MQ135 heater current and MT3608 switching loop must return directly to battery GND — keep their copper path away from the EXG socket

### Trace widths

| Signal | Width |
|---|---|
| 3.3V power | 0.5 mm |
| 5V / MQ135 heater | 1.0 mm |
| MT3608 inductor traces | 1.0 mm (short as possible) |
| GND copper pour | Solid pour |
| I2C (SDA/SCL) | 0.25 mm |
| EXG OUT analog trace | 0.3 mm (short, direct to GPIO 34) |
| Programming pad traces | 0.5 mm |

### Critical spacing rules

- Place the `MOD1` socket so the BioAmp EXG Pill's TRRS cable jack faces outward towards the board edge
- Keep MT3608 boost converter **away from** the EXG socket — switching harmonics can couple into the ADC input
- Place ADXL345 bypass caps within **2 mm** of the IC
- Keep MQ135 at the **edge** of the board — it needs airflow to sense gases
- DHT11 must not be placed near heat-generating components (MQ135 heater, AMS1117)

---

## 6. Layer Stackup

For a standard 2-layer PCB (cheapest, available everywhere):

| Layer | Used for |
|---|---|
| **Top copper (F.Cu)** | All components, most signal traces, 3.3V/5V fills |
| **Bottom copper (B.Cu)** | Solid GND pour |
| **F.Silkscreen** | Component labels, reference designators, board name |
| **F.Courtyard** | Component boundaries (auto-generated in KiCad) |
| **Edge.Cuts** | Board outline |

> For a 2-layer board: top = signals + components, bottom = solid GND pour.
> Having an unbroken ground plane under the ESP32 and EXG OUT trace gives excellent noise immunity.

---

## 7. BioAmp EXG Pill Daughterboard Integration

Instead of fabricating a discrete, unshielded instrumentation amplifier circuit on a noisy 2-layer carrier board, mounting the **BioAmp EXG Pill** as a modular daughterboard provides significant engineering advantages.

### Why use the BioAmp EXG Pill as a Daughterboard?

| Consideration | Discrete IC on Carrier PCB | BioAmp EXG Pill Daughterboard |
|---|---|---|
| **Biopotential Signal** | Vulnerable to 50 Hz hum & RF crosstalk | Amplified & filtered directly at source |
| **Active Filtering** | Requires 12+ precision matched resistors/caps | Integrated 4th-order active bandpass filter |
| **CMRR (Common-Mode)** | Degrades rapidly with trace length mismatch | Guaranteed >100 dB on dedicated sub-board |
| **Switching Noise** | MT3608 1.2MHz harmonics easily couple | Physically isolated ground & input loops |
| **Maintenance & Swap** | Non-replaceable if op-amp blows | Pluggable module; hot-swap in seconds |
| **Electrode Jack** | Must route custom 3.5mm TRRS pads | Built-in TRRS / snap connector on Pill |

### Board-to-Board Interconnect (MOD1)

The carrier PCB provides a standard 4-pin 2.54mm female header socket (`MOD1`):

```text
Carrier PCB (MOD1)           BioAmp EXG Pill Module
  Pin 1: 3.3V   ──────────────  VCC
  Pin 2: GND    ──────────────  GND
  Pin 3: GPIO34 ──────────────  OUT (Amplified biopotential 0–3.3V)
  Pin 4: GND/NC ──────────────  REF (Optional reference lead)
```

### Signal Chain with Daughterboard

```text
Body Electrodes (IN+, IN-, REF)
  │
  ▼ [Direct connection via 3.5mm TRRS jack on Pill]
BioAmp EXG Pill (Daughterboard)
  ├── ESD Clamping Diodes
  ├── Instrumentation Amplifier (Gain ~1000×)
  ├── Active High-Pass Filter (removes DC baseline wander)
  ├── Active Low-Pass Filter (removes high-frequency interference)
  └── Mid-Supply Reference (sets 1.65V baseline)
  │
  ▼ [High-level 0–3.3V signal via Pin 3]
Carrier PCB
  └── [C_EXG 100nF smoothing cap] ── GPIO34 (ESP32 ADC1_CH6) ── analogRead()
```

### Design Benefits for SIH / Presentations

- **Modular Architecture:** Highlight that your sensor hub uses a modular medical-grade biopotential front-end, separating low-noise analog acquisition from digital processing.
- **Interchangeability:** Allows swapping between different BioAmp variations (EMG, ECG, EOG, EEG) without re-spinning the carrier PCB.
- **Proven Functionality:** Judges respect pragmatic engineering choices that ensure reliable hardware operation over unnecessary discrete redesigns.

---

## 8. KiCad Step-by-Step Workflow

### Step 1 — Create KiCad project

```text
KiCad → Project already created: "Hardware/Sanjeevni_PCB/Sanjeevni_PCB.kicad_pro"
```

### Step 2 — Draw schematic (Schematic Editor)

Draw schematic **section by section** in this order:

1. Power symbols first (VCC_5V, VCC_3V3, GND)
2. JST-PH connector + AMS1117 + MT3608 boost converter (power section)
3. ESP32-WROOM-32 with all GPIO labels
4. Programming pads (PP1–PP6) connected to ESP32 TX, RX, EN, GPIO0
5. BioAmp EXG Pill header (`MOD1`, Conn_01x04)
6. ADXL345
7. DHT11
8. MQ135 + voltage divider

Use **global labels** in KiCad to connect nets across schematic sheets
without drawing long wires:

- `EXG_OUT` — from MOD1 pin 3 to ESP32 GPIO34
- `SDA`, `SCL` — I2C bus
- `DHT_DATA` — GPIO4
- `MQ135_AO` — GPIO35

### Step 3 — Assign footprints

Use the footprint assignment tool. Key footprints:

| Symbol | KiCad Footprint |
|---|---|
| ESP32-WROOM-32D | `RF_Module:ESP32-WROOM-32` |
| BioAmp EXG Pill (MOD1) | `Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical` |
| ADXL345BCCZ | `Sensor_Motion:Analog_ADXL345BCCZ_LGA-14` |
| DHT11 | `Sensor_Humidity:DHT11_SIP-4` |
| AMS1117-3.3 | `Package_TO_SOT_SMD:SOT-223-3_TabPin2` |
| MT3608 boost | `Package_TO_SOT_SMD:SOT-23-6` |
| JST-PH 2-pin | `Connector_JST:JST_PH_S2B-PH-K_1x02_P2.00mm_Horizontal` |
| Programming pads (PP1–PP6) | `TestPoint:TestPoint_Pad_1.5x1.5mm` (×6, in a row) |
| 0402 resistors/caps | `Resistor_SMD:R_0402_1005Metric` |
| Tactile switch | `Button_Switch_SMD:SW_SPST_CK_RS282G05A3` |

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
5. Route I2C bus (SDA/SCL)
6. Route EXG OUT trace directly to GPIO 34 (keep away from MT3608 inductor)
7. Add copper pour: top = 3.3V fill in digital zone, bottom = GND fill everywhere
8. Add silkscreen labels for programming pads (`GND`, `3V3`, `TX`, `RX`, `EN`, `IO0`) on the edge

### Step 6 — Run Design Rule Check (DRC)

Fix all clearance violations before exporting.

### Step 7 — 3D View for PPT

```text
PCB Editor → View → 3D Viewer → Render → Export as PNG
```

---

## 9. What "Partially Working" Means for This Board

| Section | Status | Notes |
|---|---|---|
| ESP32 + programming pads | ✅ Fully functional | Standard one-time UART flash procedure |
| LiPo power + AMS1117 | ✅ Fully functional | Well-proven LDO circuit |
| MT3608 5V boost for MQ135 | ✅ Functional | Set feedback resistors for 5V output per datasheet |
| BioAmp EXG Pill (Module) | ✅ Fully functional | Pre-filtered 4th-order active biopotential front-end; plug-and-play |
| ADXL345 I2C | ✅ Fully functional | Standard digital IC |
| DHT11 | ✅ Fully functional | Simple 3-pin circuit |
| MQ135 (raw ADC) | ✅ Functional | Adjust R_L trim pot for your environment |

**"Partially working"** means every circuit is real, proven, and correct —
it is not a dummy board. With good assembly and layout it will function reliably in real testing.

---

## 10. Common Mistakes to Avoid

| Mistake | Consequence | Fix |
|---|---|---|
| MQ135 heater on 3.3V instead of 5V | Sensor won't heat → no gas detection | Connect heater pins to MT3608 5V output |
| MT3608 feedback resistors wrong | 5V output becomes 4V or 7V | Calculate R_FB per MT3608 datasheet for exactly 5V |
| MT3608 near EXG analog socket | Boost converter switching induces ripple on EXG ADC | Keep MT3608 physically far from MOD1 socket |
| Reversing BioAmp EXG header pinout | Reverse polarity destroys the module | Check Pin 1 (VCC) silkscreen marker on MOD1 socket |
| I2C pull-ups on each device separately | Parallel resistors = too low pull-up impedance | One pair of 4.7kΩ pull-ups for the whole I2C bus |
| ADXL345 CS left floating | Random mode selection, I2C may not work | Tie CS to 3.3V for I2C mode |
| MQ135 AO connected directly to ESP32 GPIO | GPIO sees >3.3V → damage | Always use R13/R14 voltage divider |
| DHT11 near MQ135 heater | Temperature readings falsely high | Place DHT11 on opposite side of board |
| Programming pads not labelled in silkscreen | Cannot identify which pad is TX/RX during programming | Always label GND, 3V3, TX, RX, EN, IO0 in silkscreen |

