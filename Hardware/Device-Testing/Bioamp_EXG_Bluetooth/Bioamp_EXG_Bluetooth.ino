// =============================================================================
// Bioamp_EXG_Bluetooth.ino
//
// PURPOSE:
//   Combines the BioAmp EXG Pill raw ADC acquisition with Bluetooth Low Energy
//   (BLE) transmission. Reads raw biopotential samples and streams them to a
//   connected BLE client (e.g. mobile app or PC terminal) as plain text.
//
//   Use this sketch to:
//     1. Verify end-to-end data flow from EXG Pill → ESP32 → BLE → phone/PC.
//     2. Observe live EXG waveforms on an Android/iOS BLE terminal app.
//     3. Validate BLE throughput and latency before full hub integration.
//
// SENSOR:
//   BioAmp EXG Pill (by Upside Down Labs)
//   Instrumentation-amplifier front-end for biopotential signals (EMG/ECG/EOG).
//   Output is an analog voltage proportional to the electrode differential.
//   This sketch reads the raw 12-bit ADC value (0–4095).
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3 — Arduino framework
//
// LIBRARIES:
//   BLEDevice, BLEServer, BLEUtils, BLE2902 — ESP32 Arduino core (built-in)
//
// BLE DEVICE NAME:
//   "ESP32_EXG_BLE"
//
// WIRING:
//   EXG Pill OUT  →  GPIO 34  (input-only ADC pin, ADC1_CH6)
//   EXG Pill VCC  →  3.3 V
//   EXG Pill GND  →  GND
//
// GATT PROFILE (Nordic UART Service - NUS):
//   Service UUID : 6E400001-B5A3-F393-E0A9-E50E24DCCA9E
//   TX Char UUID : 6E400003-B5A3-F393-E0A9-E50E24DCCA9E (Notify — ESP32 -> Client)
//   RX Char UUID : 6E400002-B5A3-F393-E0A9-E50E24DCCA9E (Write  — Client -> ESP32)
//
// DATA FORMAT (plain text, comma-separated, one sample per line):
//   EXG,<raw_adc_value>
//
//   Example output stream over BLE:
//     EXG,2048
//     EXG,2051
//     EXG,2046
//
// SAMPLING RATE:
//   ~100 Hz  (one sample per 10 ms delay)
//   The production integration (ESP32_Sensor_Hub.ino) achieves 500 Hz
//   using a non-blocking micros()-based scheduler.
//
// USB SERIAL:
//   Baud rate : 115200
//   Every sample value is also printed locally for monitoring.
// =============================================================================

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ============================================================
// CONFIGURATION
// ============================================================
#define EXG_PIN 34

// ============================================================
// BLE CONFIGURATION & NORDIC UART UUIDs
// ============================================================
#define DEVICE_NAME "ESP32_EXG_BLE"
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
// SETUP EXG
// ============================================================
void setupEXG()
{
    pinMode(EXG_PIN, INPUT);
    analogReadResolution(12);
    Serial.println("[EXG] Pill initialized on GPIO 34 (12-bit ADC)");
}

// ============================================================
// READ EXG
// ============================================================
int readEXG()
{
    return analogRead(EXG_PIN);
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
// SEND EXG DATA OVER BLE
// ============================================================
void sendBLE(int exgValue)
{
    if (!deviceConnected)
        return;

    String payload = "EXG," + String(exgValue) + "\n";
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
    Serial.println("ESP32 BioAmp EXG BLE Test");
    Serial.println("==============================");

    setupEXG();
    setupBLE();
}

// ============================================================
// LOOP
// ============================================================
void loop()
{
    int exgValue = readEXG();

    // Print to USB Serial Plotter/Monitor
    Serial.printf("EXG: %d\n", exgValue);

    // Stream over BLE
    sendBLE(exgValue);

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

    // ~100 Hz loop rate (10 ms delay)
    delay(10);
}