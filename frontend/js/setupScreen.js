// Écran de départ : on écrit le nom des joueurs et on lance la partie

import { api } from './api.js';
import { state, setGame } from './state.js';
import { $, $$, escapeHtml } from './utils.js';
import { plateImage } from './components.js';

export function showSetupScreen() {
  const game = state.game;
  const names = game && game.players.length > 0 ? game.players.map((p) => p.name) : ['', ''];

  $('#nameList').innerHTML = '';
  names.forEach((name) => addPlayerRow(name));
  $('#timerSeconds').value = game ? game.timer.duration : state.config.timerSeconds;

  $('#setup').hidden = false;
  $('#game').hidden = true;
  $('#winner').hidden = true;
  $('#nameList input').focus();
}

export function isSetupScreenVisible() {
  return !$('#setup').hidden;
}

function addPlayerRow(name = '') {
  const list = $('#nameList');
  if (list.children.length >= state.config.maxPlayers) return;

  const row = document.createElement('li');
  row.innerHTML = `
    <span class="dot"></span>
    <input type="text" maxlength="24" placeholder="Player or team name" value="${escapeHtml(name)}" aria-label="Player name">
    <button type="button" class="remove" aria-label="Remove this player">Remove</button>`;

  row.querySelector('.remove').addEventListener('click', () => {
    if (list.children.length > state.config.minPlayers) {
      row.remove();
      updatePlates();
    }
  });

  list.appendChild(row);
  updatePlates();
}

// Affiche le gâteau de chaque joueur à côté de son nom
function updatePlates() {
  const plates = state.config.plates;
  $$('#nameList li').forEach((row, i) => {
    row.querySelector('.dot').innerHTML = plateImage(plates[i % plates.length]);
  });
  $('#addPlayer').disabled = $('#nameList').children.length >= state.config.maxPlayers;
}

async function startGame(event) {
  event.preventDefault();
  const names = $$('#nameList input').map((input) => input.value.trim()).filter((name) => name !== '');

  if (names.length < state.config.minPlayers) {
    $('#setupError').textContent = `Enter at least ${state.config.minPlayers} names.`;
    return;
  }
  $('#setupError').textContent = '';

  try {
    const game = await api.newGame(names, Number($('#timerSeconds').value));
    setGame(game);
  } catch (error) {
    $('#setupError').textContent = error.message;
  }
}

export function initSetupScreen() {
  $('#setupForm').addEventListener('submit', startGame);
  $('#addPlayer').addEventListener('click', () => addPlayerRow());
  $('#newGameBtn').addEventListener('click', showSetupScreen);
  $('#winnerNew').addEventListener('click', showSetupScreen);
}
