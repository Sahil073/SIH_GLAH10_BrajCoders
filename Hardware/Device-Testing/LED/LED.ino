// Onboard LED
#define LED_PIN 2

void setup()
{
    // Configure LED pin as an output
    pinMode(LED_PIN, OUTPUT);
}

void loop()
{
    // Turn LED ON
    digitalWrite(LED_PIN, HIGH);

    // Wait 1 second
    delay(1000);

    // Turn LED OFF
    digitalWrite(LED_PIN, LOW);

    // Wait 1 second
    delay(1000);
}
