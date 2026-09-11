// =============================================================================
// ESP32_Sensor_Hub.ino
//
// Single-file integration for:
//   - BioAmp EXG Pill  (Sensor ID 1) — GPIO 34, 500 Hz, 128-sample buffer
//   - ADXL345           (Sensor ID 2) — I2C SDA=21/SCL=22, 100 Hz acq / 25 Hz BT
//   - DHT11             (Sensor ID 3) — GPIO 4, 0.5 Hz
//   - MQ135             (Sensor ID 4) — GPIO 35, 10 Hz acq / 1 Hz BT
//   - Soil Moisture     (Sensor ID 5) — GPIO 32, 10 Hz acq / 0.5 Hz BT
//
// Transport : Bluetooth Classic SPP ("BluetoothSerial")
// Format    : Compact JSON, newline-delimited
// Timestamp : ESP32 uptime via millis() — NOT a Unix wall-clock timestamp
// Protocol  : version 1 ("v":1)
//
// Board target : Classic ESP32 (ESP32-WROOM / DevKit V1), Arduino framework
// =============================================================================

// ─────────────────────────────────────────────
// 1. INCLUDES
// ─────────────────────────────────────────────
#include <Arduino.h>
#include "BluetoothSerial.h"    // Bluetooth Classic SPP — ESP32 Arduino core
#include <Wire.h>               // I2C for ADXL345
#include <Adafruit_Sensor.h>    // Adafruit unified sensor abstraction
#include <Adafruit_ADXL345_U.h> // ADXL345 driver
#include <DHT.h>                // DHT sensor library (Adafruit)
#include <ArduinoJson.h>        // JSON serialisation

// ─────────────────────────────────────────────
// 2. PIN CONFIGURATION  (edit here only)
// ─────────────────────────────────────────────
#define PIN_EXG 34     // BioAmp EXG Pill — analog input (input-only GPIO)
#define PIN_I2C_SDA 21 // ADXL345 SDA
#define PIN_I2C_SCL 22 // ADXL345 SCL
#define PIN_DHT 4      // DHT11 data
#define PIN_MQ135 35   // MQ135 analog out (input-only GPIO)
#define PIN_SOIL 32    // Soil moisture analog out

// ─────────────────────────────────────────────
// 3. CONSTANTS
// ─────────────────────────────────────────────

// EXG
static const uint16_t EXG_SAMPLE_RATE_HZ = 500;
static const uint16_t EXG_BUFFER_SIZE = 128;
static const uint32_t EXG_INTERVAL_US = 1000000UL / EXG_SAMPLE_RATE_HZ; // 2000 us

// ADXL345
static const uint32_t ADXL_ACQ_INTERVAL_MS = 10; // 100 Hz acquisition
static const uint32_t ADXL_TX_INTERVAL_MS = 40;  // 25 Hz Bluetooth transmission

// DHT11
static const uint32_t DHT_INTERVAL_MS = 2000; // 0.5 Hz

// MQ135
static const uint32_t MQ135_ACQ_INTERVAL_MS = 100; // 10 Hz acquisition
static const uint32_t MQ135_TX_INTERVAL_MS = 1000; // 1 Hz Bluetooth transmission
static const uint8_t MQ135_AVG_SAMPLES = 10;       // averaging window

// Soil moisture
static const uint32_t SOIL_ACQ_INTERVAL_MS = 100; // 10 Hz acquisition
static const uint32_t SOIL_TX_INTERVAL_MS = 2000; // 0.5 Hz Bluetooth transmission
static const uint8_t SOIL_AVG_SAMPLES = 10;       // averaging window

// DHT sensor type
#define DHT_TYPE DHT11

// Bluetooth device name
#define BT_DEVICE_NAME "ESP32_SENSOR_HUB"

// ─────────────────────────────────────────────
// 4. SENSOR ID ENUM  (protocol-defined — do NOT change numeric values)
// ─────────────────────────────────────────────
enum class SensorId : uint8_t
{
    EXG = 1,
    ADXL345 = 2,
    DHT11 = 3,
    MQ135 = 4,
    SOIL_MOISTURE = 5
};

// ─────────────────────────────────────────────
// 5. GLOBAL SENSOR OBJECTS & STATE
// ─────────────────────────────────────────────

BluetoothSerial SerialBT;
Adafruit_ADXL345_Unified adxl = Adafruit_ADXL345_Unified(12345);
DHT dht(PIN_DHT, DHT_TYPE);

// Sensor availability flags
bool adxlAvailable = false;

// Per-sensor sequence counters (one per sensor for independent packet tracking)
uint32_t exgSequence = 0;
uint32_t adxlSequence = 0;
uint32_t dhtSequence = 0;
uint32_t mq135Sequence = 0;
uint32_t soilSequence = 0;

// ─────────────────────────────────────────────
// 6. EXG BUFFER
// ─────────────────────────────────────────────
uint16_t exgBuffer[EXG_BUFFER_SIZE];
uint16_t exgBufferIndex = 0;
uint32_t exgLastMicros = 0;

// ─────────────────────────────────────────────
//    ADXL345 STATE
// ─────────────────────────────────────────────
uint32_t adxlLastAcqMs = 0;
uint32_t adxlLastTxMs = 0;
float adxlX = 0.0f, adxlY = 0.0f, adxlZ = 0.0f;

// ─────────────────────────────────────────────
//    DHT11 STATE
// ─────────────────────────────────────────────
uint32_t dhtLastMs = 0;

// ─────────────────────────────────────────────
//    MQ135 STATE
// ─────────────────────────────────────────────
uint32_t mq135LastAcqMs = 0;
uint32_t mq135LastTxMs = 0;
uint32_t mq135AccumRaw = 0;
uint8_t mq135SampleCnt = 0;
uint32_t mq135AvgRaw = 0; // latest computed average

// ─────────────────────────────────────────────
//    SOIL MOISTURE STATE
// ─────────────────────────────────────────────
uint32_t soilLastAcqMs = 0;
uint32_t soilLastTxMs = 0;
uint32_t soilAccumRaw = 0;
uint8_t soilSampleCnt = 0;
uint32_t soilAvgRaw = 0; // latest computed average

// =============================================================================
// 7. SENSOR INITIALIZATION FUNCTIONS
// =============================================================================

void setupEXG()
{
    // BioAmp EXG Pill outputs a raw analog signal.
    // No special library — direct analogRead().
    // analogReadResolution(12) is set globally in setup().
    pinMode(PIN_EXG, INPUT);
    exgLastMicros = micros();
    exgBufferIndex = 0;
    Serial.println("[EXG]  Initialized — GPIO 34 | 500 Hz | 128-sample buffer");
}

void setupADXL345()
{
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

    if (!adxl.begin())
    {
        Serial.println("[ADXL345] ERROR — sensor not detected on I2C bus. "
                       "Continuing without ADXL345.");
        adxlAvailable = false;
        return;
    }

    adxl.setRange(ADXL345_RANGE_2_G);
    adxlAvailable = true;
    adxlLastAcqMs = millis();
    adxlLastTxMs = millis();
    Serial.println("[ADXL345] Initialized — SDA=21, SCL=22 | 2G range | "
                   "100 Hz acq / 25 Hz BT");
}

void setupDHT()
{
    dht.begin();
    dhtLastMs = millis();
    Serial.println("[DHT11] Initialized — GPIO 4 | 0.5 Hz");
}

void setupMQ135()
{
    // No library — raw ADC only. Raw value reported; no ppm conversion.
    analogSetPinAttenuation(PIN_MQ135, ADC_11db); // 0–3.3 V input range
    pinMode(PIN_MQ135, INPUT);
    mq135LastAcqMs = millis();
    mq135LastTxMs = millis();
    Serial.println("[MQ135] Initialized — GPIO 35 | raw ADC | 10 Hz acq / 1 Hz BT");
}

void setupSoilMoisture()
{
    // No library — raw ADC only. Raw value reported; no calibration conversion.
    analogSetPinAttenuation(PIN_SOIL, ADC_11db);
    pinMode(PIN_SOIL, INPUT);
    soilLastAcqMs = millis();
    soilLastTxMs = millis();
    Serial.println("[SOIL]  Initialized — GPIO 32 | raw ADC | 10 Hz acq / 0.5 Hz BT");
}

// =============================================================================
// 8. SENSOR ACQUISITION FUNCTIONS
// =============================================================================

// readEXG() — non-blocking micros()-based 500 Hz scheduler.
// Returns true ONLY when the 128-sample buffer is full and ready to send.
bool readEXG()
{
    uint32_t now = micros();

    if ((now - exgLastMicros) < EXG_INTERVAL_US)
        return false; // interval not elapsed

    // Advance reference by fixed interval to avoid drift accumulation.
    exgLastMicros += EXG_INTERVAL_US;

    exgBuffer[exgBufferIndex++] = (uint16_t)analogRead(PIN_EXG);

    if (exgBufferIndex >= EXG_BUFFER_SIZE)
    {
        exgBufferIndex = 0; // reset for next batch — buffer is ready
        return true;
    }
    return false;
}

// readADXL345() — acquires at 100 Hz; stores latest reading in adxlX/Y/Z.
// Returns true if a new sample was acquired this call.
bool readADXL345()
{
    if (!adxlAvailable)
        return false;

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

// readDHT() — reads at 0.5 Hz; validates with isnan().
// Returns true when valid temperature/humidity are available.
bool readDHT(float &temperature, float &humidity)
{
    uint32_t now = millis();
    if ((now - dhtLastMs) < DHT_INTERVAL_MS)
        return false;
    dhtLastMs = now;

    float t = dht.readTemperature(); // degrees Celsius
    float h = dht.readHumidity();    // relative humidity %

    if (isnan(t) || isnan(h))
    {
        Serial.println("[DHT11] ERROR — read returned NaN. Skipping this packet.");
        return false;
    }

    temperature = t;
    humidity = h;
    return true;
}

// readMQ135() — acquires at 10 Hz; averages every 10 samples.
// Returns true when a fresh average is ready in mq135AvgRaw.
bool readMQ135()
{
    uint32_t now = millis();
    if ((now - mq135LastAcqMs) < MQ135_ACQ_INTERVAL_MS)
        return false;
    mq135LastAcqMs = now;

    mq135AccumRaw += (uint32_t)analogRead(PIN_MQ135);
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

// readSoilMoisture() — acquires at 10 Hz; averages every 10 samples.
// Returns true when a fresh average is ready in soilAvgRaw.
bool readSoilMoisture()
{
    uint32_t now = millis();
    if ((now - soilLastAcqMs) < SOIL_ACQ_INTERVAL_MS)
        return false;
    soilLastAcqMs = now;

    soilAccumRaw += (uint32_t)analogRead(PIN_SOIL);
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

// =============================================================================
// 9. JSON / BLUETOOTH TRANSMISSION FUNCTIONS
// =============================================================================

// Internal helper — serialises doc to SerialBT followed by newline delimiter.
static void sendJson(JsonDocument &doc)
{
    String output;
    output.reserve(256);
    serializeJson(doc, output);
    output += '\n';
    SerialBT.print(output);
}

// sendEXGPacket() — builds JSON for the full 128-sample EXG buffer and sends.
// StaticJsonDocument<1600>: v+sensor+seq+ts+rate fields + 128 uint16 samples.
void sendEXGPacket()
{
    StaticJsonDocument<1600> doc;
    doc["v"] = 1;
    doc["sensor"] = static_cast<uint8_t>(SensorId::EXG);
    doc["seq"] = exgSequence++;
    // ts = ESP32 uptime in milliseconds — NOT a Unix wall-clock timestamp.
    doc["ts"] = millis();
    doc["rate"] = EXG_SAMPLE_RATE_HZ;

    JsonArray samples = doc.createNestedArray("samples");
    for (uint16_t i = 0; i < EXG_BUFFER_SIZE; i++)
        samples.add(exgBuffer[i]);

    if (SerialBT.hasClient())
        sendJson(doc);
    // If no BT client: buffer is dropped (bounded — no unbounded queuing).

    Serial.printf("[EXG]  Packet seq=%lu | BT=%s\n",
                  (unsigned long)(exgSequence - 1),
                  SerialBT.hasClient() ? "sent" : "no client");
}

// sendADXLPacket() — transmits latest ADXL345 reading at 25 Hz.
void sendADXLPacket()
{
    if (!adxlAvailable)
        return;

    uint32_t now = millis();
    if ((now - adxlLastTxMs) < ADXL_TX_INTERVAL_MS)
        return;
    adxlLastTxMs = now;

    StaticJsonDocument<256> doc;
    doc["v"] = 1;
    doc["sensor"] = static_cast<uint8_t>(SensorId::ADXL345);
    doc["seq"] = adxlSequence++;
    doc["ts"] = now; // uptime ms

    JsonObject data = doc.createNestedObject("data");
    // Round to 2 decimal places to keep packets compact.
    data["x"] = roundf(adxlX * 100.0f) / 100.0f;
    data["y"] = roundf(adxlY * 100.0f) / 100.0f;
    data["z"] = roundf(adxlZ * 100.0f) / 100.0f;

    if (SerialBT.hasClient())
        sendJson(doc);
}

// sendDHTPacket() — transmits DHT11 temperature and humidity.
void sendDHTPacket(float temperature, float humidity)
{
    StaticJsonDocument<256> doc;
    doc["v"] = 1;
    doc["sensor"] = static_cast<uint8_t>(SensorId::DHT11);
    doc["seq"] = dhtSequence++;
    doc["ts"] = millis(); // uptime ms

    JsonObject data = doc.createNestedObject("data");
    data["temperature"] = roundf(temperature * 10.0f) / 10.0f; // 1 decimal
    data["humidity"] = roundf(humidity * 10.0f) / 10.0f;

    if (SerialBT.hasClient())
        sendJson(doc);
}

// sendMQ135Packet() — transmits averaged raw MQ135 ADC value at 1 Hz.
void sendMQ135Packet()
{
    uint32_t now = millis();
    if ((now - mq135LastTxMs) < MQ135_TX_INTERVAL_MS)
        return;
    mq135LastTxMs = now;

    StaticJsonDocument<192> doc;
    doc["v"] = 1;
    doc["sensor"] = static_cast<uint8_t>(SensorId::MQ135);
    doc["seq"] = mq135Sequence++;
    doc["ts"] = now;

    JsonObject data = doc.createNestedObject("data");
    data["raw"] = mq135AvgRaw; // raw 12-bit ADC value — not ppm

    if (SerialBT.hasClient())
        sendJson(doc);
}

// sendSoilPacket() — transmits averaged raw soil moisture ADC value at 0.5 Hz.
void sendSoilPacket()
{
    uint32_t now = millis();
    if ((now - soilLastTxMs) < SOIL_TX_INTERVAL_MS)
        return;
    soilLastTxMs = now;

    StaticJsonDocument<192> doc;
    doc["v"] = 1;
    doc["sensor"] = static_cast<uint8_t>(SensorId::SOIL_MOISTURE);
    doc["seq"] = soilSequence++;
    doc["ts"] = now;

    JsonObject data = doc.createNestedObject("data");
    data["raw"] = soilAvgRaw; // raw 12-bit ADC value — no calibration applied

    if (SerialBT.hasClient())
        sendJson(doc);
}

// =============================================================================
// 10. SETUP
// =============================================================================
void setup()
{
    // USB Serial debugging
    Serial.begin(115200);
    delay(200); // brief settle — startup only, not repeated in loop
    Serial.println("========================================");
    Serial.println("   ESP32 Sensor Hub — starting up");
    Serial.println("========================================");
    Serial.println("[NOTE] 'ts' field = ESP32 uptime in ms (NOT Unix wall-clock time)");

    // ── Bluetooth Classic SPP ──────────────────────────────────────────────
    // Non-blocking: ESP32 will advertise and accept connections at any time.
    // The loop does NOT wait for a client — acquisition runs regardless.
    if (!SerialBT.begin(BT_DEVICE_NAME))
    {
        Serial.println("[BT] ERROR — BluetoothSerial.begin() failed!");
        // Non-fatal: sensor acquisition continues; BT transmission is skipped.
    }
    else
    {
        Serial.printf("[BT] Bluetooth Classic SPP ready as '%s'\n", BT_DEVICE_NAME);
    }

    // ── Global ADC resolution (classic ESP32 = 12-bit, range 0-4095) ──────
    analogReadResolution(12);

    // ── Sensor initialization ──────────────────────────────────────────────
    // Each sensor logs its own status. Failures are reported but non-fatal.
    setupADXL345(); // I2C + ADXL345 (sets adxlAvailable flag)
    setupDHT();
    setupMQ135();
    setupSoilMoisture();
    setupEXG(); // Last — starts the micros() reference for 500 Hz timing

    Serial.println("[INIT] Initialization complete. Entering acquisition loop.");
    Serial.println("========================================");
}

// =============================================================================
// 11. LOOP — non-blocking multi-rate scheduler
// =============================================================================
void loop()
{
    // ── EXG (highest priority — micros()-based 500 Hz) ────────────────────
    // readEXG() is checked on every loop iteration to maintain tight timing.
    // JSON serialisation occurs only after 128 samples are collected (~256 ms).
    if (readEXG())
    {
        sendEXGPacket(); // transmits (or drops) the full buffer
        // exgBufferIndex reset inside readEXG(); acquisition resumes immediately
    }

    // ── ADXL345 (100 Hz acquisition / 25 Hz BT transmission) ──────────────
    readADXL345();    // updates adxlX/Y/Z at ~100 Hz (millis gated)
    sendADXLPacket(); // transmits latest values at ~25 Hz (millis gated)

    // ── MQ135 (10 Hz acquisition / 1 Hz BT transmission) ──────────────────
    readMQ135();       // accumulates raw ADC; computes avg every 10 samples
    sendMQ135Packet(); // transmits averaged raw value at ~1 Hz

    // ── Soil Moisture (10 Hz acquisition / 0.5 Hz BT transmission) ────────
    readSoilMoisture(); // accumulates raw ADC; computes avg every 10 samples
    sendSoilPacket();   // transmits averaged raw value every ~2 s

    // ── DHT11 (0.5 Hz acquisition + transmission) ─────────────────────────
    {
        float temperature = 0.0f;
        float humidity = 0.0f;
        if (readDHT(temperature, humidity))
            sendDHTPacket(temperature, humidity);
        // On DHT read failure, readDHT() prints an error and returns false.
        // No invalid data is transmitted.
    }

    // No delay() in this loop — all rate control is millis()/micros()-based.
}
// =============================================================================
// END OF FILE — ESP32_Sensor_Hub.ino
// =============================================================================
