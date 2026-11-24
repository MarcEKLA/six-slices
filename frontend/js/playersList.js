// Colonne de gauche : tableau des XP de chaque joueur
// On peut aussi corriger à la main (+1 / -1 XP, clic sur une part).

import { api } from './api.js';
import { state } from './state.js';
import { $, escapeHtml, doAction } from './utils.js';
import { plateImage, sliceImage, plateOfPlayer } from './components.js';

export function showPlayersList() {
  const game = state.game;
  const categories = state.config.categories;

  // Position de chaque joueur dans le classement
  const rankOf = {};
  game.ranking.forEach((playerId, i) => {
    rankOf[playerId] = i + 1;
  });

  $('#playerList').innerHTML = game.players.map((player, i) => {
    const isCurrent = player.id === game.currentPlayerId;
    const name = escapeHtml(player.name);

    const slicesHtml = categories.map((category) => {
      const owned = player.slices[category.id];
      return `
        <button type="button" class="slice-btn" data-player="${player.id}" data-category="${category.id}"
          aria-pressed="${owned}" aria-label="${category.name} slice of ${name}"
          title="${category.name}: ${owned ? 'won (click to remove)' : 'not won (click to add)'}">
          ${sliceImage(category.id)}
        </button>`;
    }).join('');

    return `
      <li class="player ${isCurrent ? 'is-current' : ''}" ${isCurrent ? 'aria-current="true"' : ''}>
        <span class="avatar">${plateImage(plateOfPlayer(player, i))}</span>
        <span class="name">${name}</span>
        <span class="xp"><strong>${player.xp}</strong><span>XP</span></span>
        <span class="rank muted">#${rankOf[player.id]} · ${player.slicesCount}/6 slices</span>
        <span class="slices">${slicesHtml}</span>
        <span class="adjust">
          <button type="button" data-xp="-1" data-player="${player.id}" aria-label="Remove 1 XP from ${name}">−1 XP</button>
          <button type="button" data-xp="1" data-player="${player.id}" aria-label="Add 1 XP to ${name}">+1 XP</button>
        </span>
      </li>`;
  }).join('');
}

export function initPlayersList() {
  $('#playerList').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const playerId = button.dataset.player;

    // Bouton +1 / -1 XP
    if (button.dataset.xp) {
      doAction(api.changeXp(playerId, Number(button.dataset.xp)));
      return;
    }

    // Clic sur une part : on l'ajoute ou on l'enlève
    if (button.dataset.category) {
      const player = state.game.players.find((p) => p.id === playerId);
      const category = button.dataset.category;
      doAction(api.setSlice(playerId, category, !player.slices[category]));
    }
  });
}
