// =============================================================================
// Moisture_Bluetooth.ino
//
// PURPOSE:
//   Tests the capacitive or resistive soil moisture sensor and streams raw
//   ADC readings to a connected Bluetooth Classic client.
//
//   Use this sketch to:
//     1. Confirm the soil moisture sensor is correctly wired to the ADC pin.
//     2. Observe how ADC values change between dry and wet soil conditions.
//     3. Validate Bluetooth data flow before integration into the full hub.
//     4. Determine a practical ADC range for your specific sensor module
//        (values differ between capacitive and resistive types).
//
// SENSOR:
//   Soil Moisture Sensor (capacitive or resistive module)
//   Interface : Analog voltage output (AO pin)
//   Output    : Analog voltage inversely or directly proportional to moisture
//   ADC output: 0 – 4095 (12-bit raw; interpretation depends on module type)
//
//   Capacitive module (recommended):
//     Higher ADC value → drier soil  (output voltage decreases with moisture)
//     Lower ADC value  → wetter soil
//     No corrosion of probes over time.
//
//   Resistive module:
//     Lower ADC value  → drier soil  (higher resistance → lower output voltage)
//     Higher ADC value → wetter soil
//     Probes corrode over time; less recommended for long-term use.
//
//   IMPORTANT: This sketch transmits the RAW ADC value only.
//   No percentage conversion is applied. Dry/wet calibration requires
//   recording the ADC values of fully dry and fully saturated soil with
//   your specific sensor module — not implemented here.
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1) — Arduino framework
//
// LIBRARY:
//   BluetoothSerial — Bluetooth Classic SPP (ESP32 Arduino core)
//   No soil moisture library is used; direct analogRead() is sufficient.
//
// WIRING:
//   Sensor VCC  →  3.3 V  (some modules accept 5 V; check your module)
//   Sensor GND  →  GND
//   Sensor AO   →  GPIO 34  (analog output — input-only pin on classic ESP32)
//
//   NOTE: This test sketch uses GPIO 34 as originally written.
//   The full integration (ESP32_Sensor_Hub.ino) uses GPIO 32 for soil moisture.
//   GPIO 32 supports both ADC and digital I/O; GPIO 34 is input-only.
//   Update the pin definition below if needed to match your wiring.
//
// BLUETOOTH DEVICE NAME:
//   "ESP32_SOIL"
//
// DATA FORMAT (plain text, comma-separated, one value per line):
//   SOIL,<raw_adc_value>
//
//   Example output stream over Bluetooth:
//     SOIL,1842
//     SOIL,1856
//     SOIL,1839
//     ...
//
//   NOTE: The integration sketch (ESP32_Sensor_Hub.ino) uses JSON format
//   with 10-sample averaging:
//   {"v":1,"sensor":5,"seq":N,"ts":N,"data":{"raw":1842}}
//
// SAMPLING RATE:
//   1 Hz  (one reading every 1000 ms — controlled by delay(1000))
//   The production integration uses 10 Hz ADC acquisition with 10-sample
//   averaging transmitted at 0.5 Hz via non-blocking millis() scheduling.
//
// USB SERIAL:
//   Baud rate : 115200
//   Every raw ADC value is printed locally.
// =============================================================================

#include "BluetoothSerial.h" // Bluetooth Classic SPP — ESP32 Arduino core

// --------------------------------------------------
// Pin configuration
// --------------------------------------------------

// GPIO connected to the soil moisture sensor analog output (AO pin).
// GPIO 34 is an input-only ADC1 pin on the classic ESP32.
// NOTE: The full integration uses GPIO 32 for soil moisture.
// Change this value to match your wiring.
#define SOIL_MOISTURE_PIN 34

// --------------------------------------------------
// Bluetooth
// --------------------------------------------------

// Single BluetoothSerial instance for Classic SPP.
BluetoothSerial SerialBT;

// Bluetooth device name — visible to remote devices during pairing.
const char *DEVICE_NAME = "ESP32_SOIL";

// --------------------------------------------------
// Soil moisture setup
// --------------------------------------------------

void setupSoilMoisture()
{
    // Configure the sensor analog pin as an input.
    // On input-only GPIO 34, this is implicit, but explicit is cleaner.
    pinMode(SOIL_MOISTURE_PIN, INPUT);

    // Set ADC resolution to 12-bit.
    // Raw values will be in the range 0–4095 across the 0–3.3 V input swing.
    analogReadResolution(12);

    Serial.println("Soil moisture sensor initialized");
}

// --------------------------------------------------
// Read soil moisture sensor
// --------------------------------------------------

// Returns the raw 12-bit ADC reading from the soil moisture sensor output.
// Value range: 0 – 4095.
// Interpretation (higher vs lower = wet vs dry) depends on the sensor module
// type — check your datasheet or measure in known dry/wet conditions.
// No percentage conversion or calibration is applied here.
int readSoilMoisture()
{
    return analogRead(SOIL_MOISTURE_PIN);
}

// --------------------------------------------------
// Send data through Bluetooth
// --------------------------------------------------

// Transmits one raw ADC reading to the Bluetooth client.
// Format: "SOIL,<value>\n"
// Returns immediately if no client is connected.
void sendBluetooth(int moistureValue)
{
    // Guard: do not attempt to send without a connected Bluetooth client.
    if (!SerialBT.hasClient())
    {
        return;
    }

    // CSV plain-text format: label, raw ADC value, newline.
    // Example: "SOIL,1842\n"
    SerialBT.print("SOIL,");
    SerialBT.println(moistureValue);
}

// --------------------------------------------------
// Setup
// --------------------------------------------------

void setup()
{
    // Start USB Serial communication for local monitoring
    Serial.begin(115200);

    // Allow USB serial to settle on the host side
    delay(1000);

    Serial.println();
    Serial.println("================================");
    Serial.println("ESP32 + Soil Moisture Sensor");
    Serial.println("================================");

    // Initialise the soil moisture sensor ADC pin and resolution
    setupSoilMoisture();

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
    // Read one raw ADC sample from the soil moisture sensor.
    // Value is in range 0–4095; no unit conversion is performed.
    int moistureValue = readSoilMoisture();

    // Display the raw ADC value on the USB Serial Monitor.
    // Compare values in dry soil vs moist soil to understand the range.
    Serial.print("Soil moisture ADC: ");
    Serial.println(moistureValue);

    // Send the raw value to the Bluetooth client.
    // If no client is connected, sendBluetooth() returns silently.
    sendBluetooth(moistureValue);

    // Read every 1 second → 1 Hz output rate.
    // The production integration (ESP32_Sensor_Hub.ino) reads at 10 Hz
    // with 10-sample averaging and transmits at 0.5 Hz using millis() gating.
    delay(1000);
}