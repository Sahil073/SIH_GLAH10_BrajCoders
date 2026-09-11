// =============================================================================
// MQ135_Bluetooth.ino
//
// PURPOSE:
//   Tests the MQ135 air quality sensor and streams raw ADC readings to a
//   connected Bluetooth Low Energy (BLE) client.
//
//   Use this sketch to:
//     1. Confirm the MQ135 is correctly wired and powered (5V heater).
//     2. Observe the raw ADC output value on USB Serial Monitor and BLE terminal.
//     3. Validate BLE data flow before integration into the full hub.
//
// SENSOR:
//   MQ135 — Air Quality / Gas Detection Sensor
//   Target gases : CO2, NH3, benzene, alcohol, smoke (multi-gas)
//   Interface    : Analog voltage output (AO pin)
//   ADC output   : 0 – 4095 (12-bit raw; NOT in ppm)
//   Warm-up time : At least 3–5 minutes for approximate readings.
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3 — Arduino framework
//
// LIBRARIES:
//   BLEDevice, BLEServer, BLEUtils, BLE2902 — ESP32 Arduino core (built-in)
//
// WIRING:
//   MQ135 VCC  →  5 V  (the heater element requires 5 V supply)
//   MQ135 GND  →  GND
//   MQ135 AO   →  GPIO 34  (input-only ADC1 pin; note: hub uses GPIO 35)
//
// BLE DEVICE NAME:
//   "ESP32_MQ135_BLE"
//
// GATT PROFILE (Nordic UART Service - NUS):
//   Service UUID : 6E400001-B5A3-F393-E0A9-E50E24DCCA9E
//   TX Char UUID : 6E400003-B5A3-F393-E0A9-E50E24DCCA9E (Notify — ESP32 -> Client)
//   RX Char UUID : 6E400002-B5A3-F393-E0A9-E50E24DCCA9E (Write  — Client -> ESP32)
//
// DATA FORMAT (plain text, comma-separated, one value per line):
//   MQ135,<raw_adc_value>
//
//   Example output stream over BLE:
//     MQ135,842
//     MQ135,856
//
// SAMPLING RATE:
//   2 Hz  (one reading every 500 ms — controlled by delay(500))
//
// USB SERIAL:
//   Baud rate : 115200
// =============================================================================

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// --------------------------------------------------
// Pin configuration
// --------------------------------------------------
#define MQ135_PIN 34 // GPIO 34 (Note: full integration hub uses GPIO 35)

// --------------------------------------------------
// BLE Configuration & Nordic UART UUIDs
// --------------------------------------------------
#define DEVICE_NAME "ESP32_MQ135_BLE"
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

// --------------------------------------------------
// Global Objects & State
// --------------------------------------------------
BLEServer *pServer = nullptr;
BLECharacteristic *pTxCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

class MyServerCallbacks : public BLEServerCallbacks
{
    void onConnect(BLEServer *pServer) override
    {
        deviceConnected = true;
        Serial.println("[BLE] Client connected");
    }

    void onDisconnect(BLEServer *pServer) override
    {
        deviceConnected = false;
        Serial.println("[BLE] Client disconnected");
    }
};

// --------------------------------------------------
// Setup MQ135
// --------------------------------------------------
void setupMQ135()
{
    pinMode(MQ135_PIN, INPUT);
    analogReadResolution(12);
    Serial.println("[MQ135] Initialized on GPIO 34 (12-bit ADC)");
}

// --------------------------------------------------
// Read MQ135
// --------------------------------------------------
int readMQ135()
{
    return analogRead(MQ135_PIN);
}

// --------------------------------------------------
// Setup BLE
// --------------------------------------------------
void setupBLE()
{
    BLEDevice::init(DEVICE_NAME);
    BLEDevice::setMTU(517);

    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(SERVICE_UUID);

    pTxCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID_TX,
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pTxCharacteristic->addDescriptor(new BLE2902());

    BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID_RX,
        BLECharacteristic::PROPERTY_WRITE
    );

    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();

    Serial.printf("[BLE] Advertising started as '%s'\n", DEVICE_NAME);
}

// --------------------------------------------------
// Send Data over BLE
// --------------------------------------------------
void sendBLE(int rawVal)
{
    if (!deviceConnected)
        return;

    String payload = "MQ135," + String(rawVal) + "\n";
    pTxCharacteristic->setValue((uint8_t *)payload.c_str(), payload.length());
    pTxCharacteristic->notify();
}

// --------------------------------------------------
// Setup
// --------------------------------------------------
void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("==============================");
    Serial.println("ESP32 MQ135 BLE Test");
    Serial.println("==============================");

    setupMQ135();
    setupBLE();
}

// --------------------------------------------------
// Loop
// --------------------------------------------------
void loop()
{
    int rawValue = readMQ135();

    Serial.printf("MQ135 raw ADC: %d\n", rawValue);
    sendBLE(rawValue);

    // Auto-restart advertising on client disconnection
    if (!deviceConnected && oldDeviceConnected)
    {
        delay(500);
        pServer->startAdvertising();
        Serial.println("[BLE] Restarted advertising.");
        oldDeviceConnected = deviceConnected;
    }
    if (deviceConnected && !oldDeviceConnected)
    {
        oldDeviceConnected = deviceConnected;
    }

    // 2 Hz sampling rate
    delay(500);
}