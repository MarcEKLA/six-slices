// Routes de la partie : /api/game/...
// Chaque route appelle une méthode de la classe Game (backend/game/Game.js).

const express = require('express');

function createGameRoutes(game, runAction) {
  const router = express.Router();

  // Voir la partie
  router.get('/', (req, res) => {
    res.json(game.view());
  });

  // Nouvelle partie : { players: ["Ana", "Bob"], timerSeconds: 30 }
  router.post('/', runAction((body) => game.newGame(body.players, { timerSeconds: body.timerSeconds })));

  // Question : { level: "newbie" | "junior" | "expert", correct: true/false }
  router.post('/answer', runAction((body) => game.answer(body)));

  // Mission au QG : { category: "dev", success: true/false }
  router.post('/mission', runAction((body) => game.mission(body)));

  // Hack Alert! : { correct: true } ou { correct: false, stolen: "dev" } ou { correct: false, blocked: true }
  router.post('/hack', runAction((body) => game.hackAlert(body)));

  // Dépenser 3 XP : { bonus: "reroll" | "change" }
  router.post('/spend', runAction((body) => game.spend(body)));

  // Question finale : { playerId: "p1", correct: true/false }
  router.post('/final', runAction((body) => game.final(body)));

  // Joueur suivant
  router.post('/next-turn', runAction(() => game.nextTurn()));

  // Annuler la dernière action
  router.post('/undo', runAction(() => game.undo()));

  // Corrections à la main
  router.post('/xp', runAction((body) => game.adjustXp(body)));       // { playerId: "p1", delta: -1 }
  router.post('/slice', runAction((body) => game.setSlice(body)));    // { playerId: "p1", category: "dev", owned: true }

  return router;
}

module.exports = createGameRoutes;
