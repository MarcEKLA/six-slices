// Tous les appels au serveur (dossier backend)

async function request(method, url, body) {
  const options = { method };
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Server error (${response.status})`);
  }
  return data;
}

export const api = {
  // Infos
  getConfig: () => request('GET', '/api/config'),
  getGame: () => request('GET', '/api/game'),

  // Partie
  newGame: (players, timerSeconds) => request('POST', '/api/game', { players, timerSeconds }),
  answer: (level, correct) => request('POST', '/api/game/answer', { level, correct }),
  mission: (category, success) => request('POST', '/api/game/mission', { category, success }),
  hackAlert: (body) => request('POST', '/api/game/hack', body),
  spendXp: (bonus) => request('POST', '/api/game/spend', { bonus }),
  finalQuestion: (playerId, correct) => request('POST', '/api/game/final', { playerId, correct }),
  nextTurn: () => request('POST', '/api/game/next-turn'),
  undo: () => request('POST', '/api/game/undo'),

  // Corrections à la main
  changeXp: (playerId, delta) => request('POST', '/api/game/xp', { playerId, delta }),
  setSlice: (playerId, category, owned) => request('POST', '/api/game/slice', { playerId, category, owned }),

  // Timer
  startTimer: () => request('POST', '/api/timer/start'),
  pauseTimer: () => request('POST', '/api/timer/pause'),
  resetTimer: () => request('POST', '/api/timer/reset'),
};

// Écoute les changements en direct (quand un autre écran fait une action)
export function listenToLiveUpdates(onGame, onConnectionChange) {
  const source = new EventSource('/api/events');
  source.onopen = () => onConnectionChange(true);
  source.onerror = () => onConnectionChange(false);
  source.onmessage = (event) => {
    onConnectionChange(true);
    onGame(JSON.parse(event.data));
  };
}
