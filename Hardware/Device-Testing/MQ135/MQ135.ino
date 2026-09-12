// =============================================================================
// MQ135.ino — Standalone Sensor Diagnostic Test (WITHOUT BLE)
//
// PURPOSE:
//   Direct USB serial diagnostic test for the MQ135 hazardous gas and air
//   quality sensor. Verifies analog ADC response, heater operation, and
//   10-sample moving average smoothing without involving Bluetooth.
//
//   Use this sketch to:
//     1. Confirm electrical connection of MQ135 AO pin to GPIO 35.
//     2. Verify 5V power to the internal heater coil (sensor should feel warm).
//     3. Observe raw ADC counts (0–4095) and calculate voltage (0–3.3V).
//     4. Establish a clean-air baseline reading in your environment.
//
// SENSOR:
//   MQ135 — Hazardous Gas / Air Quality Sensor
//   Target gases : Carbon dioxide (CO2), Ammonia (NH3), Benzene, Alcohol, Smoke
//   Output       : Analog voltage inversely proportional to air quality
//   ADC range    : 0 to 4095 (12-bit on ESP32)
//   Power        : Heater requires 5.0 V; signal output clamped to 0–3.3 V on ESP32
//
// BOARD:
//   Classic ESP32 (DevKit V1 / WROOM-32), ESP32-S3, ESP32-C3 — Arduino framework
//
// WIRING:
//   MQ135 VCC  →  5 V  (the heater requires 5V to maintain 150°C reaction temp)
//   MQ135 GND  →  GND
//   MQ135 AO   →  GPIO 35 (ADC1 channel 7, input-only pin)
//
// SERIAL MONITOR / PLOTTER:
//   Baud rate: 115200 baud
// =============================================================================

#include <Arduino.h>

#define MQ135_PIN 35

static const uint8_t AVG_WINDOW = 10;
uint32_t adcSum = 0;
uint8_t  sampleCount = 0;

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("==================================================");
    Serial.println("    MQ135 Air Quality Sensor Diagnostic Test      ");
    Serial.println("   (Standalone USB Serial — No BLE Required)      ");
    Serial.println("==================================================");

    // Set attenuation to 11dB to permit full 0 to 3.3V measurement range
    analogSetPinAttenuation(MQ135_PIN, ADC_11db);
    pinMode(MQ135_PIN, INPUT);

    Serial.println("[SUCCESS] MQ135 configured on GPIO 35 (12-bit ADC).");
    Serial.println("IMPORTANT PRE-HEAT ADVICE:");
    Serial.println("  - A cold sensor will read abnormally high for 3–5 minutes.");
    Serial.println("  - Ensure 5V is supplied to VCC (the metal cylinder should feel warm).");
    Serial.println("Starting 10 Hz sampling with 1-second smoothed output...\n");
}

void loop()
{
    // Read raw 12-bit value (0 - 4095)
    uint16_t rawAdc = analogRead(MQ135_PIN);
    adcSum += rawAdc;
    sampleCount++;

    if (sampleCount >= AVG_WINDOW)
    {
        uint32_t avgAdc = adcSum / AVG_WINDOW;
        float voltage = (avgAdc / 4095.0f) * 3.3f;

        // Reset accumulators
        adcSum = 0;
        sampleCount = 0;

        // Map raw ADC to approximate 0-500 AQI index (matching Sanjeevni mobile app)
        uint16_t estimatedAqi = (uint16_t)constrain(round((avgAdc / 3800.0f) * 160.0f), 15, 500);

        Serial.printf("Raw ADC: %4lu  |  Voltage: %4.2f V  |  Est. AQI: %3u",
                      (unsigned long)avgAdc, voltage, estimatedAqi);

        // Air quality qualitative category
        if (estimatedAqi > 150) {
            Serial.print("  --> [HAZARDOUS / SMOKE DETECTED]");
        } else if (estimatedAqi > 100) {
            Serial.print("  --> [UNHEALTHY]");
        } else if (estimatedAqi > 50) {
            Serial.print("  --> [MODERATE AIR QUALITY]");
        } else {
            Serial.print("  --> [GOOD / FRESH CLEAN AIR]");
        }
        Serial.println();
    }

    // 100 ms loop delay = 10 Hz acquisition rate
    delay(100);
}
