// =============================================================================
// MQ135_Bluetooth.ino
//
// PURPOSE:
//   Tests the MQ135 hazardous gas / air quality sensor and streams 10-sample
//   averaged raw ADC readings to a connected Bluetooth Low Energy (BLE) client
//   using the EXACT JSON protocol (v1, Sensor ID 4) expected by the Sanjeevni
//   mobile app and identical to ESP32_Sensor_Hub.ino.
//
//   Use this sketch to:
//     1. Confirm the MQ135 is correctly wired and powered (5V heater).
//     2. Validate the 10-sample 10 Hz moving-average filter.
//     3. Observe live readings on the Sanjeevni app's AQI / Respiratory card.
//     4. Verify BLE transmission before full integration into the sensor hub.
//
// SENSOR:
//   MQ135 — Air Quality / Gas Detection Sensor
//   Target gases : CO2, NH3, benzene, alcohol, smoke (multi-gas)
//   Interface    : Analog voltage output (AO pin)
//   ADC output   : 0 – 4095 (12-bit raw ADC; converted to AQI index in mobile app)
//   Heater       : Requires 5 V DC; consumes ~150 mA.
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3 — Arduino framework
//
// WIRING:
//   MQ135 VCC  →  5 V  (the heater element requires 5 V supply)
//   MQ135 GND  →  GND
//   MQ135 AO   →  GPIO 35  (input-only ADC1 pin, matching ESP32_Sensor_Hub.ino)
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
//   {"v":1,"sensor":4,"seq":<seq>,"ts":<uptime_ms>,"data":{"raw":<raw_adc>}}\n
//
//   Example packet (as seen in sample_data.txt line 10 & 40):
//     {"v":1,"sensor":4,"seq":180,"ts":181751,"data":{"raw":906}}
//
// SAMPLING & TRANSMISSION:
//   Acquisition rate: 10 Hz (every 100 ms)
//   Averaging window: 10 samples
//   BLE transmission rate: 1 Hz (every 1000 ms)
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
#define MQ135_PIN 35 // GPIO 35 (matching ESP32_Sensor_Hub.ino and Sanjeevni PCB)

static const uint32_t MQ135_ACQ_INTERVAL_MS = 100;  // 10 Hz acquisition
static const uint32_t MQ135_TX_INTERVAL_MS  = 1000; // 1 Hz BLE transmission
static const uint8_t  MQ135_AVG_SAMPLES     = 10;   // 10-sample averaging window

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

uint32_t mq135Sequence = 0;
uint32_t mq135LastAcqMs = 0;
uint32_t mq135LastTxMs = 0;
uint32_t mq135AccumRaw = 0;
uint8_t  mq135SampleCnt = 0;
uint32_t mq135AvgRaw = 0;

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
// SETUP MQ135
// ============================================================
void setupMQ135()
{
    analogSetPinAttenuation(MQ135_PIN, ADC_11db); // 0–3.3 V full range
    pinMode(MQ135_PIN, INPUT);
    mq135LastAcqMs = millis();
    mq135LastTxMs = millis();
    Serial.println("[MQ135] Initialized on GPIO 35 (10 Hz acq / 1 Hz BLE)");
}

// ============================================================
// READ & AVERAGE MQ135 (10 Hz acq, averages 10 samples)
// Returns true ONLY when an averaged reading is ready
// ============================================================
bool readMQ135()
{
    uint32_t now = millis();
    if ((now - mq135LastAcqMs) < MQ135_ACQ_INTERVAL_MS)
        return false;
    mq135LastAcqMs = now;

    mq135AccumRaw += (uint32_t)analogRead(MQ135_PIN);
    mq135SampleCnt++;

    if (mq135SampleCnt >= MQ135_AVG_SAMPLES)
    {
        mq135AvgRaw = mq135AccumRaw / (uint32_t)MQ135_AVG_SAMPLES;
        mq135AccumRaw = 0;
        mq135SampleCnt = 0;
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
// SEND MQ135 PACKET (Matching ESP32_Sensor_Hub.ino)
// Protocol: {"v":1,"sensor":4,"seq":<seq>,"ts":<ms>,"data":{"raw":<raw>}}\n
// ============================================================
void sendMQ135Packet()
{
    uint32_t now = millis();
    if ((now - mq135LastTxMs) < MQ135_TX_INTERVAL_MS)
        return;
    mq135LastTxMs = now;

    char payload[160];
    snprintf(payload, sizeof(payload),
             "{\"v\":1,\"sensor\":4,\"seq\":%lu,\"ts\":%lu,\"data\":{\"raw\":%lu}}\n",
             (unsigned long)mq135Sequence++,
             (unsigned long)now,
             (unsigned long)mq135AvgRaw);

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
    Serial.println("  Sanjeevni ESP32 MQ135 Gas BLE Component Test  ");
    Serial.println("  Protocol v1 (Sensor ID 4) — 1 Hz JSON Stream  ");
    Serial.println("================================================");

    setupMQ135();
    setupBLE();
}

// ============================================================
// LOOP
// ============================================================
void loop()
{
    if (readMQ135())
    {
        sendMQ135Packet();
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