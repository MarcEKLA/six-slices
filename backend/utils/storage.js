// Sauvegarde de la partie dans un fichier JSON (backend/data/game.json).
// Comme ça, si on relance le serveur, la partie reprend où elle en était.

const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'game.json');

function loadGame() {
  try {
    const text = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    return null; // pas encore de sauvegarde
  }
}

function saveGame(state) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

module.exports = { loadGame, saveGame };
