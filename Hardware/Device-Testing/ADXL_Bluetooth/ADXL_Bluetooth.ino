// =============================================================================
// ADXL_Bluetooth.ino
//
// PURPOSE:
//   Tests the ADXL345 3-axis accelerometer over I2C and streams live
//   acceleration data to a connected Bluetooth Low Energy (BLE) client.
//
//   Use this sketch to:
//     1. Confirm the ADXL345 is correctly wired to I2C (SDA=21, SCL=22).
//     2. Verify that the Adafruit ADXL345 library initialises the sensor.
//     3. Observe X / Y / Z acceleration values in real time on the USB
//        Serial Monitor and via a mobile BLE terminal app.
//     4. Validate sensor readings before integration into the full hub.
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
// LIBRARIES:
//   Wire              — I2C driver (ESP32 Arduino core)
//   Adafruit_Sensor   — Unified sensor abstraction layer
//   Adafruit_ADXL345_U — ADXL345 driver
//   BLEDevice, BLEServer, BLEUtils, BLE2902 — ESP32 Arduino core (built-in)
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
//   "ESP32_ADXL_BLE"
//
// GATT PROFILE (Nordic UART Service - NUS):
//   Service UUID : 6E400001-B5A3-F393-E0A9-E50E24DCCA9E
//   TX Char UUID : 6E400003-B5A3-F393-E0A9-E50E24DCCA9E (Notify — ESP32 -> Client)
//   RX Char UUID : 6E400002-B5A3-F393-E0A9-E50E24DCCA9E (Write  — Client -> ESP32)
//
// DATA FORMAT (plain text, comma-separated, one reading per line):
//   ADXL345,<x>,<y>,<z>
//
//   Where x, y, z are floating-point acceleration values in m/s²,
//   printed to 3 decimal places.
//
//   Example output stream over BLE:
//     ADXL345,0.234,-0.156,9.812
//     ADXL345,0.230,-0.160,9.808
//
// SAMPLING RATE:
//   ~10 Hz  (one reading per 100 ms delay)
//
// USB SERIAL:
//   Baud rate : 115200
//   Mirrors all accelerometer readings for local monitoring.
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
// BLE CONFIGURATION & NORDIC UART UUIDs
// ============================================================
#define DEVICE_NAME "ESP32_ADXL_BLE"
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

// Server callbacks to detect client connection and disconnection
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

// ============================================================
// SETUP ADXL345
// ============================================================
bool setupADXL345()
{
    Wire.begin(SDA_PIN, SCL_PIN);

    if (!adxl.begin())
    {
        Serial.println("[ADXL345] Sensor not detected! Check wiring.");
        return false;
    }

    adxl.setRange(ADXL345_RANGE_2_G);
    Serial.println("[ADXL345] Initialized successfully (Range: ±2G)");
    return true;
}

// ============================================================
// READ ADXL345
// ============================================================
bool readADXL345(float &x, float &y, float &z)
{
    sensors_event_t event;
    adxl.getEvent(&event);

    x = event.acceleration.x;
    y = event.acceleration.y;
    z = event.acceleration.z;
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

    Serial.printf("[BLE] Advertising started as '%s'\n", DEVICE_NAME);
}

// ============================================================
// SEND DATA OVER BLE
// ============================================================
void sendBLE(float x, float y, float z)
{
    if (!deviceConnected)
        return;

    // Plain-text CSV packet: ADXL345,<x>,<y>,<z>\n
    String payload = "ADXL345," + String(x, 3) + "," + String(y, 3) + "," + String(z, 3) + "\n";
    pTxCharacteristic->setValue((uint8_t *)payload.c_str(), payload.length());
    pTxCharacteristic->notify();
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
    Serial.println("ESP32 ADXL345 BLE Test");
    Serial.println("==============================");

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
    float x = 0.0f, y = 0.0f, z = 0.0f;

    if (readADXL345(x, y, z))
    {
        // Local USB debug output
        Serial.printf("X: %7.3f  Y: %7.3f  Z: %7.3f m/s^2\n", x, y, z);

        // Send over BLE
        sendBLE(x, y, z);
    }

    // Auto-restart advertising if disconnected
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

    // ~10 Hz acquisition rate
    delay(100);
}