// =============================================================================
// Bioamp_EXG_Bluetooth.ino
//
// PURPOSE:
//   Combines the BioAmp EXG Pill raw biopotential acquisition with Bluetooth
//   Low Energy (BLE) transmission using the EXACT JSON protocol (v1, Sensor ID 1)
//   expected by the Sanjeevni mobile app and identical to ESP32_Sensor_Hub.ino.
//
//   Use this sketch to:
//     1. Verify end-to-end 500 Hz cardiac / biopotential stream from EXG Pill
//        through ESP32 BLE to the mobile app's Real-Time ECG Oscilloscope.
//     2. Observe live QRS complexes, BPM estimation, and SQI calculation.
//     3. Test non-blocking 500 Hz micros() sampling and safe 128-byte BLE chunking.
//
// SENSOR:
//   BioAmp EXG Pill (by Upside Down Labs)
//   Instrumentation-amplifier front-end for biopotential signals (ECG/EMG/EOG).
//   Output is an analog biopotential signal centered around VCC/2 (~1.65 V).
//   Acquires at 500 Hz (2000 us interval) with 12-bit ADC (0–4095 range).
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3 — Arduino framework
//
// WIRING:
//   EXG Pill OUT  →  GPIO 34  (input-only ADC pin, ADC1_CH6)
//   EXG Pill VCC  →  3.3 V
//   EXG Pill GND  →  GND
//   Electrodes: RA (Right Arm / red), LA (Left Arm / yellow), RL (Right Leg / black)
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
//   {"v":1,"sensor":1,"seq":<seq>,"ts":<uptime_ms>,"rate":500,"samples":[s0,s1,...,s127]}\n
//
//   Example packet (as seen in sample_data.txt):
//     {"v":1,"sensor":1,"seq":705,"ts":181482,"rate":500,"samples":[1470,1453,1424,1387,...]}
//
// SAMPLING & TRANSMISSION:
//   Sampling rate: 500 Hz (micros()-based scheduler, 2000 us interval)
//   Buffer size: 128 samples (~256 ms per packet batch, ~3.9 packets/sec)
//   Transmission: Chunked into 128-byte BLE notification slices for safe delivery
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
// CONFIGURATION & CONSTANTS
// ============================================================
#define EXG_PIN 34

static const uint16_t EXG_SAMPLE_RATE_HZ = 500;
static const uint16_t EXG_BUFFER_SIZE    = 128;
static const uint32_t EXG_INTERVAL_US    = 1000000UL / EXG_SAMPLE_RATE_HZ; // 2000 us

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

// 128-sample biopotential ring buffer
uint16_t exgBuffer[EXG_BUFFER_SIZE];
uint16_t exgBufferIndex = 0;
uint32_t exgLastMicros = 0;
uint32_t exgSequence = 0;

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
// SETUP EXG
// ============================================================
void setupEXG()
{
    pinMode(EXG_PIN, INPUT);
    analogReadResolution(12);
    exgLastMicros = micros();
    exgBufferIndex = 0;
    Serial.println("[EXG] BioAmp Pill initialized on GPIO 34 (12-bit ADC @ 500 Hz)");
}

// ============================================================
// READ EXG (500 Hz micros()-based acquisition)
// Returns true ONLY when the 128-sample buffer is complete
// ============================================================
bool readEXG()
{
    uint32_t now = micros();

    if ((now - exgLastMicros) < EXG_INTERVAL_US)
        return false;

    // Advance reference by fixed interval to eliminate clock drift accumulation
    exgLastMicros += EXG_INTERVAL_US;

    exgBuffer[exgBufferIndex++] = (uint16_t)analogRead(EXG_PIN);

    if (exgBufferIndex >= EXG_BUFFER_SIZE)
    {
        exgBufferIndex = 0;
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
// SEND EXG PACKET (Matching ESP32_Sensor_Hub.ino)
// Protocol: {"v":1,"sensor":1,"seq":<seq>,"ts":<ms>,"rate":500,"samples":[...]}\n
// Uses safe 128-byte chunking for robust transmission over BLE.
// ============================================================
void sendEXGPacket()
{
    // Build JSON packet manually to avoid heap fragmentation
    String output;
    output.reserve(1600);

    output += "{\"v\":1,\"sensor\":1,\"seq\":";
    output += String(exgSequence++);
    output += ",\"ts\":";
    output += String(millis());
    output += ",\"rate\":500,\"samples\":[";

    for (uint16_t i = 0; i < EXG_BUFFER_SIZE; i++)
    {
        output += String(exgBuffer[i]);
        if (i < EXG_BUFFER_SIZE - 1)
            output += ',';
    }
    output += "]}\n";

    // Transmit over BLE notifications in safe 128-byte slices
    if (deviceConnected)
    {
        const uint8_t *data = (const uint8_t *)output.c_str();
        size_t len = output.length();
        size_t offset = 0;
        const size_t maxChunk = 128;

        while (offset < len)
        {
            size_t chunk = len - offset;
            if (chunk > maxChunk)
                chunk = maxChunk;

            pTxCharacteristic->setValue((uint8_t *)(data + offset), chunk);
            pTxCharacteristic->notify();
            offset += chunk;

            if (offset < len)
            {
                delay(2); // Yield between slices to prevent ring buffer overflow
            }
        }
    }

    // Local serial summary
    Serial.printf("[EXG] Sent batch seq=%lu | samples=128 | BLE=%s\n",
                  (unsigned long)(exgSequence - 1),
                  deviceConnected ? "OK" : "STANDBY");
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
    Serial.println("  Sanjeevni ESP32 BioAmp EXG BLE Component Test   ");
    Serial.println("  Protocol v1 (Sensor ID 1) — 500 Hz QRS Stream   ");
    Serial.println("==================================================");

    setupEXG();
    setupBLE();
}

// ============================================================
// LOOP
// ============================================================
void loop()
{
    // High-precision 500 Hz acquisition
    if (readEXG())
    {
        // When 128 samples are buffered, transmit full packet batch
        sendEXGPacket();
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
}