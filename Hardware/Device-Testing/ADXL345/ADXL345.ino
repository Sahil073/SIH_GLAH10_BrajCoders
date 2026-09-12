// =============================================================================
// ADXL345.ino — Standalone Sensor Diagnostic Test (WITHOUT BLE)
//
// PURPOSE:
//   Direct USB serial diagnostic test for the ADXL345 3-axis accelerometer.
//   Verifies I2C communication, registers, and acceleration output without
//   involving Bluetooth or network stacks.
//
//   Use this sketch to:
//     1. Confirm I2C wiring (SDA=21, SCL=22) and verify sensor ACK.
//     2. Check static gravity baseline: vector magnitude should equal ~9.8 m/s² (1G).
//     3. Test dynamic motion response by shaking, tilting, and rotating the sensor.
//     4. View live X, Y, Z curves in the Arduino Serial Plotter.
//
// SENSOR:
//   ADXL345 — 3-axis digital accelerometer (Analog Devices)
//   Interface  : I2C (default address 0x53)
//   Range      : ±2G (resolution: 3.9 mg/LSB = 0.038 m/s²/LSB)
//   Library    : Adafruit_ADXL345_U (requires Adafruit_Sensor)
//
// BOARD:
//   Classic ESP32 (DevKit V1 / WROOM-32), ESP32-S3, ESP32-C3 — Arduino framework
//
// WIRING:
//   ADXL345 VCC  →  3.3 V
//   ADXL345 GND  →  GND
//   ADXL345 SDA  →  GPIO 21 (internal/external 4.7kΩ pull-up)
//   ADXL345 SCL  →  GPIO 22 (internal/external 4.7kΩ pull-up)
//   ADXL345 SDO  →  GND  (sets I2C address to 0x53)
//   ADXL345 CS   →  3.3 V (selects I2C mode, disables SPI)
//
// SERIAL MONITOR / PLOTTER:
//   Baud rate: 115200 baud
//   Format: "X:%.2f Y:%.2f Z:%.2f Mag:%.2f" for Serial Monitor
//           or comma-delimited for Arduino Serial Plotter
// =============================================================================

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_ADXL345_U.h>

#define SDA_PIN 21
#define SCL_PIN 22

Adafruit_ADXL345_Unified adxl = Adafruit_ADXL345_Unified(12345);

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("==================================================");
    Serial.println("   ADXL345 3-Axis Accelerometer Diagnostic Test   ");
    Serial.println("   (Standalone USB Serial — No BLE Required)      ");
    Serial.println("==================================================");

    Wire.begin(SDA_PIN, SCL_PIN);

    // Probe sensor address
    if (!adxl.begin())
    {
        Serial.println("[ERROR] ADXL345 not detected on I2C bus!");
        Serial.println("Troubleshooting tips:");
        Serial.println("  1. Check VCC (3.3V) and GND connections.");
        Serial.println("  2. Verify SDA is on GPIO 21 and SCL is on GPIO 22.");
        Serial.println("  3. Ensure SDO is tied to GND (address 0x53) and CS to 3.3V.");
        Serial.println("System halted.");
        while (1) { delay(1000); }
    }

    // Set measurement range to ±2G (highest sensitivity for human posture/motion)
    adxl.setRange(ADXL345_RANGE_2_G);
    Serial.println("[SUCCESS] ADXL345 detected and configured at ±2G range.");
    Serial.println("Orientation reference:");
    Serial.println("  - Flat on table facing up: Z ~ +9.8 m/s², X ~ 0, Y ~ 0");
    Serial.println("  - Flat on table facing down: Z ~ -9.8 m/s², X ~ 0, Y ~ 0");
    Serial.println("Starting continuous data acquisition at ~50 Hz...\n");
}

void loop()
{
    sensors_event_t event;
    adxl.getEvent(&event);

    float x = event.acceleration.x;
    float y = event.acceleration.y;
    float z = event.acceleration.z;

    // Vector magnitude |a| = sqrt(x^2 + y^2 + z^2)
    float magnitude = sqrtf(x * x + y * y + z * z);

    // Format for both Serial Monitor and Serial Plotter
    Serial.printf("X:%6.2f  Y:%6.2f  Z:%6.2f  |Magnitude|:%6.2f m/s^2", x, y, z, magnitude);

    // Quick posture evaluation
    if (magnitude > 18.0f) {
        Serial.print("  --> [VIGOROUS / IMPACT]");
    } else if (magnitude < 3.0f) {
        Serial.print("  --> [FREEFALL CANDIDATE]");
    } else if (abs(magnitude - 9.81f) < 1.0f) {
        Serial.print("  --> [STATIC 1G REST]");
    }
    Serial.println();

    // ~50 Hz loop interval
    delay(20);
}
