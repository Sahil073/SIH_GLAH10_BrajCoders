# Sanjeevni Custom Wearable PCB

This directory contains the schematic design, printed circuit board (PCB) layout, 3D renderings, and manufacturing guidelines for the Sanjeevni wearable hardware prototype, designed using KiCad.

---

## Directory Contents

| File / Folder | Type | Description |
| :--- | :--- | :--- |
| [`Sanjeevni_PCB.kicad_sch`](Sanjeevni_PCB.kicad_sch) | KiCad Schematic | Full schematic capture including power regulation, ESP32 core, sensor front-ends, and programming pads. |
| [`Sanjeevni_PCB.kicad_pcb`](Sanjeevni_PCB.kicad_pcb) | KiCad Board Layout | 2-layer PCB layout routing power planes, high-frequency digital lines, and shielded analog tracks. |
| [`Sanjeevni_PCB.kicad_pro`](Sanjeevni_PCB.kicad_pro) | Project File | KiCad project configuration and library mappings. |
| [`PCB schema.pdf`](<PCB schema.pdf>) | Schematic Export | High-resolution PDF export of the complete circuit schematic for easy review without KiCad installed. |
| [`PCB design.pdf`](<PCB design.pdf>) | Layout Export | High-resolution PDF export of the top and bottom copper layers, silkscreen, and drill guides. |
| [`PCB_Design_Guide.md`](PCB_Design_Guide.md) | Engineering Guide | In-depth documentation detailing the Bill of Materials (BOM), trace width calculations, noise isolation, and step-by-step routing methodology. |
| [`images/`](images/) | 3D Visualizations | Rendered views of the populated board: [top view](images/top%20view.png), [isometric view 1](images/isometric%20view.png), [isometric view 2](images/isometric%20view%202.png). |

---

## Hardware Architecture & Design Decisions

### 1. Form Factor & Enclosure Considerations
- **Field-Sealed Wearable**: To ensure durability in harsh industrial or remote environments, the production board does not include an onboard micro-USB or Type-C port. 
- **Factory Programming Interface**: 6 exposed test pads (`GND`, `3V3`, `TX`, `RX`, `EN`, `IO0`) are positioned along the board edge, allowing firmware programming via a removable pogo-pin jig before sealing.
- **Power Connection**: 2-pin JST-PH 2.00 mm horizontal receptacle for standard 3.7V single-cell LiPo rechargeable batteries.

### 2. Sensor Integration Strategy
- **BioAmp EXG Pill (Daughterboard)**: Mounted via standard 2.54 mm female pin headers rather than integrating bare IC components. This isolates the sensitive biopotential instrumentation amplifier (110 dB CMRR, 4th-order active bandpass filter) from digital switching noise and RF ground bounce.
- **ADXL345 (Bare IC)**: Direct LGA-14 surface mount footprint on the I2C bus (`GPIO 21` SDA, `GPIO 22` SCL) with 4.7 kΩ pull-up resistors and local 100 nF decoupling.
- **DHT11 (Through-Hole Footprint)**: 4-pin single-row connector with pull-up resistor on the single-wire data line (`GPIO 4`).
- **MQ135 (Raw Element)**: 6-pin circular footprint for the bare electrochemical gas sensing element. Driven by an onboard MT3608 boost converter providing the required 5V rail for the internal heating element.

### 3. Power Distribution Architecture
- **Battery Input**: 3.7V nominal LiPo (operating range 3.0V – 4.2V).
- **3.3V Logic Rail**: AMS1117-3.3 low-dropout linear regulator providing clean 3.3V power to the ESP32-WROOM-32D module, ADXL345, DHT11, and BioAmp EXG Pill. Bulk decoupling capacitors (10 µF tantalum + 100 nF ceramic) are placed directly at the regulator and MCU pins.
- **5.0V Heater Rail**: MT3608 DC-DC step-up switching regulator stepping 3.7V up to 5.0V dedicated exclusively to the MQ135 heating coil. Thermal relief vias and a dedicated ground return keep switching noise out of the analog measurement circuits.

---

## Fabrication Specifications

- **Layer Count**: 2 Layers (Top Layer: Signal & Power, Bottom Layer: Unbroken Ground Plane)
- **Board Material**: Standard FR-4
- **Finished Copper Weight**: 1 oz (35 µm)
- **Dielectric Thickness**: 1.6 mm
- **Minimum Trace Width**: 0.25 mm (10 mil) for signal traces; 0.6 mm (24 mil) for 3.3V power distribution
- **Minimum Clearance**: 0.2 mm (8 mil)
- **Minimum Drill Hole Size**: 0.3 mm (via), 0.9 mm (through-hole component pins)

For the complete component catalog, KiCad symbol mappings, and step-by-step routing layout instructions, consult [`PCB_Design_Guide.md`](PCB_Design_Guide.md).

