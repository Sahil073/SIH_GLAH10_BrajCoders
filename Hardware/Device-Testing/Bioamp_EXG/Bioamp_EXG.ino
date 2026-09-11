#define EXG_PIN 34

void setup()
{
    Serial.begin(115200);

    analogReadResolution(12);

    pinMode(EXG_PIN, INPUT);

    Serial.println("BioAmp EXG Pill test");
}

void loop()
{
    int value = analogRead(EXG_PIN);

    Serial.println(value);

    delay(10);
}