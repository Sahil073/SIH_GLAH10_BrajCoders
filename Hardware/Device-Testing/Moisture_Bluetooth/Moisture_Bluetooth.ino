#include "BluetoothSerial.h"

// --------------------------------------------------
// Pin configuration
// --------------------------------------------------

#define SOIL_MOISTURE_PIN 34

// --------------------------------------------------
// Bluetooth
// --------------------------------------------------

BluetoothSerial SerialBT;

// Bluetooth device name
const char* DEVICE_NAME = "ESP32_SOIL";

// --------------------------------------------------
// Soil moisture setup
// --------------------------------------------------

void setupSoilMoisture()
{
    // Configure sensor pin as an input
    pinMode(SOIL_MOISTURE_PIN, INPUT);

    // Use 12-bit ADC resolution
    // Range: 0 - 4095
    analogReadResolution(12);

    Serial.println("Soil moisture sensor initialized");
}

// --------------------------------------------------
// Read soil moisture sensor
// --------------------------------------------------

int readSoilMoisture()
{
    return analogRead(SOIL_MOISTURE_PIN);
}

// --------------------------------------------------
// Send data through Bluetooth
// --------------------------------------------------

void sendBluetooth(int moistureValue)
{
    // Do not send anything if no Bluetooth
    // device is connected
    if (!SerialBT.hasClient())
    {
        return;
    }

    SerialBT.print("SOIL,");
    SerialBT.println(moistureValue);
}

// --------------------------------------------------
// Setup
// --------------------------------------------------

void setup()
{
    // Start USB Serial communication
    Serial.begin(115200);

    delay(1000);

    Serial.println();
    Serial.println("================================");
    Serial.println("ESP32 + Soil Moisture Sensor");
    Serial.println("================================");

    // Initialize soil moisture sensor
    setupSoilMoisture();

    // Start Bluetooth
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
    // Read sensor
    int moistureValue = readSoilMoisture();

    // Display value on Serial Monitor
    Serial.print("Soil moisture ADC: ");
    Serial.println(moistureValue);

    // Send value through Bluetooth
    sendBluetooth(moistureValue);

    // Read every 1 second
    delay(1000);
}