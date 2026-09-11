// =============================================================================
// Bioamp_EXG_Bluetooth.ino
//
// PURPOSE:
//   Combines the BioAmp EXG Pill raw ADC acquisition with Bluetooth Classic
//   SPP transmission. Reads a single EXG sample every 10 ms (~100 Hz) and
//   immediately streams it to a connected Bluetooth client as plain text.
//
//   Use this sketch to:
//     1. Verify end-to-end data flow from EXG Pill → ESP32 → Bluetooth → phone.
//     2. Observe live EXG waveforms on an Android Bluetooth terminal app.
//     3. Validate Bluetooth latency and throughput before integrating into
//        the full multi-sensor hub (ESP32_Sensor_Hub.ino).
//
// SENSOR:
//   BioAmp EXG Pill (by Upside Down Labs)
//   Instrumentation-amplifier front-end for biopotential signals.
//   Output is a conditioned analog voltage proportional to the electrode
//   differential. This sketch reads only the raw ADC value — no signal
//   interpretation is performed.
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1) — Arduino framework
//   IMPORTANT: BluetoothSerial requires the original ESP32 chip.
//   Not available on ESP32-S2, S3, or C3.
//
// LIBRARY:
//   BluetoothSerial — included in the ESP32 Arduino core.
//
// BLUETOOTH DEVICE NAME:
//   "ESP32_EXG"
//
// WIRING:
//   EXG Pill OUT  →  GPIO 34  (input-only ADC pin, ADC1_CH6)
//   EXG Pill VCC  →  3.3 V
//   EXG Pill GND  →  GND
//
// ADC:
//   Resolution : 12-bit  →  values in range 0 – 4095
//
// DATA FORMAT (plain text, comma-separated, one sample per line):
//   EXG,<raw_adc_value>
//
//   Example output stream over Bluetooth:
//     EXG,2048
//     EXG,2051
//     EXG,2046
//     ...
//
//   NOTE: The integration sketch (ESP32_Sensor_Hub.ino) uses a different
//   JSON format with a 128-sample buffer packet instead of per-sample text.
//   This plain-text format is used here only for simple visual testing.
//
// SAMPLING RATE:
//   ~100 Hz  (one sample per 10 ms delay)
//   The delay()-based timing is acceptable for a basic Bluetooth test but
//   is not precise. The full integration uses micros()-based 500 Hz scheduling.
//
// USB SERIAL:
//   Baud rate : 115200
//   Every sample value is also printed locally for monitoring.
// =============================================================================

#include "BluetoothSerial.h" // Bluetooth Classic SPP — ESP32 Arduino core

// ============================================================
// CONFIGURATION
// ============================================================

// GPIO connected to the BioAmp EXG Pill analog output.
// GPIO 34 is an input-only pin on classic ESP32 — safe for ADC use.
#define EXG_PIN 34

// ============================================================
// BLUETOOTH
// ============================================================

// Single BluetoothSerial instance.
// Exposes an SPP channel — remote devices see this as a virtual serial port.
BluetoothSerial SerialBT;

// ============================================================
// SETUP EXG
// ============================================================

void setupEXG()
{
    // Declare GPIO 34 as a digital input.
    // On input-only pins this is implicit, but stating it makes intent clear.
    pinMode(EXG_PIN, INPUT);

    // Set ADC to 12-bit resolution: values 0–4095 across 0–3.3 V.
    // ESP32 default is 12 bits, but setting it explicitly avoids any
    // board-core version differences in the default.
    analogReadResolution(12);

    Serial.println("EXG Pill initialized");
}

// ============================================================
// READ EXG
// ============================================================

// Returns the raw 12-bit ADC value from the EXG Pill output.
// Range: 0 – 4095.
// The returned value represents the amplified biopotential voltage
// mapped to the ADC input range. It is NOT in physical units (µV, mV).
int readEXG()
{
    return analogRead(EXG_PIN);
}

// ============================================================
// SEND EXG DATA OVER BLUETOOTH
// ============================================================

// Transmits one EXG sample to the connected Bluetooth client.
// Format: "EXG,<value>\n"
// If no client is connected, silently returns without sending.
void sendBluetooth(int exgValue)
{
    // Guard: do not attempt to send if no Bluetooth device is connected.
    // Sending to a disconnected client would silently fail.
    if (!SerialBT.hasClient())
    {
        return;
    }

    // Plain-text CSV format: label, value, newline
    // Example: "EXG,2048\n"
    SerialBT.print("EXG,");
    SerialBT.println(exgValue);
}

// ============================================================
// SETUP BLUETOOTH
// ============================================================

void setupBluetooth()
{
    // Advertise as "ESP32_EXG" — this name appears in the Bluetooth device list
    // on phones and computers during scanning/pairing.
    SerialBT.begin("ESP32_EXG");

    Serial.println("Bluetooth started");
    Serial.println("Device name: ESP32_EXG");
}

// ============================================================
// SETUP
// ============================================================

void setup()
{
    // USB Serial for local debugging and monitoring
    Serial.begin(115200);

    // Brief delay to allow the USB serial port to initialise on the host
    delay(1000);

    Serial.println();
    Serial.println("==============================");
    Serial.println("ESP32 BioAmp EXG Test");
    Serial.println("==============================");

    // Initialise EXG Pill ADC pin and resolution
    setupEXG();

    // Start Bluetooth Classic SPP advertising
    setupBluetooth();
}

// ============================================================
// LOOP
// ============================================================

void loop()
{
    // Acquire one raw ADC sample from the EXG Pill
    int exgValue = readEXG();

    // Print the raw value to the USB Serial Monitor for local inspection.
    // Open Tools → Serial Monitor at 115200 baud, or Serial Plotter to
    // visualise the waveform.
    Serial.print("EXG: ");
    Serial.println(exgValue);

    // Transmit the same value over Bluetooth to the connected client.
    // If no client is present, sendBluetooth() returns immediately.
    sendBluetooth(exgValue);

    // 10 ms delay → ~100 Hz sample rate.
    // NOTE: delay() blocks the CPU, making timing approximate.
    // The production integration (ESP32_Sensor_Hub.ino) achieves 500 Hz
    // using a non-blocking micros()-based scheduler instead.
    delay(10);
}