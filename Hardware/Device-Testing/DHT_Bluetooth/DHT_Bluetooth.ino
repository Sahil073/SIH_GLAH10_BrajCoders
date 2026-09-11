#include <DHT.h>
#include "BluetoothSerial.h"

// -------------------------
// Pin configuration
// -------------------------

#define DHT_PIN   4
#define DHT_TYPE  DHT11

// -------------------------
// Objects
// -------------------------

DHT dht(DHT_PIN, DHT_TYPE);

BluetoothSerial SerialBT;


// -------------------------
// Setup DHT11
// -------------------------

void setupDHT()
{
    dht.begin();

    Serial.println("DHT11 initialized");
}


// -------------------------
// Read DHT11
// -------------------------

bool readDHT(float &temperature, float &humidity)
{
    humidity = dht.readHumidity();
    temperature = dht.readTemperature();

    // Check if reading failed
    if (isnan(temperature) || isnan(humidity))
    {
        Serial.println("DHT11 read failed!");

        return false;
    }

    return true;
}


// -------------------------
// Setup Bluetooth
// -------------------------

void setupBluetooth()
{
    SerialBT.begin("ESP32_DHT11");

    Serial.println("Bluetooth started");
    Serial.println("Device: ESP32_DHT11");
}


// -------------------------
// Send data over Bluetooth
// -------------------------

void sendBluetooth(float temperature,
                   float humidity)
{
    if (!SerialBT.hasClient())
    {
        return;
    }

    SerialBT.print("Temperature: ");
    SerialBT.print(temperature);
    SerialBT.print(" C, Humidity: ");
    SerialBT.print(humidity);
    SerialBT.println(" %");
}


// -------------------------
// Setup
// -------------------------

void setup()
{
    Serial.begin(115200);

    delay(1000);

    Serial.println();
    Serial.println("ESP32 DHT11 Bluetooth Test");

    setupDHT();
    setupBluetooth();
}


// -------------------------
// Main loop
// -------------------------

void loop()
{
    float temperature;
    float humidity;

    if (readDHT(temperature, humidity))
    {
        // Serial Monitor
        Serial.print("Temperature: ");
        Serial.print(temperature);
        Serial.print(" C, Humidity: ");
        Serial.print(humidity);
        Serial.println(" %");

        // Bluetooth
        sendBluetooth(temperature, humidity);
    }

    // DHT11 should not be read too quickly
    delay(2000);
}