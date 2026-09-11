// =============================================================================
// MQ135_Bluetooth.ino
//
// PURPOSE:
//   Tests the MQ135 air quality sensor and streams raw ADC readings to a
//   connected Bluetooth Classic client.
//
//   Use this sketch to:
//     1. Confirm the MQ135 is correctly wired and powered (heater warm-up
//        is required — see warm-up note below).
//     2. Observe the raw ADC output value on USB Serial Monitor and via
//        Bluetooth terminal.
//     3. Validate Bluetooth data flow before integration into the full hub.
//
// SENSOR:
//   MQ135 — Air Quality / Gas Detection Sensor
//   Target gases : CO2, NH3, benzene, alcohol, smoke (multi-gas)
//   Interface    : Analog voltage output (AO pin)
//   Output       : Analog voltage proportional to gas concentration;
//                  higher gas concentration → higher voltage → higher ADC value
//   ADC output   : 0 – 4095 (12-bit, raw; NOT in ppm)
//   Warm-up time : 24–48 hours for stabilisation; at least 3–5 minutes
//                  for approximate readings after each power-on.
//
//   IMPORTANT: This sketch reads and transmits the RAW ADC value only.
//   No ppm conversion or calibration is applied. Converting raw ADC to ppm
//   requires the Rs/R0 ratio, sensor-specific calibration curves, and known
//   reference gas concentration — none of which are implemented here.
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1) — Arduino framework
//
// LIBRARY:
//   BluetoothSerial — Bluetooth Classic SPP (ESP32 Arduino core)
//   No MQ135 library is used; direct analogRead() is sufficient.
//
// WIRING:
//   MQ135 VCC  →  5 V  (the heater element requires 5 V supply)
//   MQ135 GND  →  GND
//   MQ135 AO   →  GPIO 35  (analog output — input-only pin on classic ESP32)
//   MQ135 DO   →  not connected in this sketch (digital threshold output)
//
//   WARNING: The MQ135 AO output may swing above 3.3 V when gas concentration
//   is very high. Verify your module's output range before connecting to an
//   ESP32 GPIO (max 3.3 V). Some breakout modules include a voltage divider.
//
// NOTE ON GPIO:
//   This test sketch uses GPIO 34 (as originally written).
//   The full integration (ESP32_Sensor_Hub.ino) uses GPIO 35 for MQ135.
//   GPIO 34 and GPIO 35 are both input-only ADC1 pins on the classic ESP32.
//   Update the pin definition if needed to match your wiring.
//
// BLUETOOTH DEVICE NAME:
//   "ESP32_MQ135"
//
// DATA FORMAT (plain text, comma-separated, one value per line):
//   MQ135,<raw_adc_value>
//
//   Example output stream over Bluetooth:
//     MQ135,842
//     MQ135,856
//     MQ135,851
//     ...
//
//   NOTE: The integration sketch (ESP32_Sensor_Hub.ino) uses JSON format
//   with 10-sample averaging:
//   {"v":1,"sensor":4,"seq":N,"ts":N,"data":{"raw":851}}
//
// SAMPLING RATE:
//   2 Hz  (one reading every 500 ms — controlled by delay(500))
//   The production integration uses 10 Hz ADC acquisition with 10-sample
//   averaging transmitted at 1 Hz via non-blocking millis() scheduling.
//
// USB SERIAL:
//   Baud rate : 115200
//   Every raw ADC value is printed locally.
// =============================================================================

#include "BluetoothSerial.h" // Bluetooth Classic SPP — ESP32 Arduino core

// --------------------------------------------------
// Pin configuration
// --------------------------------------------------

// GPIO connected to the MQ135 analog output (AO pin).
// GPIO 34 is an input-only ADC1 pin on the classic ESP32.
// NOTE: The full integration uses GPIO 35 for MQ135.
// Change this value to match your wiring.
#define MQ135_PIN 34

// --------------------------------------------------
// Bluetooth
// --------------------------------------------------

// Single BluetoothSerial instance for Classic SPP.
BluetoothSerial SerialBT;

// --------------------------------------------------
// Bluetooth device name
// --------------------------------------------------

// Visible to remote devices during scanning and pairing.
const char *DEVICE_NAME = "ESP32_MQ135";

// --------------------------------------------------
// MQ135 setup
// --------------------------------------------------

void setupMQ135()
{
    // Configure MQ135 analog pin as a digital input.
    // On input-only GPIO 34/35 this is implicit, but explicit is cleaner.
    pinMode(MQ135_PIN, INPUT);

    // Set ADC resolution to 12-bit.
    // Gives a value range of 0–4095 across 0–3.3 V input.
    // MQ135 output voltage increases with gas concentration.
    analogReadResolution(12);

    Serial.println("MQ135 initialized");
}

// --------------------------------------------------
// Read MQ135
// --------------------------------------------------

// Returns the raw 12-bit ADC reading from the MQ135 analog output.
// Value range: 0 – 4095.
// Higher value = higher voltage = higher relative gas concentration.
// This is NOT a ppm reading — no calibration is applied.
int readMQ135()
{
    return analogRead(MQ135_PIN);
}

// --------------------------------------------------
// Send MQ135 data through Bluetooth
// --------------------------------------------------

// Transmits one raw ADC reading to the Bluetooth client.
// Format: "MQ135,<value>\n"
// Returns immediately if no client is connected.
void sendBluetooth(int mq135Value)
{
    // Guard: do not attempt to send without a connected client.
    if (!SerialBT.hasClient())
    {
        return;
    }

    // CSV plain-text format: label, raw ADC value, newline.
    // Example: "MQ135,842\n"
    SerialBT.print("MQ135,");
    SerialBT.println(mq135Value);
}

// --------------------------------------------------
// Setup
// --------------------------------------------------

void setup()
{
    // USB Serial Monitor at 115200 baud for local debugging
    Serial.begin(115200);

    // Allow USB serial to settle on the host side
    delay(1000);

    Serial.println();
    Serial.println("================================");
    Serial.println("ESP32 + MQ135 + Bluetooth");
    Serial.println("================================");

    // Initialise MQ135 ADC pin and resolution
    setupMQ135();

    // Start Bluetooth Classic SPP and begin advertising
    SerialBT.begin(DEVICE_NAME);

    Serial.print("Bluetooth device name: ");
    Serial.println(DEVICE_NAME);

    Serial.println("Waiting for Bluetooth connection...");
}

// --------------------------------------------------
// Main loop
// --------------------------------------------------

void loop()
{
    // Read one raw ADC sample from the MQ135 analog output.
    // Value is in range 0–4095; no unit conversion is performed.
    int mq135Value = readMQ135();

    // Display the raw value on the USB Serial Monitor.
    // Watch this value change as gas concentration varies near the sensor.
    Serial.print("MQ135: ");
    Serial.println(mq135Value);

    // Send the raw value to the Bluetooth client.
    // If no client is connected, sendBluetooth() returns silently.
    sendBluetooth(mq135Value);

    // Read approximately once every 500 ms → 2 Hz output rate.
    // The production integration (ESP32_Sensor_Hub.ino) reads at 10 Hz
    // with 10-sample averaging and transmits at 1 Hz using millis() gating.
    delay(500);
}