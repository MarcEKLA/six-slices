// Routes du timer : /api/timer/start, /pause, /reset

const express = require('express');

function createTimerRoutes(game, runAction) {
  const router = express.Router();

  router.post('/start', runAction(() => game.startTimer()));
  router.post('/pause', runAction(() => game.pauseTimer()));
  router.post('/reset', runAction(() => game.resetTimer()));

  return router;
}

module.exports = createTimerRoutes;
