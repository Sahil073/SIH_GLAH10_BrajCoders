#include "BluetoothSerial.h"

// ============================================================
// CONFIGURATION
// ============================================================

#define EXG_PIN 34

// ============================================================
// BLUETOOTH
// ============================================================

BluetoothSerial SerialBT;


// ============================================================
// SETUP EXG
// ============================================================

void setupEXG()
{
    pinMode(EXG_PIN, INPUT);

    // ESP32 ADC resolution
    analogReadResolution(12);

    Serial.println("EXG Pill initialized");
}


// ============================================================
// READ EXG
// ============================================================

int readEXG()
{
    return analogRead(EXG_PIN);
}


// ============================================================
// SEND EXG DATA OVER BLUETOOTH
// ============================================================

void sendBluetooth(int exgValue)
{
    // Don't send anything if no device is connected
    if (!SerialBT.hasClient())
    {
        return;
    }

    SerialBT.print("EXG,");
    SerialBT.println(exgValue);
}


// ============================================================
// SETUP BLUETOOTH
// ============================================================

void setupBluetooth()
{
    SerialBT.begin("ESP32_EXG");

    Serial.println("Bluetooth started");
    Serial.println("Device name: ESP32_EXG");
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
    Serial.println("ESP32 BioAmp EXG Test");
    Serial.println("==============================");

    setupEXG();

    setupBluetooth();
}


// ============================================================
// LOOP
// ============================================================

void loop()
{
    int exgValue = readEXG();

    // Print to Serial Monitor
    Serial.print("EXG: ");
    Serial.println(exgValue);

    // Send over Bluetooth
    sendBluetooth(exgValue);

    delay(10);
}