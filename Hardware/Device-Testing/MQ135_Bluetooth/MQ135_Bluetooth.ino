#include "BluetoothSerial.h"

// --------------------------------------------------
// Pin configuration
// --------------------------------------------------

#define MQ135_PIN 34

// --------------------------------------------------
// Bluetooth
// --------------------------------------------------

BluetoothSerial SerialBT;

// --------------------------------------------------
// Bluetooth device name
// --------------------------------------------------

const char* DEVICE_NAME = "ESP32_MQ135";

// --------------------------------------------------
// MQ135 setup
// --------------------------------------------------

void setupMQ135()
{
    // Configure MQ135 analog input
    pinMode(MQ135_PIN, INPUT);

    // ESP32 ADC resolution
    // 12-bit = values from 0 to 4095
    analogReadResolution(12);

    Serial.println("MQ135 initialized");
}

// --------------------------------------------------
// Read MQ135
// --------------------------------------------------

int readMQ135()
{
    return analogRead(MQ135_PIN);
}

// --------------------------------------------------
// Send MQ135 data through Bluetooth
// --------------------------------------------------

void sendBluetooth(int mq135Value)
{
    // Do nothing if no Bluetooth device is connected
    if (!SerialBT.hasClient())
    {
        return;
    }

    SerialBT.print("MQ135,");
    SerialBT.println(mq135Value);
}

// --------------------------------------------------
// Setup
// --------------------------------------------------

void setup()
{
    // USB Serial Monitor
    Serial.begin(115200);

    delay(1000);

    Serial.println();
    Serial.println("================================");
    Serial.println("ESP32 + MQ135 + Bluetooth");
    Serial.println("================================");

    // Initialize MQ135
    setupMQ135();

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
    // Read MQ135 analog value
    int mq135Value = readMQ135();

    // Display value on Serial Monitor
    Serial.print("MQ135: ");
    Serial.println(mq135Value);

    // Send value through Bluetooth
    sendBluetooth(mq135Value);

    // Read approximately once every 500 ms
    delay(500);
}