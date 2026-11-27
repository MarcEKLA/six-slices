// Petites fonctions utiles partout

import { setGame } from './state.js';

// Raccourcis pour trouver des éléments dans la page
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => [...document.querySelectorAll(selector)];

// Empêche un nom de joueur de casser le HTML (ex : "<b>Bob</b>")
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Petit message en bas de l'écran
let messageTimer = null;
export function showMessage(text, isError = false) {
  const box = $('#toast');
  box.textContent = text;
  box.classList.toggle('is-error', isError);
  box.hidden = false;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    box.hidden = true;
  }, 2600);
}

// Lance un appel au serveur, met à jour l'écran, et affiche un message
// Renvoie true si l'action a marché, false sinon
export async function doAction(apiCall, successMessage) {
 try {
 const game = await apiCall;
 setGame(game);
 if (successMessage) {
 showMessage(successMessage);
 }
 return true;
 } catch (error) {
 showMessage(error.message, true);
 return false;
 }
}
