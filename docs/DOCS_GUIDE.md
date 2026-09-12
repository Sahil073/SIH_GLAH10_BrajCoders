# Project Documentation & Specifications

This directory contains reference documents, technical specifications, hardware build guides, and presentation decks created for the Sanjeevni project.

---

## Document Index

| Document | Format | Description |
| :--- | :--- | :--- |
| [`sanjeevni_app_spec.pdf`](sanjeevni_app_spec.pdf) | Technical Specification | Functional and architectural specification of the Sanjeevni mobile companion application. Details UI state machines, offline-first data flows, BLE protocol contracts, on-device AI integration, and local SQLite persistence. |
| [`sanjeevni_buildguide.pdf`](sanjeevni_buildguide.pdf) | Hardware Build Guide | Step-by-step assembly instructions for breadboard prototyping and custom hardware integration. Covers ESP32 wiring, pinouts, passive filtering components, sensor breakout modules, and power supply considerations. |
| [`BrajCoder's_SIH_Round1.pdf`](BrajCoder's_SIH_Round1.pdf) | Presentation Deck | Smart India Hackathon Round 1 presentation covering the initial problem statement, target demographics (industrial workers, miners, athletes), technical approach, and system block diagrams. |
| [`BrajCoders_SIH_Round1.pdf`](BrajCoders_SIH_Round1.pdf) | Presentation Deck | Smart India Hackathon Round 1 presentation covering the initial problem statement, target demographics (industrial workers, miners, athletes), technical approach, and system block diagrams. |
| [`BrajCoders_SIH_2026.pdf`](BrajCoders_SIH_2026.pdf) | Presentation Deck | Comprehensive hackathon project submission detailing the working hardware prototype, on-device DSP algorithms (Pan-Tompkins, Biquad IIR, Rothfusz heat index), custom PCB design, test results, and field deployment feasibility. |

---

## Technical Highlights by Document

### 1. Application Specification (`sanjeevni_app_spec.pdf`)
- **Offline Requirements**: Defines the design criteria for 100% offline operation without internet connectivity, remote APIs, or cloud infrastructure.
- **Biomedical Signal Pipeline**: Outlines the 500 Hz biopotential ingestion from the BioAmp EXG Pill, continuous windowing, Pan-Tompkins QRS detection, and heart rate variability (HRV) metrics.
- **Environmental Hazard Fusion**: Specifies the multi-sensor correlation model combining ambient temperature, relative humidity, and air quality (MQ135 ADC readings).
- **Storage & Retention**: Details the on-device SQLite database schema, indexing strategies, and automated 7-day circular pruning policy.

### 2. Hardware Build Guide (`sanjeevni_buildguide.pdf`)
- **Bill of Materials**: Component lists for both benchtop breadboard validation and prototype hardware assembly.
- **Wiring & Pin Allocation**: Complete pin mapping for ESP32 DevKit V1 interfacing with BioAmp EXG, ADXL345 (I2C), DHT11, MQ135, and capacitive moisture sensors.
- **Power Budget & Regulation**: Details 3.7V LiPo battery operation, AMS1117 3.3V linear regulation for the microcontroller and sensitive analog front-ends, and 5V step-up boost conversion for the MQ135 heater element.
- **Assembly Verification**: Verification checkpoints for power rail voltages, I2C pull-ups, analog reference noise, and serial debug telemetry.

### 3. Presentation Decks
- **Context**: Developed for evaluation in the Smart India Hackathon (SIH) under Team BrajCoders.
- **Scope**: Explains the rationale behind moving biomedical intelligence from the cloud to the extreme edge (the user's phone paired with a wearable ESP32 hub). Focuses on emergency response in underground mining, outdoor industrial plants, high-altitude sports, and remote patient monitoring.
