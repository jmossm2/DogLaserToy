// #include "core-functions.h"
// #include "backend.h"
// #include <ESP32Servo.h>
// #include "esp_camera.h"
// #include "camera_pins.h"
#include <WiFi.h>
#include "esp_http_server.h"
#include "esp_camera.h"

#define CAMERA_MODEL_AI_THINKER // Our camera model
#define Wifi WiFi // Jaden can't spell WiFi

// Some sent strings need this extra info, tedious to re-type
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

// WiFi login for my laptop's hotspot
const char* ssid = "LAPTOP-1QLPB7T6 1976";
const char* password = "1003P5<o";

// Honestly IDK what this is
httpd_handle_t web_httpd = NULL;

// Index handler for server
static esp_err_t index_handler(httpd_req_t *req) {
  httpd_resp_set_type(req, "text/plain");
  return httpd_resp_send(req, "index handler part 1",20);
}

// Stream handler for server
static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t *_jpg_buf = NULL;
  char *part_buf[64];
  // dl_matrix3du_t *image_matrix = NULL;

  // Cut out the weird if statement from the example, SHOULDNT cause issues
  static int64_t last_frame = 0;
  if (!last_frame) last_frame = esp_timer_get_time();

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

  // Main streaming loop
  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      res = ESP_FAIL;
    } else {
      if (true /*!detection_enabled, but we aren't detecting*/) {
        if (fb->format != PIXFORMAT_JPEG) {
          bool jpeg_converted = frame2jpg(fb, 80, &_jpg_buf, &_jpg_buf_len);
          esp_camera_fb_return(fb);
          fb = NULL;
          if (!jpeg_converted) {
            Serial.println("JPEG compression failed");
            res = ESP_FAIL;
          }
        } else {
          _jpg_buf_len = fb->len;
          _jpg_buf = fb->buf;
        }
      } else {
        // Do the detecting stuff
      }
    }
    // Send the stream boundary
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    }
    // Send part buffer
    if (res == ESP_OK) {
      size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, _jpg_buf_len);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
    }
    // Send jpg buffer
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
    }
    // Get fb
    if (fb) {
      esp_camera_fb_return(fb);
      fb = NULL;
      _jpg_buf = NULL;
    } else if (_jpg_buf) {
      free(_jpg_buf);
      _jpg_buf = NULL;
    }
    // Break if we're not OK
    if (res != ESP_OK) {
      break;
    }

    /* There's some frame time stuff here in the template. Seemed unnecessary so I omitted it.*/
    int64_t fr_end = esp_timer_get_time();
    int64_t frame_time = fr_end - last_frame;
    last_frame = fr_end;
    frame_time /= 1000;
    Serial.printf("MJPG: %uB %ums (%.1ffps)", 
      (uint32_t)(_jpg_buf_len),
      (uint32_t)frame_time, 1000.0 / (uint32_t)frame_time
    );
  }

  last_frame = 0;
  return res;
  
}

void startServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();

  httpd_uri_t index_uri = {
    .uri      = "/",
    .method   = HTTP_GET,
    .handler  = index_handler,
    .user_ctx = NULL
  };

  Serial.printf("Starting web server on port: '%d'\n", config.server_port);
  if (httpd_start(&web_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(web_httpd, &index_uri);
  }
}

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

  // Start the web server
  startServer();

  // Tell user how to connect to server
  Serial.print("Server ready! Use 'http://");
  Serial.print(WiFi.localIP());
  Serial.println("' to connect");
}

void loop() {
  delay(10000);
}
