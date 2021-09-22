// #include "core-functions.h"
// #include "backend.h"
// #include <ESP32Servo.h>
// #include "esp_camera.h"
// #include "camera_pins.h"
#include <WiFi.h>
#include "esp_http_server.h"
#include "esp_camera.h"
#include "frontend.h"
#include <Servo.h>
#include "app.h"

#include "controller.h"
#define CAMERA_MODEL_AI_THINKER // Our camera model
#include "camera_pins.h"

//#define Wifi WiFi

// WiFi login for my laptop's hotspot
const char* ssid = "LAPTOP-1QLPB7T6 1976";
const char* password = "1003P5<o";

void setup() {
  Serial.begin(115200);

  // Connect to wifi
  WiFi.begin(ssid, password);

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
}

void loop() {
  delay(10000);
}
