// =============================================================================
// Bluetooth.ino
//
// PURPOSE:
//   Bare-minimum Bluetooth Low Energy (BLE) GATT server connectivity test.
//   Implements the industry-standard Nordic UART Service (NUS) over BLE.
//   Verifies that the ESP32 can:
//     1. Advertise itself as a BLE peripheral device ("ESP32_TEST_BLE").
//     2. Accept a BLE connection from an Android, iOS, or Windows client.
//     3. Transmit a plain-text counter value via BLE characteristic notifications.
//     4. Automatically resume advertising when a client disconnects.
//
//   Run this sketch first to confirm BLE stack functionality before
//   testing any sensor-specific BLE sketches.
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3 — Arduino framework
//   Unlike Bluetooth Classic (which was restricted to original ESP32),
//   BLE is supported across the entire modern ESP32 family!
//
// LIBRARIES:
//   BLEDevice, BLEServer, BLEUtils, BLE2902 — built into the ESP32 Arduino core.
//   No external library installation required.
//
// GATT PROFILE (Nordic UART Service - NUS):
//   Service UUID : 6E400001-B5A3-F393-E0A9-E50E24DCCA9E
//   TX Char UUID : 6E400003-B5A3-F393-E0A9-E50E24DCCA9E (Notify — ESP32 -> Client)
//   RX Char UUID : 6E400002-B5A3-F393-E0A9-E50E24DCCA9E (Write  — Client -> ESP32)
//
// HOW TO CONNECT:
//   1. Install "Serial Bluetooth Terminal" (Android/iOS) or "nRF Connect".
//   2. In Serial Bluetooth Terminal: Menu -> Devices -> Bluetooth LE tab.
//   3. Scan and select "ESP32_TEST_BLE".
//   4. Connect. The app automatically recognizes the Nordic UART Service.
//
// DATA FORMAT (plain text, one value per line):
//   TEST DATA: <counter>
//
//   Example output stream:
//     TEST DATA: 0
//     TEST DATA: 1
//     TEST DATA: 2
//
// TRANSMISSION RATE:
//   One packet per second (1 Hz) — controlled by delay(1000).
//
// USB SERIAL:
//   Baud rate : 115200
//   Mirrors every transmitted BLE value so you can monitor locally.
// =============================================================================

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// --------------------------------------------------
// BLE Device & Nordic UART Service UUIDs
// --------------------------------------------------
#define DEVICE_NAME "ESP32_TEST_BLE"
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

// --------------------------------------------------
// Global BLE pointers & state flags
// --------------------------------------------------
BLEServer *pServer = nullptr;
BLECharacteristic *pTxCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// --------------------------------------------------
// Server callbacks: track connection and disconnection
// --------------------------------------------------
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
// Setup
// --------------------------------------------------
void setup()
{
    Serial.begin(115200);
    delay(500);

    Serial.println();
    Serial.println("================================");
    Serial.println("ESP32 BLE Connectivity Test");
    Serial.println("================================");
    Serial.print("Device name: ");
    Serial.println(DEVICE_NAME);

    // Initialize BLE device
    BLEDevice::init(DEVICE_NAME);

    // Set maximum MTU for high throughput
    BLEDevice::setMTU(517);

    // Create the BLE Server
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    // Create the Nordic UART Service
    BLEService *pService = pServer->createService(SERVICE_UUID);

    // Create the TX characteristic (Notify from ESP32 to remote client)
    pTxCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID_TX,
        BLECharacteristic::PROPERTY_NOTIFY
    );
    // Add BLE2902 descriptor for notifications
    pTxCharacteristic->addDescriptor(new BLE2902());

    // Create the RX characteristic (Write from remote client to ESP32)
    BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID_RX,
        BLECharacteristic::PROPERTY_WRITE
    );

    // Start the service
    pService->start();

    // Start advertising so mobile apps can discover the device
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();

    Serial.println("[BLE] Advertising started. Waiting for connection...");
}

// --------------------------------------------------
// Main loop
// --------------------------------------------------
void loop()
{
    static unsigned long counter = 0;

    // Transmit when a BLE central client is connected
    if (deviceConnected)
    {
        String message = "TEST DATA: " + String(counter) + "\n";

        // Transmit via BLE notification
        pTxCharacteristic->setValue((uint8_t *)message.c_str(), message.length());
        pTxCharacteristic->notify();

        // Local mirror on USB Serial Monitor
        Serial.print("BLE -> ");
        Serial.print(message);

        counter++;
    }
    else
    {
        Serial.println("Waiting for BLE connection...");
    }

    // Auto-restart advertising on client disconnection
    if (!deviceConnected && oldDeviceConnected)
    {
        delay(500); // Give the Bluetooth stack time to settle
        pServer->startAdvertising();
        Serial.println("[BLE] Restarted advertising. Ready for reconnection.");
        oldDeviceConnected = deviceConnected;
    }

    // Update connection transition tracking
    if (deviceConnected && !oldDeviceConnected)
    {
        oldDeviceConnected = deviceConnected;
    }

    // 1 Hz transmission interval
    delay(1000);
}