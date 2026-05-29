/*
  Para Talk Relay Receiver

  Use this sketch on the second Arduino, the one connected only to the relay.
  The Para Talk web app sends "RELAY_ON" over USB serial when the user selects
  the Call caretaker box.

  Works with common Arduino boards such as UNO, Nano, Mega, UNO R4 Minima,
  and UNO R4 WiFi.
*/

#define RELAY_PIN 7
#define LED_PIN LED_BUILTIN

const unsigned long RELAY_ON_MS = 1500;
const unsigned long BAUD_RATE = 115200;

// Many relay modules turn on when the pin is LOW. Set this to true if needed.
const bool RELAY_ACTIVE_LOW = false;

String serialLine = "";

void setRelay(bool on) {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(RELAY_PIN, on ? LOW : HIGH);
  } else {
    digitalWrite(RELAY_PIN, on ? HIGH : LOW);
  }

  digitalWrite(LED_PIN, on ? HIGH : LOW);
}

void pulseRelay() {
  setRelay(true);
  delay(RELAY_ON_MS);
  setRelay(false);
}

void handleCommand(String command) {
  command.trim();

  if (command == "RELAY_ON") {
    Serial.println("Relay ON pulse");
    pulseRelay();
  } else if (command == "TEST") {
    Serial.println("Relay test pulse");
    pulseRelay();
  } else if (command.length() > 0) {
    Serial.print("Unknown command: ");
    Serial.println(command);
  }
}

void setup() {
  Serial.begin(BAUD_RATE);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  setRelay(false);

  Serial.println("Para Talk relay receiver ready");
  Serial.println("Send RELAY_ON to pulse relay");
}

void loop() {
  while (Serial.available() > 0) {
    char incoming = (char)Serial.read();

    if (incoming == '\n') {
      handleCommand(serialLine);
      serialLine = "";
    } else if (incoming != '\r') {
      serialLine += incoming;
    }
  }
}
