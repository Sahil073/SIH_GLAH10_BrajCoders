// =============================================================================
// DHT11.ino — Standalone Sensor Diagnostic Test (WITHOUT BLE)
//
// PURPOSE:
//   Direct USB serial diagnostic test for the DHT11 digital temperature and
//   humidity sensor. Verifies digital communication, timing, and environmental
//   telemetry without involving Bluetooth or network stacks.
//
//   Use this sketch to:
//     1. Confirm single-wire digital communication on GPIO 4.
//     2. Verify pull-up resistor integrity (10 kΩ pull-up to 3.3V).
//     3. Observe temperature (°C), relative humidity (%), and compute Heat Index.
//     4. Validate sensor stability over 2-second acquisition cycles.
//
// SENSOR:
//   DHT11 — Digital Temperature & Humidity Sensor
//   Interface      : Single-wire digital protocol
//   Temperature    : 0 to 50 °C (±2 °C accuracy)
//   Humidity       : 20 to 80 % RH (±5 % RH accuracy)
//   Sample Rate    : 0.5 Hz (minimum 2 seconds between reads)
//   Library        : DHT.h (Adafruit DHT sensor library)
//
// BOARD:
//   Classic ESP32 (DevKit V1 / WROOM-32), ESP32-S3, ESP32-C3 — Arduino framework
//
// WIRING:
//   DHT11 VCC  →  3.3 V (or 5 V for modules with onboard regulators)
//   DHT11 DATA →  GPIO 4 (with 10 kΩ pull-up to 3.3 V if using bare sensor)
//   DHT11 GND  →  GND
//
// SERIAL MONITOR:
//   Baud rate: 115200 baud
// =============================================================================

#include <Arduino.h>
#include <DHT.h>

#define DHT_PIN 4
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

// Compute simplified Steadman / NOAA Heat Index in Celsius
float computeHeatIndexC(float tempC, float humidity)
{
    if (tempC <= 0.0f) return tempC;
    float hi = tempC + 0.33f * ((humidity / 100.0f) * 6.105f * expf((17.27f * tempC) / (237.7f + tempC))) - 4.0f;
    return hi;
}

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("==================================================");
    Serial.println("   DHT11 Temperature & Humidity Diagnostic Test   ");
    Serial.println("   (Standalone USB Serial — No BLE Required)      ");
    Serial.println("==================================================");

    dht.begin();
    Serial.println("[SUCCESS] DHT11 library initialized on GPIO 4.");
    Serial.println("NOTE: The DHT11 requires 1–2 seconds between samples.");
    Serial.println("Reading every 2.5 seconds...\n");
}

void loop()
{
    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (isnan(temp) || isnan(hum))
    {
        Serial.println("[ERROR] Failed to read from DHT11 sensor! Check wiring, power, and pull-up resistor.");
    }
    else
    {
        float heatIndex = computeHeatIndexC(temp, hum);

        Serial.printf("Temperature: %5.1f °C  |  Humidity: %5.1f %%  |  Heat Index: %5.1f °C",
                      temp, hum, heatIndex);

        // Physiological comfort evaluation
        if (heatIndex >= 41.0f) {
            Serial.print("  --> [DANGER: High Heat Stroke Risk]");
        } else if (heatIndex >= 32.0f) {
            Serial.print("  --> [CAUTION: Fatigue & Heat Cramps Possible]");
        } else {
            Serial.print("  --> [COMFORTABLE]");
        }
        Serial.println();
    }

    // 2.5 seconds delay between readings (DHT11 minimum sample interval is 2s)
    delay(2500);
}
