// =============================================================================
// ADXL_Bluetooth.ino
//
// PURPOSE:
//   Tests the ADXL345 3-axis accelerometer over I2C and streams live
//   acceleration data to a connected Bluetooth Low Energy (BLE) client
//   using the EXACT JSON protocol (v1, Sensor ID 2) expected by the
//   Sanjeevni mobile app and identical to ESP32_Sensor_Hub.ino.
//
//   Use this sketch to:
//     1. Confirm the ADXL345 is correctly wired to I2C (SDA=21, SCL=22).
//     2. Verify that the Adafruit ADXL345 library initialises the sensor.
//     3. Observe X / Y / Z acceleration values in real time on the USB
//        Serial Monitor and via the Sanjeevni mobile app over BLE.
//     4. Validate sensor readings and BLE transmission before full integration.
//
// SENSOR:
//   ADXL345 — 3-axis digital accelerometer (Analog Devices)
//   Interface  : I2C (default address 0x53; 0x1D if SDO pulled HIGH)
//   Range      : ±2G (configured here; options: ±2G, ±4G, ±8G, ±16G)
//   Output     : Acceleration in m/s² via Adafruit unified sensor API
//   Library    : Adafruit_ADXL345_U (requires Adafruit_Sensor)
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3 — Arduino framework
//
// WIRING:
//   ADXL345 VCC  →  3.3 V
//   ADXL345 GND  →  GND
//   ADXL345 SDA  →  GPIO 21
//   ADXL345 SCL  →  GPIO 22
//   ADXL345 SDO  →  GND  (sets I2C address to 0x53)
//   ADXL345 CS   →  3.3 V (selects I2C mode)
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
//   {"v":1,"sensor":2,"seq":<seq>,"ts":<uptime_ms>,"data":{"x":<x>,"y":<y>,"z":<z>}}\n
//
//   Example packet (as seen in sample_data.txt):
//     {"v":1,"sensor":2,"seq":4518,"ts":181483,"data":{"x":1.65,"y":-3.61,"z":-11.02}}
//
// SAMPLING & TRANSMISSION:
//   Acquisition rate: ~100 Hz (every 10 ms)
//   BLE transmission rate: 25 Hz (every 40 ms, matching ESP32_Sensor_Hub.ino)
//
// USB SERIAL:
//   Baud rate: 115200 baud
// =============================================================================

#include <Arduino.h>
#include <Wire.h>               // I2C driver — ESP32 Arduino core
#include <Adafruit_Sensor.h>    // Adafruit unified sensor abstraction
#include <Adafruit_ADXL345_U.h> // ADXL345 driver
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ============================================================
// PIN CONFIGURATION
// ============================================================
#define SDA_PIN 21
#define SCL_PIN 22

// ============================================================
// TIMING CONSTANTS (matching ESP32_Sensor_Hub.ino)
// ============================================================
static const uint32_t ADXL_ACQ_INTERVAL_MS = 10; // 100 Hz acquisition
static const uint32_t ADXL_TX_INTERVAL_MS  = 40; // 25 Hz BLE transmission

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
Adafruit_ADXL345_Unified adxl = Adafruit_ADXL345_Unified(12345);

BLEServer *pServer = nullptr;
BLECharacteristic *pTxCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Sequence tracking and state
uint32_t adxlSequence = 0;
uint32_t adxlLastAcqMs = 0;
uint32_t adxlLastTxMs = 0;
float adxlX = 0.0f, adxlY = 0.0f, adxlZ = 0.0f;

// Server callbacks to detect client connection and disconnection
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
// SETUP ADXL345
// ============================================================
bool setupADXL345()
{
    Wire.begin(SDA_PIN, SCL_PIN);

    if (!adxl.begin())
    {
        Serial.println("[ADXL345] ERROR: Sensor not detected! Check SDA/SCL wiring and pull-ups.");
        return false;
    }

    adxl.setRange(ADXL345_RANGE_2_G);
    Serial.println("[ADXL345] Initialized successfully (Range: ±2G, SDA=21, SCL=22)");
    return true;
}

// ============================================================
// READ ADXL345 (100 Hz acquisition)
// ============================================================
bool readADXL345()
{
    uint32_t now = millis();
    if ((now - adxlLastAcqMs) < ADXL_ACQ_INTERVAL_MS)
        return false;
    adxlLastAcqMs = now;

    sensors_event_t event;
    adxl.getEvent(&event);

    adxlX = event.acceleration.x;
    adxlY = event.acceleration.y;
    adxlZ = event.acceleration.z;
    return true;
}

// ============================================================
// SETUP BLE (Nordic UART Service)
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
// SEND ADXL345 JSON PACKET (Matching ESP32_Sensor_Hub.ino)
// Protocol: {"v":1,"sensor":2,"seq":<seq>,"ts":<ms>,"data":{"x":<x>,"y":<y>,"z":<z>}}\n
// ============================================================
void sendADXLPacket()
{
    uint32_t now = millis();
    if ((now - adxlLastTxMs) < ADXL_TX_INTERVAL_MS)
        return;
    adxlLastTxMs = now;

    // Build JSON packet matching Protocol v1, SensorId::ADXL345 (2)
    char payload[192];
    snprintf(payload, sizeof(payload),
             "{\"v\":1,\"sensor\":2,\"seq\":%lu,\"ts\":%lu,\"data\":{\"x\":%.2f,\"y\":%.2f,\"z\":%.2f}}\n",
             (unsigned long)adxlSequence++,
             (unsigned long)now,
             adxlX, adxlY, adxlZ);

    if (deviceConnected)
    {
        pTxCharacteristic->setValue((uint8_t *)payload, strlen(payload));
        pTxCharacteristic->notify();
    }

    // Local serial monitor display
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
    Serial.println("  Sanjeevni ESP32 ADXL345 BLE Component Test    ");
    Serial.println("  Protocol v1 (Sensor ID 2) — 25 Hz JSON Stream ");
    Serial.println("================================================");

    if (!setupADXL345())
    {
        Serial.println("[ERROR] Halting setup due to ADXL345 failure.");
        return;
    }

    setupBLE();
}

// ============================================================
// LOOP
// ============================================================
void loop()
{
    // 100 Hz acquisition
    if (readADXL345())
    {
        // 25 Hz transmission in standard JSON format
        sendADXLPacket();
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

    // Small yield to allow BLE stack processing
    delay(2);
}