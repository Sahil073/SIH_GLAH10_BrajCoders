// =============================================================================
// Moisture_Bluetooth.ino
//
// PURPOSE:
//   Tests the conductive / capacitive sweat and moisture sensor and streams
//   10-sample averaged raw ADC readings to a connected Bluetooth Low Energy (BLE)
//   client using the EXACT JSON protocol (v1, Sensor ID 5) expected by the
//   Sanjeevni mobile app and identical to ESP32_Sensor_Hub.ino.
//
//   Use this sketch to:
//     1. Confirm the moisture/sweat electrode is correctly wired to GPIO 32.
//     2. Observe how ADC values change between dry and damp/sweat conditions.
//     3. Observe live hydration updates on the Sanjeevni app's Moisture card.
//     4. Validate BLE data flow before full sensor hub integration.
//
// SENSOR:
//   Conductive / capacitive sweat & moisture sensor (embedded in smart garment)
//   Interface : Analog voltage output (AO pin)
//   ADC output: 0 – 4095 (12-bit raw ADC; converted to 0–100% moisture in app)
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3 — Arduino framework
//
// WIRING:
//   Sensor VCC  →  3.3 V
//   Sensor GND  →  GND
//   Sensor AO   →  GPIO 32  (input/output capable ADC1 pin, matching ESP32_Sensor_Hub.ino)
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
//   {"v":1,"sensor":5,"seq":<seq>,"ts":<uptime_ms>,"data":{"raw":<raw_adc>}}\n
//
//   Example packet (as seen in sample_data.txt line 41):
//     {"v":1,"sensor":5,"seq":90,"ts":182752,"data":{"raw":4095}}
//
// SAMPLING & TRANSMISSION:
//   Acquisition rate: 10 Hz (every 100 ms)
//   Averaging window: 10 samples
//   BLE transmission rate: 0.5 Hz (every 2000 ms)
//
// USB SERIAL:
//   Baud rate: 115200 baud
// =============================================================================

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ============================================================
// PIN CONFIGURATION & CONSTANTS
// ============================================================
#define SOIL_MOISTURE_PIN 32 // GPIO 32 (matching ESP32_Sensor_Hub.ino and Sanjeevni PCB)

static const uint32_t SOIL_ACQ_INTERVAL_MS = 100;  // 10 Hz acquisition
static const uint32_t SOIL_TX_INTERVAL_MS  = 2000; // 0.5 Hz BLE transmission
static const uint8_t  SOIL_AVG_SAMPLES     = 10;   // 10-sample averaging window

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
BLEServer *pServer = nullptr;
BLECharacteristic *pTxCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

uint32_t soilSequence = 0;
uint32_t soilLastAcqMs = 0;
uint32_t soilLastTxMs = 0;
uint32_t soilAccumRaw = 0;
uint8_t  soilSampleCnt = 0;
uint32_t soilAvgRaw = 0;

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
// SETUP SOIL MOISTURE
// ============================================================
void setupSoilMoisture()
{
    analogSetPinAttenuation(SOIL_MOISTURE_PIN, ADC_11db); // 0–3.3 V full range
    pinMode(SOIL_MOISTURE_PIN, INPUT);
    soilLastAcqMs = millis();
    soilLastTxMs = millis();
    Serial.println("[SOIL] Initialized on GPIO 32 (10 Hz acq / 0.5 Hz BLE)");
}

// ============================================================
// READ & AVERAGE SOIL MOISTURE (10 Hz acq, averages 10 samples)
// Returns true ONLY when an averaged reading is ready
// ============================================================
bool readSoilMoisture()
{
    uint32_t now = millis();
    if ((now - soilLastAcqMs) < SOIL_ACQ_INTERVAL_MS)
        return false;
    soilLastAcqMs = now;

    soilAccumRaw += (uint32_t)analogRead(SOIL_MOISTURE_PIN);
    soilSampleCnt++;

    if (soilSampleCnt >= SOIL_AVG_SAMPLES)
    {
        soilAvgRaw = soilAccumRaw / (uint32_t)SOIL_AVG_SAMPLES;
        soilAccumRaw = 0;
        soilSampleCnt = 0;
        return true;
    }
    return false;
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
// SEND SOIL MOISTURE PACKET (Matching ESP32_Sensor_Hub.ino)
// Protocol: {"v":1,"sensor":5,"seq":<seq>,"ts":<ms>,"data":{"raw":<raw>}}\n
// ============================================================
void sendSoilMoisturePacket()
{
    uint32_t now = millis();
    if ((now - soilLastTxMs) < SOIL_TX_INTERVAL_MS)
        return;
    soilLastTxMs = now;

    char payload[160];
    snprintf(payload, sizeof(payload),
             "{\"v\":1,\"sensor\":5,\"seq\":%lu,\"ts\":%lu,\"data\":{\"raw\":%lu}}\n",
             (unsigned long)soilSequence++,
             (unsigned long)now,
             (unsigned long)soilAvgRaw);

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
    Serial.println("==================================================");
    Serial.println("  Sanjeevni ESP32 Moisture BLE Component Test     ");
    Serial.println("  Protocol v1 (Sensor ID 5) — 0.5 Hz JSON Stream  ");
    Serial.println("==================================================");

    setupSoilMoisture();
    setupBLE();
}

// ============================================================
// LOOP
// ============================================================
void loop()
{
    if (readSoilMoisture())
    {
        sendSoilMoisturePacket();
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

    delay(5);
}