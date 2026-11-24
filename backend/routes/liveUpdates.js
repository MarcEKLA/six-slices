// Mises à jour en direct (Server-Sent Events).
// Chaque écran ouvert se connecte à /api/events.
// Après chaque action, on envoie la nouvelle partie à tous les écrans.

const express = require('express');

function createLiveUpdates(game) {
  const router = express.Router();
  const screens = new Set(); // écrans connectés

  router.get('/events', (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    // on envoie tout de suite l'état actuel
    res.write(`data: ${JSON.stringify(game.view())}\n\n`);
    screens.add(res);

    // petit message toutes les 25 s pour garder la connexion ouverte
    const ping = setInterval(() => res.write(': ping\n\n'), 25000);

    req.on('close', () => {
      clearInterval(ping);
      screens.delete(res);
    });
  });

  function sendToAllScreens(view) {
    const message = `data: ${JSON.stringify(view)}\n\n`;
    for (const screen of screens) {
      screen.write(message);
    }
  }

  return { router, sendToAllScreens };
}

module.exports = createLiveUpdates;
