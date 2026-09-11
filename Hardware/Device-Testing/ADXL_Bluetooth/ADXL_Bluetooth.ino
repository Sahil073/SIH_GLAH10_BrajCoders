// =============================================================================
// ADXL_Bluetooth.ino
//
// PURPOSE:
//   Tests the ADXL345 3-axis accelerometer over I2C and streams live
//   acceleration data to a connected Bluetooth Classic client.
//
//   Use this sketch to:
//     1. Confirm the ADXL345 is correctly wired to I2C (SDA=21, SCL=22).
//     2. Verify that the Adafruit ADXL345 library initialises the sensor.
//     3. Observe X / Y / Z acceleration values in real time on the USB
//        Serial Monitor and via Bluetooth terminal.
//     4. Validate sensor readings before integration into the full hub.
//
// SENSOR:
//   ADXL345 — 3-axis digital accelerometer (Analog Devices)
//   Interface  : I2C (default address 0x53; 0x1D if SDO pulled HIGH)
//   Range      : ±2G (configured here; options: ±2G, ±4G, ±8G, ±16G)
//   Output     : Acceleration in m/s² via Adafruit unified sensor API
//   Library    : Adafruit_ADXL345_U (requires Adafruit_Sensor)
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1) — Arduino framework
//
// LIBRARIES:
//   Wire              — I2C driver (ESP32 Arduino core)
//   Adafruit_Sensor   — Unified sensor abstraction layer
//   Adafruit_ADXL345_U — ADXL345 driver
//   BluetoothSerial   — Bluetooth Classic SPP (ESP32 Arduino core)
//
// WIRING:
//   ADXL345 VCC  →  3.3 V
//   ADXL345 GND  →  GND
//   ADXL345 SDA  →  GPIO 21
//   ADXL345 SCL  →  GPIO 22
//   ADXL345 SDO  →  GND  (sets I2C address to 0x53)
//   ADXL345 CS   →  3.3 V (selects I2C mode)
//
// BLUETOOTH DEVICE NAME:
//   "ESP32_ADXL345"
//
// DATA FORMAT (plain text, comma-separated, one reading per line):
//   ADXL345,<x>,<y>,<z>
//
//   Where x, y, z are floating-point acceleration values in m/s²,
//   printed to 3 decimal places.
//
//   Example output stream over Bluetooth:
//     ADXL345,0.234,-0.156,9.812
//     ADXL345,0.230,-0.160,9.808
//     ...
//
//   NOTE: The integration sketch (ESP32_Sensor_Hub.ino) uses JSON format:
//   {"v":1,"sensor":2,"seq":N,"ts":N,"data":{"x":0.23,"y":-0.16,"z":9.81}}
//
// SAMPLING RATE:
//   ~10 Hz  (one reading per 100 ms delay)
//   The production integration acquires at 100 Hz and transmits at 25 Hz
//   using millis()-based non-blocking scheduling.
//
// USB SERIAL:
//   Baud rate : 115200
//   Mirrors all accelerometer readings for local monitoring.
//
// ERROR HANDLING:
//   If the ADXL345 is not detected on I2C at startup, setup() prints an
//   error and returns without entering the main loop. The board will not
//   crash — it simply stops here, allowing the developer to re-check wiring.
// =============================================================================

#include <Wire.h>               // I2C driver — ESP32 Arduino core
#include <Adafruit_Sensor.h>    // Adafruit unified sensor abstraction
#include <Adafruit_ADXL345_U.h> // ADXL345 driver

#include "BluetoothSerial.h" // Bluetooth Classic SPP — ESP32 Arduino core

// ============================================================
// PIN CONFIGURATION
// ============================================================

// I2C bus pins.
// The classic ESP32 I2C peripheral can be remapped to any GPIO pair.
// SDA=21, SCL=22 are the conventional defaults for the DevKit V1.
#define SDA_PIN 21
#define SCL_PIN 22

// ============================================================
// OBJECTS
// ============================================================

// ADXL345 sensor object.
// The argument (12345) is a unique sensor ID used by the Adafruit unified
// sensor framework — arbitrary value, does not affect hardware communication.
Adafruit_ADXL345_Unified adxl = Adafruit_ADXL345_Unified(12345);

// Bluetooth Classic SPP object.
// Provides a virtual serial port over Bluetooth.
BluetoothSerial SerialBT;

// ============================================================
// SETUP ADXL345
// ============================================================

// Initialises the I2C bus and the ADXL345.
// Returns true on success, false if the sensor is not detected.
bool setupADXL345()
{
    // Initialise I2C with custom SDA/SCL pin mapping.
    // Wire.begin() must be called before adxl.begin().
    Wire.begin(SDA_PIN, SCL_PIN);

    // Attempt to communicate with the ADXL345 over I2C.
    // adxl.begin() returns false if the sensor does not respond —
    // typically indicating a wiring error or wrong I2C address.
    if (!adxl.begin())
    {
        Serial.println("ADXL345 not detected!");
        return false;
    }

    // Set the measurement range to ±2G.
    // Smaller range = higher resolution per LSB.
    // Options: ADXL345_RANGE_2_G, _4_G, _8_G, _16_G
    adxl.setRange(ADXL345_RANGE_2_G);

    Serial.println("ADXL345 initialized");
    return true;
}

// ============================================================
// READ ADXL345
// ============================================================

// Reads the latest acceleration event from the ADXL345.
// x, y, z are set to acceleration in m/s² (from the Adafruit sensor event).
// Always returns true — no failure path in this test version.
bool readADXL345(float &x,
                 float &y,
                 float &z)
{
    // sensors_event_t is the Adafruit unified sensor data container.
    // getEvent() populates event.acceleration.{x,y,z} in m/s².
    sensors_event_t event;
    adxl.getEvent(&event);

    x = event.acceleration.x;
    y = event.acceleration.y;
    z = event.acceleration.z;

    return true;
}

// ============================================================
// SETUP BLUETOOTH
// ============================================================

void setupBluetooth()
{
    // Advertise the device with a descriptive name.
    // Connect to this name from a phone or PC Bluetooth terminal.
    SerialBT.begin("ESP32_ADXL345");

    Serial.println("Bluetooth started");
    Serial.println("Device: ESP32_ADXL345");
}

// ============================================================
// SEND DATA OVER BLUETOOTH
// ============================================================

// Transmits one accelerometer reading to the Bluetooth client.
// Format: "ADXL345,<x>,<y>,<z>\n"
// x, y, z printed to 3 decimal places (in m/s²).
void sendBluetooth(float x,
                   float y,
                   float z)
{
    // Do not transmit if no Bluetooth device is currently connected.
    if (!SerialBT.hasClient())
    {
        return;
    }

    // CSV-style plain text:  ADXL345,<x>,<y>,<z>
    // Example: ADXL345,0.234,-0.156,9.812
    SerialBT.print("ADXL345,");
    SerialBT.print(x, 3); // 3 decimal places → 0.001 m/s² resolution
    SerialBT.print(",");
    SerialBT.print(y, 3);
    SerialBT.print(",");
    SerialBT.println(z, 3); // println appends '\n' as packet delimiter
}

// ============================================================
// SETUP
// ============================================================

void setup()
{
    Serial.begin(115200);

    // Short delay to allow the USB serial interface to become ready
    // on the host computer before the first Serial.print() calls.
    delay(1000);

    Serial.println();
    Serial.println("==============================");
    Serial.println("ESP32 ADXL345 Bluetooth Test");
    Serial.println("==============================");

    // Initialise ADXL345 over I2C.
    // If the sensor is not found, print an error and halt here —
    // do not proceed to Bluetooth or the main loop.
    if (!setupADXL345())
    {
        Serial.println("ADXL345 initialization failed!");
        return; // Halts setup(); loop() will still run but readADXL345() won't be called
    }

    // Start Bluetooth Classic SPP
    setupBluetooth();
}

// ============================================================
// LOOP
// ============================================================

void loop()
{
    float x;
    float y;
    float z;

    // Read the current acceleration from the ADXL345
    if (readADXL345(x, y, z))
    {
        // Print to USB Serial Monitor for local inspection.
        // Format: "X: <x>  Y: <y>  Z: <z> m/s^2"
        Serial.print("X: ");
        Serial.print(x, 3);

        Serial.print("  Y: ");
        Serial.print(y, 3);

        Serial.print("  Z: ");
        Serial.print(z, 3);

        Serial.println(" m/s^2");

        // Send the same reading over Bluetooth.
        // If no client is connected, sendBluetooth() returns immediately.
        sendBluetooth(x, y, z);
    }

    // 100 ms delay → ~10 Hz acquisition and transmission rate.
    // The production integration (ESP32_Sensor_Hub.ino) uses non-blocking
    // millis()-based scheduling for 100 Hz acquisition and 25 Hz transmission.
    delay(100);
}