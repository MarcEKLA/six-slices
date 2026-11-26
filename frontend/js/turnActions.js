// Colonne de droite : le joueur en cours et ce qui lui arrive pendant son tour
// Onglets : Question / HQ mission / Hack Alert! / XP bonus
// + question finale (quand le joueur a les 6 parts) + bouton "Next player"
 
import { api } from './api.js';
import { state, getCurrentPlayer } from './state.js';
import { $, $$, doAction, showMessage } from './utils.js';
import { sliceImage, candyImage } from './components.js';
import { launchConfetti } from './confetti.js';
 
/* ---------- Affichage ---------- */
 
export function showTurn() {
  const player = getCurrentPlayer();
  const config = state.config;
  const gameIsOver = state.game.status === 'finished';
 
  // Nom du joueur + couleur de fond de la carte
  $('#turnName').textContent = player ? player.name : '–';
  $('#turnCard').style.background = player ? `color-mix(in srgb, ${player.color} 35%, white)` : '';
 
  // Onglet Question : choix du niveau (bonbons 1, 2, 3)
  $('#levelPicker').innerHTML = config.levels.map((level) => `
<button type="button" class="chip" data-level="${level.id}" aria-pressed="${level.id === state.chosenLevel}">
      ${candyImage(level.xp)}
      ${level.name}<small>+${level.xp} XP</small>
</button>`).join('');
 
  // Onglet Mission : choix du QG (on ne peut pas regagner une part déjà gagnée)
  $('#missionPicker').innerHTML = config.categories.map((category) => {
    const alreadyWon = player && player.slices[category.id];
    return `
<button type="button" class="chip" data-mission-category="${category.id}"
        aria-pressed="${category.id === state.chosenMissionCategory}" ${alreadyWon ? 'disabled title="Already won"' : ''}>
        ${sliceImage(category.id)}<span>${category.name}</span>
</button>`;
  }).join('');
 
  // Onglet Hack Alert : les parts que le hacker peut voler
  $('#stealPicker').innerHTML = config.categories.map((category) => {
    const owned = player && player.slices[category.id];
    return `
<button type="button" class="chip" data-steal="${category.id}" ${owned ? '' : 'disabled'}>
        ${sliceImage(category.id)}<span>${category.name}</span>
</button>`;
  }).join('');
 
  // Les bonus coûtent 3 XP
  const hasEnoughXp = player && player.xp >= 3;
  $('#blockBtn').disabled = !hasEnoughXp;
  $$('[data-bonus]').forEach((button) => {
    button.disabled = !hasEnoughXp;
  });
 
  // Question finale
  $('#finalBox').hidden = !(player && player.canFinal);
 
  // Partie terminée : plus d'actions possibles
  if (gameIsOver) {
    $$('.actions button').forEach((button) => {
      button.disabled = true;
    });
  }
}
 
/* ---------- Actions ---------- */
 
function answerQuestion(isRight) {
  const message = isRight ? 'Right! Play again.' : 'Wrong: next player.';
  doAction(api.answer(state.chosenLevel, isRight), message).then((ok) => {
    if (ok && isRight) launchConfetti();
  });
}
 
function finishMission(isSuccess) {
  if (!state.chosenMissionCategory) {
    showMessage('Pick the HQ category first.', true);
    return;
  }
  const category = state.chosenMissionCategory;
  state.chosenMissionCategory = null;
  const message = isSuccess ? 'Slice won! Read the Job card aloud.' : 'Mission failed.';
  doAction(api.mission(category, isSuccess), message).then((ok) => {
    if (ok && isSuccess) launchConfetti();
  });
}
 
function hackAlertRight() {
  $('#stealBox').hidden = true;
  doAction(api.hackAlert({ correct: true }), 'Scam spotted! +2 XP').then((ok) => {
    if (ok) launchConfetti();
  });
}
 
function hackAlertWrong() {
  const player = getCurrentPlayer();
  if (player && player.slicesCount > 0) {
    $('#stealBox').hidden = false; // on demande quelle part est volée
  } else {
    doAction(api.hackAlert({ correct: false }), 'No slice to steal this time.');
  }
}
 
function stealSlice(category) {
  $('#stealBox').hidden = true;
  doAction(api.hackAlert({ correct: false, stolen: category }), 'The hacker stole a slice!');
}
 
function blockHacker() {
  $('#stealBox').hidden = true;
  doAction(api.hackAlert({ correct: false, blocked: true }), 'Hacker blocked (−3 XP)');
}
 
function goToNextPlayer() {
  $('#stealBox').hidden = true;
  doAction(api.nextTurn());
}
 
function openTab(tab) {
  $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
  $$('.panel').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tab.dataset.tab;
  });
  $('#stealBox').hidden = true;
}
 
/* ---------- Clics ---------- */
 
export function initTurnActions() {
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => openTab(tab)));
 
  $('.actions').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const data = button.dataset;
 
    if (data.level) {
      state.chosenLevel = data.level;
      showTurn();
    } else if (data.answer) {
      answerQuestion(data.answer === 'right');
    } else if (data.missionCategory) {
      state.chosenMissionCategory = data.missionCategory;
      showTurn();
    } else if (data.mission) {
      finishMission(data.mission === 'success');
    } else if (data.hack === 'right') {
      hackAlertRight();
    } else if (data.hack === 'wrong') {
      hackAlertWrong();
    } else if (data.steal) {
      stealSlice(data.steal);
    } else if (button.id === 'blockBtn') {
      blockHacker();
    } else if (data.bonus) {
      doAction(api.spendXp(data.bonus), 'Bonus used (−3 XP)');
    } else if (data.final) {
      const isRight = data.final === 'right';
      doAction(api.finalQuestion(state.game.currentPlayerId, isRight)).then((ok) => {
        if (ok && isRight) launchConfetti(400); // victoire : encore plus de confettis
      });
    } else if (button.id === 'nextBtn') {
      goToNextPlayer();
    }
  });
}