// Fichier principal du site : il démarre tout.
//
// Organisation des fichiers JS :
//   main.js         démarrage + mise à jour de l'écran
//   api.js          appels au serveur
//   state.js        données partagées (règles, partie en cours)
//   utils.js        petites fonctions utiles
//   components.js   images des designers (gâteaux, parts, bonbons)
//   setupScreen.js  écran de départ
//   playersList.js  tableau des XP (gauche)
//   board.js        plateau (milieu)
//   timer.js        timer de 30 s (droite)
//   turnActions.js  actions du tour (droite)

import { api, listenToLiveUpdates } from './api.js';
import { state, setGame, onGameChange } from './state.js';
import { $, escapeHtml, doAction } from './utils.js';
import { plateImage, plateOfPlayer } from './components.js';
import { initSetupScreen, showSetupScreen, isSetupScreenVisible } from './setupScreen.js';
import { initPlayersList, showPlayersList } from './playersList.js';
import { showBoard } from './board.js';
import { initTimer, startOrPauseTimer } from './timer.js';
import { initTurnActions, showTurn } from './turnActions.js';

// Met à jour tout l'écran quand la partie change
function updateScreen(game) {
  if (game.status === 'setup') {
    if (!isSetupScreenVisible()) showSetupScreen();
    return;
  }

  $('#setup').hidden = true;
  $('#game').hidden = false;

  showPlayersList();
  showTurn();
  showBoard();
  showGameLog();
  showWinner();

  $('#undoBtn').disabled = !game.canUndo;
}

function showGameLog() {
  $('#logList').innerHTML = state.game.log.map((line) => `<li>${escapeHtml(line.text)}</li>`).join('');
}

function showWinner() {
  const game = state.game;
  const winner = game.players.find((p) => p.id === game.winnerId);
  $('#winner').hidden = !winner;
  if (winner) {
    $('#winnerName').textContent = winner.name;
    $('#winnerPlate').innerHTML = plateImage(plateOfPlayer(winner, game.players.indexOf(winner)));
  }
}

// Raccourcis clavier : Espace = timer, N = joueur suivant
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    if (!state.game || $('#game').hidden || event.target.matches('input, textarea')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      startOrPauseTimer();
    }
    if (event.key === 'n' || event.key === 'N') {
      $('#nextBtn').click();
    }
  });
}

async function start() {
  try {
    state.config = await api.getConfig();
    onGameChange(updateScreen);
    setGame(await api.getGame());
  } catch (error) {
    $('#offline').hidden = false;
    $('#offline').textContent = 'The server is not running. Start it with "npm start" in the backend folder.';
    return;
  }

  initSetupScreen();
  initPlayersList();
  initTurnActions();
  initTimer();
  initKeyboardShortcuts();
  $('#undoBtn').addEventListener('click', () => doAction(api.undo(), 'Last action undone'));

  listenToLiveUpdates(setGame, (connected) => {
    $('#offline').hidden = connected;
  });
}

start();
