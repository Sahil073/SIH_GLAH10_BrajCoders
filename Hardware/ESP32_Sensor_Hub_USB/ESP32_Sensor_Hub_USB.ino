// =============================================================================
// ESP32_Sensor_Hub_USB.ino
//
// SIH 2026 - Problem Statement 26181
// Team: BrajCoders | Team ID: 1111 | Project: Sanjeevni Personal Health Companion
//
// Single-file integration for:
//   - BioAmp EXG Pill  (Sensor ID 1) — GPIO 34, 500 Hz, 128-sample buffer
//   - ADXL345           (Sensor ID 2) — I2C SDA=21/SCL=22, 100 Hz acq / 25 Hz TX
//   - DHT11             (Sensor ID 3) — GPIO 4, 0.5 Hz (every 2s)
//   - MQ135             (Sensor ID 4) — GPIO 35, 10 Hz acq / 1 Hz TX
//   - Soil Moisture     (Sensor ID 5) — GPIO 32, 10 Hz acq / 0.5 Hz TX
//
// Transport : Direct High-Speed USB Serial UART (Baud: 115200)
// Format    : Compact JSON, newline-delimited ('\n')
// Protocol  : version 1 ("v": 1)
// Timestamp : ESP32 uptime in milliseconds via millis()
//
// Advantages of USB Serial:
//   1. Zero BLE overhead — frees >70% of ESP32 RAM & Flash memory.
//   2. High reliability — eliminates packet drops, RF interference, and pairing issues.
//   3. Direct Web Serial API integration in modern browsers (Chrome/Edge) on localhost.
//
// Target Board: Classic ESP32 (ESP32-WROOM / DevKit V1), ESP32-S3, ESP32-C3
// Arduino Framework
// =============================================================================

// ─────────────────────────────────────────────
// 1. INCLUDES
// ─────────────────────────────────────────────
#include <Arduino.h>
#include <Wire.h>               // I2C for ADXL345
#include <Adafruit_Sensor.h>    // Adafruit unified sensor abstraction
#include <Adafruit_ADXL345_U.h> // ADXL345 driver
#include <DHT.h>                // DHT sensor library (Adafruit)
#include <ArduinoJson.h>        // JSON serialization

// ─────────────────────────────────────────────
// 2. PIN CONFIGURATION
// ─────────────────────────────────────────────
#define PIN_EXG 34     // BioAmp EXG Pill — analog input (input-only GPIO ADC1_CH6)
#define PIN_I2C_SDA 21 // ADXL345 SDA
#define PIN_I2C_SCL 22 // ADXL345 SCL
#define PIN_DHT 4      // DHT11 data pin
#define PIN_MQ135 35   // MQ135 analog out (input-only GPIO ADC1_CH7)
#define PIN_SOIL 32    // Soil/Moisture analog out (ADC1_CH4)

// ─────────────────────────────────────────────
// 3. CONSTANTS & RATES
// ─────────────────────────────────────────────
#define SERIAL_BAUD_RATE 115200

// EXG (Sensor 1)
static const uint16_t EXG_SAMPLE_RATE_HZ = 500;
static const uint16_t EXG_BUFFER_SIZE = 128;
static const uint32_t EXG_INTERVAL_US = 1000000UL / EXG_SAMPLE_RATE_HZ; // 2000 us

// ADXL345 (Sensor 2)
static const uint32_t ADXL_ACQ_INTERVAL_MS = 10; // 100 Hz acquisition
static const uint32_t ADXL_TX_INTERVAL_MS = 40;  // 25 Hz USB transmission

// DHT11 (Sensor 3)
#define DHT_TYPE DHT11
static const uint32_t DHT_INTERVAL_MS = 2000; // 0.5 Hz (every 2s)

// MQ135 (Sensor 4)
static const uint32_t MQ135_ACQ_INTERVAL_MS = 100; // 10 Hz acquisition
static const uint32_t MQ135_TX_INTERVAL_MS = 1000; // 1 Hz USB transmission
static const uint8_t MQ135_AVG_SAMPLES = 10;       // 10-sample running average

// Soil Moisture (Sensor 5)
static const uint32_t SOIL_ACQ_INTERVAL_MS = 100; // 10 Hz acquisition
static const uint32_t SOIL_TX_INTERVAL_MS = 2000; // 0.5 Hz USB transmission
static const uint8_t SOIL_AVG_SAMPLES = 10;       // 10-sample running average

// ─────────────────────────────────────────────
// 4. SENSOR ID ENUM (Protocol v1 Specification)
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
// 5. GLOBAL SENSORS & STATE
// ─────────────────────────────────────────────
Adafruit_ADXL345_Unified adxl = Adafruit_ADXL345_Unified(12345);
DHT dht(PIN_DHT, DHT_TYPE);

bool adxlAvailable = false;

// Per-sensor sequence counters
uint32_t exgSequence = 0;
uint32_t adxlSequence = 0;
uint32_t dhtSequence = 0;
uint32_t mq135Sequence = 0;
uint32_t soilSequence = 0;

// EXG Ring Buffer State
uint16_t exgBuffer[EXG_BUFFER_SIZE];
uint16_t exgBufferIndex = 0;
uint32_t exgLastMicros = 0;

// ADXL345 State
uint32_t adxlLastAcqMs = 0;
uint32_t adxlLastTxMs = 0;
float adxlX = 0.0f, adxlY = 0.0f, adxlZ = 9.8f;

// DHT11 State
uint32_t dhtLastMs = 0;

// MQ135 State
uint32_t mq135LastAcqMs = 0;
uint32_t mq135LastTxMs = 0;
uint32_t mq135AccumRaw = 0;
uint8_t mq135SampleCnt = 0;
uint32_t mq135AvgRaw = 0;

// Soil Moisture State
uint32_t soilLastAcqMs = 0;
uint32_t soilLastTxMs = 0;
uint32_t soilAccumRaw = 0;
uint8_t soilSampleCnt = 0;
uint32_t soilAvgRaw = 0;

// ─────────────────────────────────────────────
// 6. INITIALIZATION FUNCTIONS
// ─────────────────────────────────────────────
void setupEXG()
{
    pinMode(PIN_EXG, INPUT);
    exgLastMicros = micros();
    exgBufferIndex = 0;
}

void setupADXL345()
{
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

    if (!adxl.begin())
    {
        adxlAvailable = false;
        return;
    }

    adxl.setRange(ADXL345_RANGE_2_G);
    adxlAvailable = true;
    adxlLastAcqMs = millis();
    adxlLastTxMs = millis();
}

void setupDHT()
{
    dht.begin();
    dhtLastMs = millis();
}

void setupMQ135()
{
    analogSetPinAttenuation(PIN_MQ135, ADC_11db); // 0-3.3V input range
    pinMode(PIN_MQ135, INPUT);
    mq135LastAcqMs = millis();
    mq135LastTxMs = millis();
}

void setupSoilMoisture()
{
    analogSetPinAttenuation(PIN_SOIL, ADC_11db); // 0-3.3V input range
    pinMode(PIN_SOIL, INPUT);
    soilLastAcqMs = millis();
    soilLastTxMs = millis();
}

// ─────────────────────────────────────────────
// 7. SENSOR ACQUISITION FUNCTIONS
// ─────────────────────────────────────────────

// readEXG(): 500 Hz acquisition using non-accumulating micros() timer
bool readEXG()
{
    uint32_t now = micros();
    if ((now - exgLastMicros) < EXG_INTERVAL_US)
    {
        return false;
    }

    exgLastMicros += EXG_INTERVAL_US; // Prevents drift accumulation
    exgBuffer[exgBufferIndex++] = (uint16_t)analogRead(PIN_EXG);

    if (exgBufferIndex >= EXG_BUFFER_SIZE)
    {
        exgBufferIndex = 0;
        return true;
    }
    return false;
}

// readADXL345(): 100 Hz acquisition
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

// readDHT(): 0.5 Hz acquisition with NaN protection
bool readDHT(float &temperature, float &humidity)
{
    uint32_t now = millis();
    if ((now - dhtLastMs) < DHT_INTERVAL_MS)
        return false;
    dhtLastMs = now;

    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (isnan(t) || isnan(h))
    {
        return false;
    }

    temperature = t;
    humidity = h;
    return true;
}

// readMQ135(): 10 Hz acquisition with 10-sample running average
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

// readSoilMoisture(): 10 Hz acquisition with 10-sample running average
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

// ─────────────────────────────────────────────
// 8. HIGH-SPEED SERIAL JSON STREAMING
// ─────────────────────────────────────────────

// Helper to serialize and output a single newline-delimited JSON line
static void sendJsonSerial(JsonDocument &doc)
{
    serializeJson(doc, Serial);
    Serial.println(); // Delimited by standard newline '\n'
}

// sendEXGPacket(): 128-sample 500 Hz EXG buffer (~3.9 packets/sec)
void sendEXGPacket()
{
    StaticJsonDocument<1600> doc;
    doc["v"] = 1;
    doc["sensor"] = static_cast<uint8_t>(SensorId::EXG);
    doc["seq"] = exgSequence++;
    doc["ts"] = millis();
    doc["rate"] = EXG_SAMPLE_RATE_HZ;

    JsonArray samples = doc.createNestedArray("samples");
    for (uint16_t i = 0; i < EXG_BUFFER_SIZE; i++)
    {
        samples.add(exgBuffer[i]);
    }

    sendJsonSerial(doc);
}

// sendADXLPacket(): 25 Hz 3-axis motion vector
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
    doc["ts"] = now;

    JsonObject data = doc.createNestedObject("data");
    data["x"] = roundf(adxlX * 100.0f) / 100.0f;
    data["y"] = roundf(adxlY * 100.0f) / 100.0f;
    data["z"] = roundf(adxlZ * 100.0f) / 100.0f;

    sendJsonSerial(doc);
}

// sendDHTPacket(): 0.5 Hz ambient temperature and humidity
void sendDHTPacket(float temperature, float humidity)
{
    StaticJsonDocument<256> doc;
    doc["v"] = 1;
    doc["sensor"] = static_cast<uint8_t>(SensorId::DHT11);
    doc["seq"] = dhtSequence++;
    doc["ts"] = millis();

    JsonObject data = doc.createNestedObject("data");
    data["temperature"] = roundf(temperature * 10.0f) / 10.0f;
    data["humidity"] = roundf(humidity * 10.0f) / 10.0f;

    sendJsonSerial(doc);
}

// sendMQ135Packet(): 1 Hz averaged air quality ADC value
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
    data["raw"] = mq135AvgRaw;

    sendJsonSerial(doc);
}

// sendSoilPacket(): 0.5 Hz averaged moisture ADC value
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
    data["raw"] = soilAvgRaw;

    sendJsonSerial(doc);
}

// ─────────────────────────────────────────────
// 9. SETUP
// ─────────────────────────────────────────────
void setup()
{
    // Start hardware UART at 115200 baud
    Serial.begin(SERIAL_BAUD_RATE);
    delay(250);

    // Global ADC resolution: 12-bit (0–4095 range across 0–3.3V)
    analogReadResolution(12);

    // Initialize sensors
    setupADXL345();
    setupDHT();
    setupMQ135();
    setupSoilMoisture();
    setupEXG();

    // Stream a clean boot header as a diagnostic JSON line
    StaticJsonDocument<256> initDoc;
    initDoc["v"] = 1;
    initDoc["system"] = "Sanjeevni_Sensor_Hub_USB";
    initDoc["baud"] = SERIAL_BAUD_RATE;
    initDoc["adxl_status"] = adxlAvailable ? "online" : "missing";
    initDoc["status"] = "ready";
    sendJsonSerial(initDoc);
}

// ─────────────────────────────────────────────
// 10. MAIN LOOP — Non-Blocking Multi-Rate Scheduler
// ─────────────────────────────────────────────
void loop()
{
    // 1. EXG (Highest priority: 500 Hz via micros() non-blocking timer)
    if (readEXG())
    {
        sendEXGPacket(); // Sends 128 samples (~3.9 Hz)
    }

    // 2. ADXL345 (100 Hz acq / 25 Hz TX)
    readADXL345();
    sendADXLPacket();

    // 3. MQ135 (10 Hz acq / 1 Hz TX)
    readMQ135();
    sendMQ135Packet();

    // 4. Soil Moisture (10 Hz acq / 0.5 Hz TX)
    readSoilMoisture();
    sendSoilPacket();

    // 5. DHT11 (0.5 Hz acq + TX)
    {
        float temperature = 0.0f;
        float humidity = 0.0f;
        if (readDHT(temperature, humidity))
        {
            sendDHTPacket(temperature, humidity);
        }
    }

    // Zero delay() calls in loop — completely deterministic scheduler.
}
// =============================================================================
// END OF FILE — ESP32_Sensor_Hub_USB.ino
// =============================================================================

