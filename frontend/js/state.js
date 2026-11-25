// Données partagées par tous les fichiers JS du site.
// - config : les règles envoyées par le serveur (GET /api/config)
// - game   : la partie en cours (envoyée par le serveur après chaque action)
// - les choix faits à l'écran (niveau choisi, catégorie de la mission)

export const state = {
  config: null,
  game: null,
  clockOffset: 0, // différence entre l'heure du serveur et celle de l'écran
  chosenLevel: 'newbie',
  chosenMissionCategory: null,
};

// Fonctions appelées à chaque fois que la partie change
const listeners = [];

export function onGameChange(callback) {
  listeners.push(callback);
}

export function setGame(game) {
  state.game = game;
  state.clockOffset = game.timer.serverNow - Date.now();
  for (const callback of listeners) {
    callback(game);
  }
}

export function getCurrentPlayer() {
  if (!state.game) return null;
  return state.game.players.find((player) => player.id === state.game.currentPlayerId) || null;
}

export function getPlayerIndex(player) {
  return state.game.players.findIndex((p) => p.id === player.id);
}
