#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_ADXL345_U.h>

#include "BluetoothSerial.h"


// ============================================================
// PIN CONFIGURATION
// ============================================================

#define SDA_PIN 21
#define SCL_PIN 22


// ============================================================
// OBJECTS
// ============================================================

Adafruit_ADXL345_Unified adxl = Adafruit_ADXL345_Unified(12345);

BluetoothSerial SerialBT;


// ============================================================
// SETUP ADXL345
// ============================================================

bool setupADXL345()
{
    // Initialize I2C
    Wire.begin(SDA_PIN, SCL_PIN);

    // Initialize ADXL345
    if (!adxl.begin())
    {
        Serial.println("ADXL345 not detected!");

        return false;
    }

    // Set measurement range
    adxl.setRange(ADXL345_RANGE_2_G);

    Serial.println("ADXL345 initialized");

    return true;
}


// ============================================================
// READ ADXL345
// ============================================================

bool readADXL345(float &x,
                 float &y,
                 float &z)
{
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
    SerialBT.begin("ESP32_ADXL345");

    Serial.println("Bluetooth started");
    Serial.println("Device: ESP32_ADXL345");
}


// ============================================================
// SEND DATA OVER BLUETOOTH
// ============================================================

void sendBluetooth(float x,
                   float y,
                   float z)
{
    // Don't send if nobody is connected
    if (!SerialBT.hasClient())
    {
        return;
    }

    SerialBT.print("ADXL345,");
    SerialBT.print(x, 3);
    SerialBT.print(",");
    SerialBT.print(y, 3);
    SerialBT.print(",");
    SerialBT.println(z, 3);
}


// ============================================================
// SETUP
// ============================================================

void setup()
{
    Serial.begin(115200);

    delay(1000);

    Serial.println();
    Serial.println("==============================");
    Serial.println("ESP32 ADXL345 Bluetooth Test");
    Serial.println("==============================");

    // Initialize ADXL345
    if (!setupADXL345())
    {
        Serial.println("ADXL345 initialization failed!");
        return;
    }

    // Initialize Bluetooth
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

    if (readADXL345(x, y, z))
    {
        // Serial Monitor
        Serial.print("X: ");
        Serial.print(x, 3);

        Serial.print("  Y: ");
        Serial.print(y, 3);

        Serial.print("  Z: ");
        Serial.print(z, 3);

        Serial.println(" m/s^2");


        // Bluetooth
        sendBluetooth(x, y, z);
    }

    delay(100);
}