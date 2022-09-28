#ifndef CONTROLLER_H_
#define CONTROLLER_H_

#include <stdint.h>
#include <Arduino.h>
#include <Servo.h>

#define PIN_LASER 14
#define PIN_PIT 12
#define PIN_YAW 2
#define MAX_UPS 100
#define MAX_ANG_VELOCITY (MAX_UPS / 1000.0) // Units per millisecond
#define SERVO_UPDATE_INTERVAL 50

// Servos
Servo servo_pit;
Servo servo_yaw;
uint32_t servo_pitx, servo_pity;
uint32_t servo_yawx, servo_yawy;

typedef enum laser_mode_enum {
  LASER_OFF,
  LASER_ON,
  LASER_TOGGLE
} laser_mode_e;

typedef enum servo_mode_enum {
  SERVO_VELOCITY,
  SERVO_SET,
  SERVO_OFFSET,
} servo_mode_e;

struct servo_data_struct {
  double posx, posy;
  int8_t velx, vely;
  servo_mode_e mode;
  uint32_t last_update;
};
servo_data_struct servo_data;

void controller_setLaserState(laser_mode_e mode) {
  static bool is_on = false;
  switch (mode) {
    case LASER_OFF:
      is_on = false;
      break;
    case LASER_ON:
      is_on = true;
      break;
    case LASER_TOGGLE:
      is_on = !is_on;
      break;
    default:
      break;
  }
  digitalWrite(PIN_LASER, is_on);
}

void controller_controlServo(servo_mode_e mode, int8_t x, int8_t y) {
  servo_data.mode = mode;
  switch (mode) {
    case SERVO_VELOCITY:
      servo_data.velx = x;
      servo_data.vely = y;
      break;
    case SERVO_SET:
      servo_data.velx = 0;
      servo_data.vely = 0;
      servo_data.posx = x;
      servo_data.posy = y;
      break;
    case SERVO_OFFSET:
      servo_data.velx  = 0;
      servo_data.vely  = 0;
      servo_data.posx += x;
      servo_data.posy += y;
      break;
    default:
      break;
  }
}

void controller_init() {
  // Attach servos
  servo_pit.attach(12, Servo::CHANNEL_NOT_ATTACHED, -100, 100, 600, 2400);
  servo_yaw.attach( 2, Servo::CHANNEL_NOT_ATTACHED, -100, 100, 600, 2400);
  // Initialize laser
  pinMode(PIN_LASER, OUTPUT);
  digitalWrite(PIN_LASER, LOW);
  // Initialize servo data
  servo_data = {
    .posx = 0,
    .posy = 0,
    .velx = 0,
    .vely = 0,
    .mode = SERVO_SET,
    .last_update = 0,
  };
}

void controller_updateServoPos(void) {
  uint32_t curr_update = millis();
  if (servo_data.last_update + SERVO_UPDATE_INTERVAL >= curr_update) {
    return;
  }

  uint32_t delta = curr_update - servo_data.last_update;
  if (servo_data.mode == SERVO_VELOCITY) {
    servo_data.posx = max(min(servo_data.posx + servo_data.velx * delta * MAX_ANG_VELOCITY, 100.0), -100.0);
    servo_data.posy = max(min(servo_data.posy + servo_data.vely * delta * MAX_ANG_VELOCITY, 100.0), -100.0);
  }

  servo_data.last_update = curr_update;
  servo_yaw.write(servo_data.posx);
  servo_pit.write(servo_data.posy);
}

#endif /* CONTROLLER_H_ */