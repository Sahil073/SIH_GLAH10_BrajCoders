// =============================================================================
// Moisture.ino — Standalone Sensor Diagnostic Test (WITHOUT BLE)
//
// PURPOSE:
//   Direct USB serial diagnostic test for the conductive / capacitive sweat
//   and skin moisture sensor. Verifies analog ADC response, electrode
//   conductivity, and 10-sample moving average smoothing without involving Bluetooth.
//
//   Use this sketch to:
//     1. Confirm electrical connection to GPIO 32.
//     2. Check dry baseline reading in open air (should read high or low depending on sensor type).
//     3. Test conductive sweat/moisture response by applying damp cloth or finger contact.
//     4. Determine calibration thresholds for 0–100% hydration mapping.
//
// SENSOR:
//   Conductive/Capacitive Sweat & Moisture Electrode (smart garment embedded)
//   Interface : Analog voltage output
//   ADC range : 0 to 4095 (12-bit on ESP32)
//   Power     : 3.3 V DC
//
// BOARD:
//   Classic ESP32 (DevKit V1 / WROOM-32), ESP32-S3, ESP32-C3 — Arduino framework
//
// WIRING:
//   Sensor VCC  →  3.3 V
//   Sensor GND  →  GND
//   Sensor AO   →  GPIO 32 (ADC1 channel 4, input/output capable pin)
//
// SERIAL MONITOR / PLOTTER:
//   Baud rate: 115200 baud
// =============================================================================

#include <Arduino.h>

#define MOISTURE_PIN 32

static const uint8_t AVG_WINDOW = 10;
uint32_t adcSum = 0;
uint8_t  sampleCount = 0;

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("==================================================");
    Serial.println("  Sweat & Moisture Sensor Direct Diagnostic Test  ");
    Serial.println("   (Standalone USB Serial — No BLE Required)      ");
    Serial.println("==================================================");

    // Set attenuation to 11dB for full 0 to 3.3V range
    analogSetPinAttenuation(MOISTURE_PIN, ADC_11db);
    pinMode(MOISTURE_PIN, INPUT);

    Serial.println("[SUCCESS] Moisture sensor configured on GPIO 32 (12-bit ADC).");
    Serial.println("Calibration reference:");
    Serial.println("  - Dry / Open Air: ADC ~4095 (resistive open-circuit)");
    Serial.println("  - Touch with dry skin: ADC ~2000–3500");
    Serial.println("  - Touch with perspiration/moisture: ADC < 1500");
    Serial.println("Starting 10 Hz sampling with 1-second smoothed output...\n");
}

void loop()
{
    uint16_t raw = analogRead(MOISTURE_PIN);
    adcSum += raw;
    sampleCount++;

    if (sampleCount >= AVG_WINDOW)
    {
        uint32_t avgAdc = adcSum / AVG_WINDOW;
        float voltage = (avgAdc / 4095.0f) * 3.3f;

        // Reset accumulators
        adcSum = 0;
        sampleCount = 0;

        // Compute 0-100% moisture percentage
        // (For standard resistive sensors, lower resistance = higher moisture)
        uint8_t moisturePct = (uint8_t)map(constrain(avgAdc, 500, 4095), 4095, 500, 0, 100);

        Serial.printf("Raw ADC: %4lu  |  Voltage: %4.2f V  |  Moisture: %3u %%",
                      (unsigned long)avgAdc, voltage, moisturePct);

        // Sweat hydration status
        if (moisturePct >= 75) {
            Serial.print("  --> [HEAVY SWEAT / HIGH HYDRATION]");
        } else if (moisturePct >= 30) {
            Serial.print("  --> [MODERATE PERSPIRATION]");
        } else {
            Serial.print("  --> [DRY SKIN SURFACE]");
        }
        Serial.println();
    }

    // 100 ms delay = 10 Hz acquisition rate
    delay(100);
}
