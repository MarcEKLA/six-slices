// Point d'entrée du serveur SIX Slices.
// Lancer avec : npm start  →  http://localhost:3000

const path = require('path');
const express = require('express');

const Game = require('./game/Game');
const { loadGame } = require('./utils/storage');
const makeRunAction = require('./utils/runAction');
const createLiveUpdates = require('./routes/liveUpdates');
const configRoutes = require('./routes/configRoutes');
const createGameRoutes = require('./routes/gameRoutes');
const createTimerRoutes = require('./routes/timerRoutes');

const PORT = process.env.PORT || 3000;
const FRONTEND_FOLDER = path.join(__dirname, '..', 'frontend');

function createApp({ game = new Game({ state: loadGame() }), save = true } = {}) {
  const app = express();
  app.use(express.json());

  const liveUpdates = createLiveUpdates(game);
  const runAction = makeRunAction({ game, sendToAllScreens: liveUpdates.sendToAllScreens, save });

  // API
  app.use('/api', configRoutes);
  app.use('/api', liveUpdates.router);
  app.use('/api/game', createGameRoutes(game, runAction));
  app.use('/api/timer', createTimerRoutes(game, runAction));

  // Site (dossier frontend)
  app.use(express.static(FRONTEND_FOLDER));

  return app;
}

// On démarre le serveur seulement si on lance ce fichier (pas dans les tests)
if (require.main === module) {
  createApp().listen(PORT, () => {
    console.log(`SIX Slices : http://localhost:${PORT}`);
  });
}

module.exports = createApp;
