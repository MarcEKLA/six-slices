// Le timer de 30 secondes (colonne de droite)
// Le serveur donne l'heure de départ, l'écran calcule le temps restant
// plusieurs fois par seconde pour que l'anneau bouge en douceur.

import { api } from './api.js';
import { state } from './state.js';
import { $, doAction, showMessage } from './utils.js';

const RING_LENGTH = 2 * Math.PI * 52; // périmètre du cercle (r = 52 dans le HTML)
let lastBeep = null; // pour ne biper qu'une fois par tour

function getRemainingMs() {
  const timer = state.game.timer;
  if (timer.status !== 'running') {
    return timer.remainingMs;
  }
  const serverNow = Date.now() + state.clockOffset;
  return Math.max(0, timer.remainingMs - (serverNow - timer.serverNow));
}

function updateTimerDisplay() {
  const gameIsVisible = state.game && !$('#game').hidden;

  if (gameIsVisible) {
    const timer = state.game.timer;
    const remainingMs = getRemainingMs();
    const seconds = Math.ceil(remainingMs / 1000);
    const isRunning = timer.status === 'running';
    const isFinished = timer.status === 'finished' || (isRunning && remainingMs === 0);

    $('#timerValue').textContent = seconds;
    $('#timerRing').style.strokeDashoffset = String(RING_LENGTH * (1 - remainingMs / (timer.duration * 1000)));
    $('#timer').classList.toggle('is-low', isRunning && !isFinished && seconds <= 5);
    $('#timer').classList.toggle('is-done', isFinished);

    if (isRunning && !isFinished) {
      $('#timerToggle').textContent = 'Pause';
    } else if (isFinished) {
      $('#timerToggle').textContent = 'Restart';
    } else {
      $('#timerToggle').textContent = 'Start';
    }

    // Fin du temps : bip + message (une seule fois)
    const beepId = `${state.game.turn}-${timer.startedAt}`;
    if (isFinished && isRunning && lastBeep !== beepId) {
      lastBeep = beepId;
      playBeep();
      showMessage('Time is up!');
    }
  }

  requestAnimationFrame(updateTimerDisplay);
}

// 3 petits bips avec le son du navigateur
function playBeep() {
  try {
    const audio = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((delay, i) => {
      const sound = audio.createOscillator();
      const volume = audio.createGain();
      sound.type = 'square';
      sound.frequency.value = i === 2 ? 660 : 880;
      volume.gain.setValueAtTime(0.08, audio.currentTime + delay);
      volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + delay + 0.2);
      sound.connect(volume).connect(audio.destination);
      sound.start(audio.currentTime + delay);
      sound.stop(audio.currentTime + delay + 0.22);
    });
  } catch (error) {
    // pas de son disponible : tant pis
  }
}

export function startOrPauseTimer() {
  const isRunning = state.game.timer.status === 'running';
  doAction(isRunning ? api.pauseTimer() : api.startTimer());
}

export function initTimer() {
  $('#timerRing').style.strokeDasharray = String(RING_LENGTH);
  $('#timerToggle').addEventListener('click', startOrPauseTimer);
  $('#timerReset').addEventListener('click', () => doAction(api.resetTimer()));
  requestAnimationFrame(updateTimerDisplay);
}
