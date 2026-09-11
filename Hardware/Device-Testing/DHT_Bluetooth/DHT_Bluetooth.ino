// =============================================================================
// DHT_Bluetooth.ino
//
// PURPOSE:
//   Tests the DHT11 temperature and humidity sensor and streams readings
//   to a connected Bluetooth Low Energy (BLE) client.
//
//   Use this sketch to:
//     1. Confirm the DHT11 is correctly wired to GPIO 4.
//     2. Verify the Adafruit DHT library reads valid temperature/humidity.
//     3. Observe live values on USB Serial Monitor and BLE terminal app.
//     4. Validate the 2-second read cycle (DHT11 minimum sample interval).
//
// SENSOR:
//   DHT11 — Digital Temperature and Humidity Sensor
//   Interface      : Single-wire digital (proprietary DHT protocol)
//   Temperature    : 0 – 50 °C  ± 2 °C  resolution 1 °C
//   Humidity       : 20 – 80 % RH  ± 5 % RH  resolution 1 %
//   Minimum interval : 1–2 seconds between readings
//   Library        : DHT.h (Adafruit DHT sensor library)
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3 — Arduino framework
//
// LIBRARIES:
//   DHT.h           — Adafruit DHT sensor library
//   BLEDevice, BLEServer, BLEUtils, BLE2902 — ESP32 Arduino core (built-in)
//
// WIRING:
//   DHT11 VCC   →  3.3 V  (or 5 V if module has regulator)
//   DHT11 DATA  →  GPIO 4
//   DHT11 GND   →  GND
//   Add 10 kΩ pull-up resistor between DATA and VCC if using a bare sensor.
//
// BLE DEVICE NAME:
//   "ESP32_DHT11_BLE"
//
// GATT PROFILE (Nordic UART Service - NUS):
//   Service UUID : 6E400001-B5A3-F393-E0A9-E50E24DCCA9E
//   TX Char UUID : 6E400003-B5A3-F393-E0A9-E50E24DCCA9E (Notify — ESP32 -> Client)
//   RX Char UUID : 6E400002-B5A3-F393-E0A9-E50E24DCCA9E (Write  — Client -> ESP32)
//
// DATA FORMAT (plain text, one reading per line):
//   Temperature: <value> C, Humidity: <value> %
//
//   Example output stream over BLE:
//     Temperature: 28.00 C, Humidity: 64.00 %
//     Temperature: 28.00 C, Humidity: 65.00 %
//
// SAMPLING RATE:
//   0.5 Hz  (one reading every 2 seconds — set by delay(2000))
//
// USB SERIAL:
//   Baud rate : 115200
// =============================================================================

#include <Arduino.h>
#include <DHT.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// -------------------------
// Pin configuration
// -------------------------
#define DHT_PIN 4
#define DHT_TYPE DHT11

// -------------------------
// BLE Configuration
// -------------------------
#define DEVICE_NAME "ESP32_DHT11_BLE"
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

// -------------------------
// Global Objects & State
// -------------------------
DHT dht(DHT_PIN, DHT_TYPE);

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

// -------------------------
// Setup DHT11
// -------------------------
void setupDHT()
{
    dht.begin();
    Serial.println("[DHT11] Sensor initialized on GPIO 4");
}

// -------------------------
// Read DHT11
// -------------------------
bool readDHT(float &temperature, float &humidity)
{
    humidity = dht.readHumidity();
    temperature = dht.readTemperature();

    if (isnan(temperature) || isnan(humidity))
    {
        Serial.println("[DHT11] ERROR — read failed (NaN)!");
        return false;
    }
    return true;
}

// -------------------------
// Setup BLE
// -------------------------
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

// -------------------------
// Send Data over BLE
// -------------------------
void sendBLE(float temperature, float humidity)
{
    if (!deviceConnected)
        return;

    String payload = "Temperature: " + String(temperature, 1) + " C, Humidity: " + String(humidity, 1) + " %\n";
    pTxCharacteristic->setValue((uint8_t *)payload.c_str(), payload.length());
    pTxCharacteristic->notify();
}

// -------------------------
// Setup
// -------------------------
void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("==============================");
    Serial.println("ESP32 DHT11 BLE Test");
    Serial.println("==============================");

    setupDHT();
    setupBLE();
}

// -------------------------
// Main loop
// -------------------------
void loop()
{
    float temperature = 0.0f;
    float humidity = 0.0f;

    if (readDHT(temperature, humidity))
    {
        Serial.printf("Temperature: %.1f C, Humidity: %.1f %%\n", temperature, humidity);
        sendBLE(temperature, humidity);
    }

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

    // 2-second measurement interval
    delay(2000);
}