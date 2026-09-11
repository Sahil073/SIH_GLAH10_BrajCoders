// =============================================================================
// Bluetooth.ino
//
// PURPOSE:
//   Bare-minimum Bluetooth Classic SPP (Serial Port Profile) connectivity test.
//   Verifies that the ESP32 can:
//     1. Advertise itself as a Bluetooth Classic device.
//     2. Accept a connection from an Android or Windows client.
//     3. Transmit a plain-text counter value over the SPP channel.
//
//   Run this sketch first to confirm Bluetooth hardware is functional before
//   testing any sensor-specific Bluetooth sketches.
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1) — Arduino framework
//   IMPORTANT: Bluetooth Classic (SPP) is NOT available on ESP32-S2/S3/C3.
//   Use only on the original ESP32 chip.
//
// LIBRARY:
//   BluetoothSerial — included in the ESP32 Arduino core.
//   No additional installation required.
//
// BLUETOOTH DEVICE NAME:
//   "ESP32_TEST"
//   Visible in your phone's Bluetooth device list.
//   Pair with this device, then connect via any serial Bluetooth app
//   (e.g., Serial Bluetooth Terminal on Android).
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
//   Mirrors every transmitted Bluetooth value so you can monitor locally.
//
// NOTE:
//   This sketch DOES NOT transmit any real sensor data.
//   It is a connectivity verification tool only.
// =============================================================================

#include "BluetoothSerial.h" // Bluetooth Classic SPP — ESP32 Arduino core

// --------------------------------------------------
// Bluetooth object
// One instance per sketch — only one SPP server is
// supported at a time on the classic ESP32.
// --------------------------------------------------
BluetoothSerial SerialBT;

// --------------------------------------------------
// Bluetooth device name
// This is the name shown to the remote device
// during pairing and connection.
// --------------------------------------------------
const char *DEVICE_NAME = "ESP32_TEST";

// --------------------------------------------------
// Setup
// --------------------------------------------------
void setup()
{
    // Start USB Serial communication for local debugging
    Serial.begin(115200);

    // Start Bluetooth Classic SPP and begin advertising.
    // After this call the ESP32 is discoverable and connectable.
    // No blocking wait — the loop runs immediately.
    SerialBT.begin(DEVICE_NAME);

    Serial.println();
    Serial.println("================================");
    Serial.println("ESP32 Bluetooth Test");
    Serial.println("================================");
    Serial.print("Device name: ");
    Serial.println(DEVICE_NAME);
    Serial.println("Waiting for Bluetooth connection...");
}

// --------------------------------------------------
// Main loop
// --------------------------------------------------
void loop()
{
    // Persistent counter — incremented with each successful Bluetooth send.
    // Declared static so it retains its value between loop() calls.
    static unsigned long counter = 0;

    // Check whether a Bluetooth device is connected before attempting to send.
    // Sending without a client would silently fail; this guard avoids that.
    if (SerialBT.hasClient())
    {
        // Send a plain-text packet over Bluetooth SPP.
        // Format: "TEST DATA: <counter>\n"
        SerialBT.print("TEST DATA: ");
        SerialBT.println(counter);

        // Mirror the transmitted data on the USB Serial Monitor
        // so the developer can verify what is being sent.
        Serial.print("Bluetooth -> ");
        Serial.println(counter);

        counter++;
    }
    else
    {
        // No Bluetooth client connected — print status to USB Serial.
        // The ESP32 continues advertising; connection can happen at any time.
        Serial.println("Waiting for Bluetooth connection...");
    }

    // Transmit one value per second (1 Hz).
    // This sketch uses delay() because timing precision is not required here;
    // it is only a connectivity test, not a sensor acquisition loop.
    delay(1000);
}