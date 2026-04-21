const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusText = document.getElementById('statusText');
const repText = document.getElementById('repText');

const parTimeInput = document.getElementById('parTime');
const randomMinInput = document.getElementById('randomMin');
const randomMaxInput = document.getElementById('randomMax');
const repetitionsInput = document.getElementById('repetitions');
const restTimeInput = document.getElementById('restTime');

let isRunning = false;
let audioContext;
let cancelRun = null;
let pendingTimeouts = [];
let activeOscillators = [];

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    return audioContext.resume();
  }

  return Promise.resolve();
}

function setUiRunning(running) {
  startBtn.disabled = running;
  stopBtn.disabled = !running;
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function scheduleTone(startAt, durationSeconds, frequency) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0.001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + durationSeconds);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + durationSeconds);

  activeOscillators.push(oscillator);
  oscillator.onended = () => {
    activeOscillators = activeOscillators.filter((node) => node !== oscillator);
  };
}

function clearPendingTimeouts() {
  for (const timeoutId of pendingTimeouts) {
    clearTimeout(timeoutId);
  }
  pendingTimeouts = [];
}

function stopActiveOscillators() {
  for (const oscillator of activeOscillators) {
    try {
      oscillator.stop();
    } catch (_) {
      // no-op when oscillator has already ended
    }
  }
  activeOscillators = [];
}

function sleepCancelable(ms, isCancelled) {
  return new Promise((resolve, reject) => {
    if (isCancelled()) {
      reject(new Error('Timer stopped.'));
      return;
    }

    const timeoutId = setTimeout(() => {
      pendingTimeouts = pendingTimeouts.filter((id) => id !== timeoutId);
      if (isCancelled()) {
        reject(new Error('Timer stopped.'));
      } else {
        resolve();
      }
    }, ms);

    pendingTimeouts.push(timeoutId);
  });
}

function validateInputs() {
  const parTime = Number(parTimeInput.value);
  const randomMin = Number(randomMinInput.value);
  const randomMax = Number(randomMaxInput.value);
  const repetitions = Number(repetitionsInput.value);
  const restTime = Number(restTimeInput.value);

  if (!Number.isFinite(parTime) || parTime <= 0) {
    throw new Error('Par time must be greater than 0.');
  }
  if (!Number.isFinite(randomMin) || randomMin < 0) {
    throw new Error('Random start min must be 0 or greater.');
  }
  if (!Number.isFinite(randomMax) || randomMax < randomMin) {
    throw new Error('Random start max must be greater than or equal to min.');
  }
  if (!Number.isInteger(repetitions) || repetitions < 1) {
    throw new Error('Repetitions must be an integer of 1 or more.');
  }
  if (!Number.isFinite(restTime) || restTime < 0) {
    throw new Error('Rest time must be 0 or greater.');
  }

  return { parTime, randomMin, randomMax, repetitions, restTime };
}

async function runTimer() {
  const config = validateInputs();
  await ensureAudioContext();

  isRunning = true;
  let cancelled = false;
  cancelRun = () => {
    cancelled = true;
    clearPendingTimeouts();
    stopActiveOscillators();
  };

  setUiRunning(true);

  try {
    for (let rep = 1; rep <= config.repetitions; rep += 1) {
      if (cancelled) throw new Error('Timer stopped.');

      const startDelay = randomInRange(config.randomMin, config.randomMax);
      repText.textContent = `Rep ${rep} of ${config.repetitions}`;
      statusText.textContent = `Waiting ${startDelay.toFixed(2)}s for random start...`;

      await sleepCancelable(startDelay * 1000, () => cancelled);

      const startAt = audioContext.currentTime + 0.02;
      scheduleTone(startAt, 0.3, 950);
      scheduleTone(startAt + config.parTime, 0.25, 650);

      statusText.textContent = 'START tone';
      await sleepCancelable(config.parTime * 1000, () => cancelled);
      statusText.textContent = `PAR reached (${config.parTime.toFixed(2)}s)`;

      if (rep < config.repetitions) {
        await sleepCancelable(config.restTime * 1000, () => cancelled);
      }
    }

    statusText.textContent = 'Complete.';
  } catch (error) {
    statusText.textContent = error.message === 'Timer stopped.' ? 'Stopped.' : error.message;
  } finally {
    clearPendingTimeouts();
    stopActiveOscillators();
    repText.textContent = '';
    isRunning = false;
    cancelRun = null;
    setUiRunning(false);
  }
}

startBtn.addEventListener('click', () => {
  if (!isRunning) {
    runTimer();
  }
});

stopBtn.addEventListener('click', () => {
  if (cancelRun) {
    cancelRun();
  }
});
