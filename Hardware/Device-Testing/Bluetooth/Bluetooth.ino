#include "BluetoothSerial.h"

// --------------------------------------------------
// Bluetooth object
// --------------------------------------------------
BluetoothSerial SerialBT;

// --------------------------------------------------
// Bluetooth device name
// --------------------------------------------------
const char* DEVICE_NAME = "ESP32_TEST";

// --------------------------------------------------
// Setup
// --------------------------------------------------
void setup()
{
    // Start USB Serial communication
    Serial.begin(115200);

    // Start Bluetooth Classic
    SerialBT.begin(DEVICE_NAME);

    Serial.println();
    Serial.println("================================");
    Serial.println("ESP32 Bluetooth Test");
    Serial.println("================================");
    Serial.print("Device name: ");
    Serial.println(DEVICE_NAME);
    Serial.println("Waiting for Bluetooth connection...");
}

// --------------------------------------------------
// Main loop
// --------------------------------------------------
void loop()
{
    static unsigned long counter = 0;

    // Check whether a Bluetooth device is connected
    if (SerialBT.hasClient())
    {
        // Send data through Bluetooth
        SerialBT.print("TEST DATA: ");
        SerialBT.println(counter);

        // Also display the transmitted data
        // on the USB Serial Monitor
        Serial.print("Bluetooth -> ");
        Serial.println(counter);

        counter++;
    }
    else
    {
        // No Bluetooth client connected
        Serial.println("Waiting for Bluetooth connection...");
    }

    // Send one value every second
    delay(1000);
}