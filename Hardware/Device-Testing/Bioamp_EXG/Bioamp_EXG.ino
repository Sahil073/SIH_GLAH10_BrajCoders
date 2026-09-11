// =============================================================================
// Bioamp_EXG.ino
//
// PURPOSE:
//   Basic analog read test for the BioAmp EXG Pill sensor.
//   Reads raw 12-bit ADC values from the EXG Pill and prints them to the
//   USB Serial Monitor at approximately 100 Hz (delay of 10 ms per sample).
//
//   Use this sketch to:
//     1. Confirm the EXG Pill is electrically connected to GPIO 34.
//     2. Observe the raw ADC signal waveform using Arduino Serial Plotter.
//     3. Check for noise, clipping, or unexpected offsets before moving
//        to Bluetooth transmission.
//
// SENSOR:
//   BioAmp EXG Pill (by Upside Down Labs)
//   An instrumentation-amplifier-based biopotential acquisition front-end.
//   Capable of capturing EMG, ECG, EOG, and EEG signals depending on
//   electrode placement. This sketch reads the raw analog output only —
//   no signal classification or biomedical interpretation is performed.
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1) — Arduino framework
//
// WIRING:
//   EXG Pill OUT  →  GPIO 34 (input-only pin; no internal pull-up)
//   EXG Pill VCC  →  3.3 V
//   EXG Pill GND  →  GND
//   Electrodes connected per BioAmp EXG Pill documentation.
//
// ADC:
//   Resolution : 12-bit  →  values in range 0 – 4095
//   Reference  : Internal (3.3 V rail on classic ESP32)
//   GPIO 34 is an input-only ADC-capable pin (ADC1_CH6).
//   It has no output driver and no internal pull-up/pull-down.
//
// DATA FORMAT (USB Serial, plain integer, one value per line):
//   <raw_adc_value>
//
//   Example output stream:
//     2048
//     2051
//     2046
//     ...
//
// SAMPLING RATE:
//   ~100 Hz  (10 ms delay per sample — not precision-timed)
//   For accurate 500 Hz acquisition see Bioamp_EXG_Bluetooth.ino
//   and ESP32_Sensor_Hub.ino which use micros()-based scheduling.
//
// NOTE:
//   This is a local USB-only test sketch.
//   No Bluetooth transmission occurs here.
//   Open the Arduino Serial Plotter (Tools → Serial Plotter) at 115200 baud
//   to visualise the raw waveform in real time.
// =============================================================================

// GPIO connected to the BioAmp EXG Pill analog output.
// GPIO 34 is an input-only pin on the classic ESP32 — safe for ADC use.
#define EXG_PIN 34

void setup()
{
    // USB Serial for streaming ADC values to the Serial Monitor / Plotter
    Serial.begin(115200);

    // Set ADC resolution to 12 bits.
    // This gives a value range of 0–4095 for the full 0–3.3 V input swing.
    // Must be called before the first analogRead().
    analogReadResolution(12);

    // Configure the EXG pin explicitly as INPUT.
    // On GPIO 34 this is redundant (input-only hardware), but keeps intent clear.
    pinMode(EXG_PIN, INPUT);

    Serial.println("BioAmp EXG Pill test");
}

void loop()
{
    // Read the current raw ADC value from the EXG Pill output.
    // Value range: 0 – 4095  (12-bit, 0 V – ~3.3 V)
    // The signal represents the amplified biopotential from the electrodes.
    int value = analogRead(EXG_PIN);

    // Print one integer value per line.
    // The Arduino Serial Plotter interprets each newline-terminated integer
    // as a new data point and plots it automatically.
    Serial.println(value);

    // Wait 10 ms before the next sample → ~100 Hz acquisition rate.
    // NOTE: delay() is used here because precise timing is not critical
    // for this visual inspection test. For 500 Hz precision acquisition,
    // use a micros()-based scheduler as in ESP32_Sensor_Hub.ino.
    delay(10);
}