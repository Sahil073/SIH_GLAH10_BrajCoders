// =============================================================================
// DHT_Bluetooth.ino
//
// PURPOSE:
//   Tests the DHT11 digital temperature and humidity sensor and streams
//   readings to a connected Bluetooth Low Energy (BLE) client using the EXACT
//   JSON protocol (v1, Sensor ID 3) expected by the Sanjeevni mobile app
//   and identical to ESP32_Sensor_Hub.ino.
//
//   Use this sketch to:
//     1. Confirm the DHT11 is correctly wired to GPIO 4 with pull-up.
//     2. Verify the Adafruit DHT library reads valid temperature/humidity.
//     3. Observe live values on the Sanjeevni app's Temperature & Heat Index cards.
//     4. Validate the 2-second acquisition cycle without blocking.
//
// SENSOR:
//   DHT11 — Digital Temperature and Humidity Sensor
//   Interface      : Single-wire digital (proprietary DHT protocol)
//   Temperature    : 0 – 50 °C  ± 2 °C
//   Humidity       : 20 – 80 % RH  ± 5 % RH
//   Minimum interval : 2 seconds between readings
//   Library        : DHT.h (Adafruit DHT sensor library)
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3 — Arduino framework
//
// WIRING:
//   DHT11 VCC   →  3.3 V  (or 5 V if module contains onboard regulator)
//   DHT11 DATA  →  GPIO 4  (with 10 kΩ pull-up to 3.3 V if bare sensor)
//   DHT11 GND   →  GND
//
// BLE DEVICE NAME:
//   "ESP32_SENSOR_HUB_BLE" (recognized immediately by Sanjeevni mobile app)
//
// GATT PROFILE (Nordic UART Service - NUS):
//   Service UUID : 6E400001-B5A3-F393-E0A9-E50E24DCCA9E
//   TX Char UUID : 6E400003-B5A3-F393-E0A9-E50E24DCCA9E (Notify — ESP32 -> Client)
//   RX Char UUID : 6E400002-B5A3-F393-E0A9-E50E24DCCA9E (Write  — Client -> ESP32)
//
// PROTOCOL SPECIFICATION (Protocol v1 JSON, newline-delimited):
//   {"v":1,"sensor":3,"seq":<seq>,"ts":<uptime_ms>,"data":{"temperature":<t>,"humidity":<h>}}\n
//
//   Example packet (as seen in sample_data.txt line 39):
//     {"v":1,"sensor":3,"seq":90,"ts":182749,"data":{"temperature":24.8,"humidity":47.7}}
//
// SAMPLING & TRANSMISSION:
//   Rate: 0.5 Hz (every 2000 ms, strictly abiding by DHT11 hardware response time)
//
// USB SERIAL:
//   Baud rate: 115200 baud
// =============================================================================

#include <Arduino.h>
#include <DHT.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ============================================================
// PIN CONFIGURATION & TIMING
// ============================================================
#define DHT_PIN 4
#define DHT_TYPE DHT11

static const uint32_t DHT_INTERVAL_MS = 2000; // 0.5 Hz

// ============================================================
// BLE CONFIGURATION & NORDIC UART UUIDs
// ============================================================
#define DEVICE_NAME "ESP32_SENSOR_HUB_BLE"
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

// ============================================================
// GLOBAL OBJECTS & STATE
// ============================================================
DHT dht(DHT_PIN, DHT_TYPE);

BLEServer *pServer = nullptr;
BLECharacteristic *pTxCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

uint32_t dhtSequence = 0;
uint32_t dhtLastMs = 0;

class MyServerCallbacks : public BLEServerCallbacks
{
    void onConnect(BLEServer *pServer) override
    {
        deviceConnected = true;
        Serial.println("[BLE] Mobile client connected!");
    }

    void onDisconnect(BLEServer *pServer) override
    {
        deviceConnected = false;
        Serial.println("[BLE] Mobile client disconnected!");
    }
};

// ============================================================
// SETUP DHT
// ============================================================
void setupDHT()
{
    dht.begin();
    dhtLastMs = millis();
    Serial.println("[DHT11] Initialized on GPIO 4 (0.5 Hz read interval)");
}

// ============================================================
// READ DHT (Non-blocking 2000 ms interval)
// ============================================================
bool readDHT(float &temperature, float &humidity)
{
    uint32_t now = millis();
    if ((now - dhtLastMs) < DHT_INTERVAL_MS)
        return false;
    dhtLastMs = now;

    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (isnan(t) || isnan(h))
    {
        Serial.println("[DHT11] WARNING: Read returned NaN. Check wiring / pull-up.");
        return false;
    }

    temperature = t;
    humidity = h;
    return true;
}

// ============================================================
// SETUP BLE
// ============================================================
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

    Serial.printf("[BLE] GATT Server advertising as '%s'\n", DEVICE_NAME);
}

// ============================================================
// SEND DHT PACKET (Matching ESP32_Sensor_Hub.ino)
// Protocol: {"v":1,"sensor":3,"seq":<seq>,"ts":<ms>,"data":{"temperature":<t>,"humidity":<h>}}\n
// ============================================================
void sendDHTPacket(float temperature, float humidity)
{
    char payload[192];
    snprintf(payload, sizeof(payload),
             "{\"v\":1,\"sensor\":3,\"seq\":%lu,\"ts\":%lu,\"data\":{\"temperature\":%.1f,\"humidity\":%.1f}}\n",
             (unsigned long)dhtSequence++,
             (unsigned long)millis(),
             roundf(temperature * 10.0f) / 10.0f,
             roundf(humidity * 10.0f) / 10.0f);

    if (deviceConnected)
    {
        pTxCharacteristic->setValue((uint8_t *)payload, strlen(payload));
        pTxCharacteristic->notify();
    }

    // Local serial display
    Serial.print(payload);
}

// ============================================================
// SETUP
// ============================================================
void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("================================================");
    Serial.println("  Sanjeevni ESP32 DHT11 BLE Component Test      ");
    Serial.println("  Protocol v1 (Sensor ID 3) — 0.5 Hz JSON Stream");
    Serial.println("================================================");

    setupDHT();
    setupBLE();
}

// ============================================================
// LOOP
// ============================================================
void loop()
{
    float temp = 0.0f, hum = 0.0f;

    if (readDHT(temp, hum))
    {
        sendDHTPacket(temp, hum);
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

    delay(20);
}