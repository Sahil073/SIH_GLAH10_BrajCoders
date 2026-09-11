// =============================================================================
// DHT_Bluetooth.ino
//
// PURPOSE:
//   Tests the DHT11 temperature and humidity sensor and streams readings
//   to a connected Bluetooth Classic client.
//
//   Use this sketch to:
//     1. Confirm the DHT11 is correctly wired to GPIO 4.
//     2. Verify the Adafruit DHT library reads valid temperature/humidity.
//     3. Observe live values on USB Serial Monitor and Bluetooth terminal.
//     4. Validate the 2-second read cycle (DHT11 minimum sample interval).
//
// SENSOR:
//   DHT11 — Digital Temperature and Humidity Sensor
//   Interface      : Single-wire digital (proprietary DHT protocol)
//   Temperature    : 0 – 50 °C  ± 2 °C  resolution 1 °C
//   Humidity       : 20 – 80 % RH  ± 5 % RH  resolution 1 %
//   Minimum interval : 1–2 seconds between readings (longer than DHT22)
//   Library        : DHT.h (Adafruit DHT sensor library)
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1) — Arduino framework
//
// LIBRARIES:
//   DHT.h           — Adafruit DHT sensor library
//   BluetoothSerial — Bluetooth Classic SPP (ESP32 Arduino core)
//
// WIRING:
//   DHT11 VCC   →  3.3 V  (or 5 V if your module has a regulator)
//   DHT11 DATA  →  GPIO 4
//   DHT11 GND   →  GND
//   If using a bare DHT11 (not a breakout module), add a 10 kΩ pull-up
//   resistor between DATA and VCC.
//
// BLUETOOTH DEVICE NAME:
//   "ESP32_DHT11"
//
// DATA FORMAT (plain text, one reading per line):
//   Temperature: <value> C, Humidity: <value> %
//
//   Example output stream over Bluetooth:
//     Temperature: 28.00 C, Humidity: 64.00 %
//     Temperature: 28.00 C, Humidity: 65.00 %
//     ...
//
//   NOTE: The integration sketch (ESP32_Sensor_Hub.ino) uses JSON format:
//   {"v":1,"sensor":3,"seq":N,"ts":N,"data":{"temperature":28.0,"humidity":64.0}}
//
// SAMPLING RATE:
//   0.5 Hz  (one reading every 2 seconds — set by delay(2000))
//   This matches the DHT11 minimum recommended polling interval.
//   Reading faster risks repeated NaN failures from the sensor.
//
// USB SERIAL:
//   Baud rate : 115200
//   Every reading is also printed locally.
//
// ERROR HANDLING:
//   If dht.readTemperature() or dht.readHumidity() returns NaN (not-a-number),
//   the reading is discarded, an error is printed, and the next cycle proceeds.
//   NaN occurs when the DHT11 fails to respond within the protocol timeout —
//   commonly caused by wiring issues, missing pull-up resistor, or polling
//   too quickly.
// =============================================================================

#include <DHT.h>             // Adafruit DHT sensor library
#include "BluetoothSerial.h" // Bluetooth Classic SPP — ESP32 Arduino core

// -------------------------
// Pin configuration
// -------------------------

// GPIO connected to the DHT11 DATA pin.
#define DHT_PIN 4

// Sensor type — DHT11 (not DHT22 or DHT21).
// Passed to the DHT constructor to select the correct protocol timing.
#define DHT_TYPE DHT11

// -------------------------
// Objects
// -------------------------

// DHT sensor object — handles the single-wire protocol internally.
DHT dht(DHT_PIN, DHT_TYPE);

// Bluetooth Classic SPP object.
BluetoothSerial SerialBT;

// -------------------------
// Setup DHT11
// -------------------------

void setupDHT()
{
    // Initialise the DHT sensor and its internal timing engine.
    // dht.begin() configures the DATA pin and prepares the library
    // for the first read call.
    dht.begin();

    Serial.println("DHT11 initialized");
}

// -------------------------
// Read DHT11
// -------------------------

// Reads temperature (°C) and humidity (% RH) from the DHT11.
// Validates both values with isnan() before accepting them.
// Returns true if the reading is valid; false if the sensor failed.
bool readDHT(float &temperature, float &humidity)
{
    // Read humidity first (library recommendation for DHT11 timing).
    humidity = dht.readHumidity();

    // Read temperature in Celsius.
    temperature = dht.readTemperature();

    // Check if either value is NaN — indicates a failed read.
    // Common causes: read called too quickly, missing pull-up, loose wiring.
    if (isnan(temperature) || isnan(humidity))
    {
        Serial.println("DHT11 read failed!");
        return false;
    }

    return true;
}

// -------------------------
// Setup Bluetooth
// -------------------------

void setupBluetooth()
{
    // Advertise the ESP32 as "ESP32_DHT11" over Bluetooth Classic.
    SerialBT.begin("ESP32_DHT11");

    Serial.println("Bluetooth started");
    Serial.println("Device: ESP32_DHT11");
}

// -------------------------
// Send data over Bluetooth
// -------------------------

// Transmits one DHT11 reading to the Bluetooth client.
// Format: "Temperature: <value> C, Humidity: <value> %\n"
// Silently returns if no client is connected.
void sendBluetooth(float temperature,
                   float humidity)
{
    // Guard: do not send if no Bluetooth device is connected.
    if (!SerialBT.hasClient())
    {
        return;
    }

    // Human-readable plain-text format for easy reading in a BT terminal app.
    // Example: "Temperature: 28.00 C, Humidity: 64.00 %"
    SerialBT.print("Temperature: ");
    SerialBT.print(temperature);
    SerialBT.print(" C, Humidity: ");
    SerialBT.print(humidity);
    SerialBT.println(" %"); // println appends '\n' as the packet delimiter
}

// -------------------------
// Setup
// -------------------------

void setup()
{
    Serial.begin(115200);

    // Allow USB serial to settle on the host before printing
    delay(1000);

    Serial.println();
    Serial.println("ESP32 DHT11 Bluetooth Test");

    // Initialise DHT11
    setupDHT();

    // Start Bluetooth Classic SPP
    setupBluetooth();
}

// -------------------------
// Main loop
// -------------------------

void loop()
{
    float temperature;
    float humidity;

    // Attempt to read temperature and humidity.
    // readDHT() returns false and prints an error if the read fails.
    if (readDHT(temperature, humidity))
    {
        // Print valid reading to USB Serial Monitor
        Serial.print("Temperature: ");
        Serial.print(temperature);
        Serial.print(" C, Humidity: ");
        Serial.print(humidity);
        Serial.println(" %");

        // Send reading to Bluetooth client
        sendBluetooth(temperature, humidity);
    }

    // Wait 2 seconds before the next read.
    // DHT11 requires at least 1 second between measurements; 2 seconds
    // provides a safe margin and gives 0.5 Hz output rate.
    // The production integration (ESP32_Sensor_Hub.ino) achieves the same
    // 0.5 Hz rate using a non-blocking millis()-based scheduler.
    delay(2000);
}