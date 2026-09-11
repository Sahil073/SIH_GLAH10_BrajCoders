// =============================================================================
// LED.ino
//
// PURPOSE:
//   Blink test for the ESP32 onboard LED (GPIO 2).
//   Used to confirm that the ESP32 board is powered, the Arduino toolchain
//   is correctly configured, and the firmware is being flashed successfully.
//   This is the simplest possible sanity-check sketch — run this first
//   whenever a new board is being set up.
//
// BOARD:
//   Classic ESP32 (ESP32-WROOM / DevKit V1) — Arduino framework
//
// HARDWARE:
//   Component  : Onboard LED
//   GPIO       : 2  (active HIGH — LED lights when pin is HIGH)
//   External   : No external components required
//
// BEHAVIOUR:
//   LED ON  → 1 second
//   LED OFF → 1 second
//   Repeats indefinitely
//
// NO SERIAL OUTPUT — this sketch does not use USB Serial.
// =============================================================================

// GPIO connected to the onboard LED.
// On most ESP32 DevKit V1 boards, GPIO 2 is the built-in blue LED.
#define LED_PIN 2

void setup()
{
    // Configure LED pin as a digital output.
    // The LED is controlled by driving the pin HIGH (ON) or LOW (OFF).
    pinMode(LED_PIN, OUTPUT);
}

void loop()
{
    // Turn LED ON — drive the pin HIGH
    digitalWrite(LED_PIN, HIGH);

    // Keep it on for 1 second (1000 ms)
    delay(1000);

    // Turn LED OFF — drive the pin LOW
    digitalWrite(LED_PIN, LOW);

    // Keep it off for 1 second before the next cycle
    delay(1000);
}
