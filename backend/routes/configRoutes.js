// GET /api/config : les règles du jeu pour le front
// GET /api/health : pour vérifier que le serveur tourne

const express = require('express');
const rules = require('../config/rules');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

router.get('/config', (req, res) => {
  res.json({
    name: 'SIX Slices',
    palette: rules.PALETTE,
    categories: rules.CATEGORIES,
    levels: rules.LEVELS,
    bonuses: rules.BONUSES,
    hackAlertXp: rules.HACK_ALERT_XP,
    timerSeconds: rules.TIMER_SECONDS,
    minPlayers: rules.MIN_PLAYERS,
    maxPlayers: rules.MAX_PLAYERS,
    plates: rules.PLAYER_PLATES,
  });
});

module.exports = router;
