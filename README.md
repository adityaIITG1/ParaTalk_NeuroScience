# Para Talk

Para Talk is a Next.js communication board for single-switch or EOG users. It can be deployed to Vercel, speaks selected messages in the browser, starts a built-in Dino game, and sends a serial relay command to the user's own Arduino.

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Reliable Girl Voice for Indian Languages

Browser speech voices are limited by the user's laptop/browser. If Bengali, Tamil, Marathi, Telugu, or other languages are missing, Chrome or Edge falls back to English or Hindi.

For reliable female Indian neural voices, configure Azure Speech:

```bash
copy .env.example .env.local
```

Then set:

```text
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=centralindia
```

Restart the app after changing `.env.local`.

When Azure Speech is configured, Para Talk uses female neural voices where available, including Hindi Swara, Bengali Tanishaa, Tamil Pallavi, Telugu Shruti, Marathi Aarohi, Gujarati Dhwani, Kannada Sapna, Malayalam Sobhana, Nepali Hemkala, and Urdu Uzma. Punjabi is available in Azure but currently does not have a female `pa-IN` voice in the voice map, so the app falls back to browser speech for Punjabi.

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Use the default Next.js settings.
4. Deploy.

Web Serial works on secure origins, so a Vercel `https://` deployment can connect to an Arduino plugged into the user's computer. Users should open the app in desktop Chrome or Edge.

## User Controls

- Press `Space` once to move to the next communication box.
- Stop pressing `Space` for about 2 seconds to select the highlighted box.
- The selected message is spoken by the browser.
- Mouse or touch clicks also select a box directly.
- Selecting `Play game` opens the built-in Dino game. In game mode, `Space` jumps.
- Use `Care` for needs and health messages.
- Use `Normal Talk` when friends or family visit. It includes phrases like `How are you?`, `What are you doing?`, and `How is your day going?`.
- Use the `Voice` selector to choose Indian language speech, including English India, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Odia, Assamese, Nepali, and more.

## Two Arduino Setup

Use two separate Arduino boards:

- Arduino 1: EOG controller. Upload [arduino/eog_keyboard/eog_keyboard.ino](arduino/eog_keyboard/eog_keyboard.ino) to this board. It converts eye blinks into the `Space` key.
- Arduino 2: Relay receiver. Upload [arduino/relay_receiver/relay_receiver.ino](arduino/relay_receiver/relay_receiver.ino) to this board.

The EOG Arduino does not need to connect to the app through Web Serial. It behaves like a keyboard. The relay Arduino must be selected in the app after clicking `Connect relay`.

## EOG Keyboard Setup

The EOG keyboard sketch is for Arduino UNO R4 Minima or UNO R4 WiFi because it uses `Keyboard.h` USB HID support.

Default EOG input:

```text
EOG signal -> Arduino A0
GND        -> Arduino GND
```

Upload the sketch, then click inside the Para Talk browser page. Every detected blink sends one `Space` key press. The app uses that `Space` key to move through boxes, and in game mode it jumps.

If blinking does not trigger, or triggers too often, tune these values in the EOG sketch:

```cpp
const int BlinkLowerThreshold = 30;
const int BlinkUpperThreshold = 50;
```

## Relay Setup

The `Call caretaker` box sends this serial command to the connected Arduino:

```text
RELAY_ON
```

Wire the relay module signal pin to Arduino pin `7` by default:

```text
Relay VCC  -> Arduino 5V
Relay GND  -> Arduino GND
Relay IN   -> Arduino D7
```

If your relay turns on immediately and turns off when called, open the sketch and change:

```cpp
const bool RELAY_ACTIVE_LOW = false;
```

to:

```cpp
const bool RELAY_ACTIVE_LOW = true;
```

In the app, click `Connect relay`, choose the Arduino port, then select `Call caretaker`.
