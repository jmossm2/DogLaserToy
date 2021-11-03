// #include "core-functions.h"
// #include "backend.h"
// #include <ESP32Servo.h>
// #include "esp_camera.h"
// #include "camera_pins.h"
#include <WiFi.h>
#include "app.h"
#include "controller.h"

//#define Wifi WiFi

// WiFi login for my laptop's hotspot
const char* ssid = "LAPTOP-1QLPB7T6 1976";
const char* password = "1003P5<o";

const char* ssidc = "esp";

void setup() {
  Serial.begin(115200);
  WiFi.softAP(ssidc, password);

  // Connect to wifi
  // WiFi.begin(ssid, password);
  
  // Wait until connected to continue
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  
  // Init camera
  app_init_camera();

  // Init servos and controller data
  controller_init();

  // Start the web server
  startServer();
  startStream();

  // Tell user how to connect to server
  Serial.print("Server ready! Use 'http://");
  Serial.print(WiFi.localIP());
  Serial.println("' to connect");

  // Continually update servo every 100ms
  // while (1) {
  //   // controller_updateServoPos();
  //   delay(100);
  // }
}

void loop() {
  delay(10000);
}
