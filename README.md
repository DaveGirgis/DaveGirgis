# Dry Fire Par Timer (Static Website)

This repository contains a static web app for dry fire practice.

## Features

- Start tone duration: **0.30 seconds**.
- Par tone duration: **0.25 seconds**.
- Configurable random start window (e.g., 3 to 5 seconds).
- Configurable par time.
- Configurable repetitions and rest between reps.
- Responsive Start/Stop controls (Stop interrupts waiting and active tones immediately).

## Tech Stack

- **HTML** for structure
- **CSS** for styling
- **Vanilla JavaScript** for timer logic and tone generation (Web Audio API)

No backend is required.

## Run Locally

Open `index.html` directly in a browser, or serve it with a simple local server:

```bash
python3 -m http.server 8000
```

Then browse to `http://localhost:8000`.
