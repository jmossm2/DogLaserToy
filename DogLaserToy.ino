// #include "core-functions.h"
// #include "backend.h"
#include <ESP32Servo.h>

//#define LED_BUILTIN 2
void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  //pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // put your main code here, to run repeatedly:
  //digitalWrite(LED_BUILTIN, HIGH);
  Serial.printf("HIGH\n");
  delay(500);
  //digitalWrite(LED_BUILTIN, HIGH);
  Serial.printf("LOW\n");
  delay(500);
}
