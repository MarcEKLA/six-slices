// Fonction utilisée par toutes les routes qui modifient la partie :
// 1. on lance l'action du jeu
// 2. on sauvegarde la partie
// 3. on prévient tous les écrans
// 4. on répond avec la nouvelle partie (ou avec l'erreur)

const GameError = require('../game/GameError');
const { saveGame } = require('./storage');

function makeRunAction({ game, sendToAllScreens, save = true }) {
  return function runAction(action) {
    return (req, res) => {
      try {
        const view = action(req.body || {});
        if (save) {
          saveGame(game.state);
        }
        sendToAllScreens(view);
        res.json(view);
      } catch (error) {
        const status = error instanceof GameError ? error.status : 500;
        if (status === 500) {
          console.error(error);
        }
        res.status(status).json({ error: error.message });
      }
    };
  };
}

module.exports = makeRunAction;
