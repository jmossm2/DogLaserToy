// #include "core-functions.h"
// #include "backend.h"
// #include <ESP32Servo.h>
// #include "esp_camera.h"
// #include "camera_pins.h"
#include <WiFi.h>
#include "app.h"
#include "controller.h"

//#define Wifi WiFi
#define AP_MODE true

// WiFi login for my laptop's hotspot
const char* ssid = "LAPTOP-1QLPB7T6 1976";
const char* password = "1003P5<o";

const char* ssidc = "esp";

void setup() {
  Serial.begin(115200);

  // Create an access point
  if (AP_MODE) {
    WiFi.softAP(ssidc, password);
  }
  else {
    // Connect to wifi
    WiFi.begin(ssid, password);
    // Wait until connected to continue
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.printf(".");
    }
    Serial.println("\nWiFi connected");
  }
  
  // Init camera
  app_init_camera();

  // Init servos and controller data
  controller_init();

  // Start the web server
  startServer();
  startStream();

  // Tell user how to connect to server
  if (AP_MODE) {
    IPAddress IP = WiFi.softAPIP();
    Serial.print("AP IP address: ");
    Serial.println(IP);
  }
  else {
    Serial.print("Server ready! Use 'http://");
    Serial.print(WiFi.localIP());
    Serial.println("' to connect");
  }

  // Continually update servo every 100ms
  // while (1) {
  //   // controller_updateServoPos();
  //   delay(100);
  // }
}

void loop() {
  delay(10000);
}
