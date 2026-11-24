// Colonne du milieu : le plateau.
// Le plateau des designers n'est pas encore prêt.
// En attendant, on montre le gâteau du joueur en cours et les parts qu'il a gagnées.
// Quand le plateau arrive, c'est ce fichier qu'il faut modifier.

import { state, getCurrentPlayer, getPlayerIndex } from './state.js';
import { $, escapeHtml } from './utils.js';
import { plateImage, sliceImage, plateOfPlayer } from './components.js';

export function showBoard() {
  const board = $('#board');
  const player = getCurrentPlayer();
  if (!player) {
    board.innerHTML = '';
    return;
  }

  const name = escapeHtml(player.name);
  const slicesHtml = state.config.categories.map((category) => {
    const won = player.slices[category.id];
    return `
      <li class="${won ? 'is-won' : ''}">
        ${sliceImage(category.id, `${category.name}: ${won ? 'won' : 'not yet'}`)}
        <span>${category.name}</span>
      </li>`;
  }).join('');

  board.innerHTML = `
    <p class="board-player display">${name}</p>
    <div class="board-plate">${plateImage(plateOfPlayer(player, getPlayerIndex(player)), `${name}'s cake`)}</div>
    <ul class="board-slices" aria-label="Slices won: ${player.slicesCount} of 6">${slicesHtml}</ul>`;
}
