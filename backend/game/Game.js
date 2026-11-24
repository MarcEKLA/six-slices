// La classe Game contient toute la logique d'une partie :
// joueurs, tours, XP, parts gagnées, timer et bouton "annuler".
// Elle ne connaît rien au serveur web, ce qui permet de la tester facilement.

const crypto = require('crypto');
const rules = require('../config/rules');
const GameError = require('./GameError');

// Petites fonctions pour retrouver un élément par son id
function findLevel(id) {
  return rules.LEVELS.find((level) => level.id === id);
}
function findCategory(id) {
  return rules.CATEGORIES.find((category) => category.id === id);
}
function findBonus(id) {
  return rules.BONUSES.find((bonus) => bonus.id === id);
}

// Au début, un joueur n'a aucune part : { marketing: false, social: false, ... }
function noSlices() {
  const slices = {};
  for (const category of rules.CATEGORIES) {
    slices[category.id] = false;
  }
  return slices;
}

class Game {
  // now : fonction qui donne l'heure (on la remplace dans les tests)
  // state : partie sauvegardée à recharger (ou null)
  constructor({ now = () => Date.now(), state = null } = {}) {
    this.now = now;
    this.history = []; // anciennes versions de la partie, pour "annuler"
    this.state = state || this.emptyState();
  }

  emptyState() {
    return {
      id: null,
      status: 'setup', // 'setup' = pas de partie, 'playing' = en cours, 'finished' = terminée
      players: [],
      currentIndex: 0, // index du joueur dont c'est le tour
      turn: 0,
      timer: {
        duration: rules.TIMER_SECONDS,
        status: 'idle', // 'idle', 'running', 'paused' ou 'finished'
        startedAt: null,
        remainingMs: rules.TIMER_SECONDS * 1000,
      },
      winnerId: null,
      log: [], // historique affiché dans "Game log"
    };
  }

  /* =========================================================
     Outils internes
     ========================================================= */

  // Sauvegarde l'état actuel avant une action (pour pouvoir l'annuler)
  saveForUndo() {
    this.history.push(JSON.stringify(this.state));
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  checkGameIsRunning() {
    if (this.state.status !== 'playing') {
      throw new GameError('No game in progress.', 409);
    }
  }

  currentPlayer() {
    return this.state.players[this.state.currentIndex] || null;
  }

  // Si playerId n'est pas donné, on prend le joueur dont c'est le tour
  getPlayer(playerId) {
    const player = playerId
      ? this.state.players.find((p) => p.id === playerId)
      : this.currentPlayer();
    if (!player) {
      throw new GameError('Unknown player.', 404);
    }
    return player;
  }

  countSlices(player) {
    return Object.values(player.slices).filter((owned) => owned).length;
  }

  addToLog(type, player, text) {
    this.state.log.unshift({
      at: new Date(this.now()).toISOString(),
      type,
      playerId: player ? player.id : null,
      text,
    });
    this.state.log = this.state.log.slice(0, 200);
  }

  // Passe au joueur suivant et remet le timer à zéro
  goToNextPlayer() {
    const nbPlayers = this.state.players.length;
    this.state.currentIndex = (this.state.currentIndex + 1) % nbPlayers;
    this.state.turn += 1;
    this.resetTimer(false);
  }

  /* =========================================================
     Nouvelle partie
     ========================================================= */

  newGame(names, { timerSeconds = rules.TIMER_SECONDS } = {}) {
    if (!Array.isArray(names)) {
      throw new GameError('players must be a list of names.');
    }
    const cleanNames = names.map((name) => String(name || '').trim()).filter((name) => name !== '');
    if (cleanNames.length < rules.MIN_PLAYERS || cleanNames.length > rules.MAX_PLAYERS) {
      throw new GameError(`Between ${rules.MIN_PLAYERS} and ${rules.MAX_PLAYERS} players.`);
    }
    const seconds = Number(timerSeconds);
    if (!Number.isFinite(seconds) || seconds < 5 || seconds > 600) {
      throw new GameError('timerSeconds must be between 5 and 600.');
    }

    this.saveForUndo();
    this.state = this.emptyState();
    this.state.id = crypto.randomUUID();
    this.state.status = 'playing';
    this.state.timer.duration = seconds;
    this.state.timer.remainingMs = seconds * 1000;

    this.state.players = cleanNames.map((name, i) => ({
      id: `p${i + 1}`,
      name: name.slice(0, 24),
      color: rules.PLAYER_COLORS[i % rules.PLAYER_COLORS.length],
      plate: rules.PLAYER_PLATES[i % rules.PLAYER_PLATES.length],
      xp: 0,
      slices: noSlices(),
      stats: { right: 0, wrong: 0, hackRight: 0, hackWrong: 0, spent: 0 },
    }));

    this.addToLog('start', null, `New game: ${cleanNames.join(', ')}`);
    return this.view();
  }

  /* =========================================================
     Actions du jeu
     ========================================================= */

  // Case de couleur : le joueur choisit un niveau et répond.
  // Juste = XP du niveau et il rejoue. Faux = joueur suivant.
  answer({ playerId, level, correct }) {
    this.checkGameIsRunning();
    const chosenLevel = findLevel(level);
    if (!chosenLevel) {
      throw new GameError('level must be newbie, junior or expert.');
    }
    const player = this.getPlayer(playerId);
    this.saveForUndo();

    if (correct) {
      player.xp += chosenLevel.xp;
      player.stats.right += 1;
      this.addToLog('answer', player, `${player.name}: right answer (${chosenLevel.name}) +${chosenLevel.xp} XP, plays again`);
      this.resetTimer(false);
    } else {
      player.stats.wrong += 1;
      this.addToLog('answer', player, `${player.name}: wrong answer (${chosenLevel.name})`);
      this.goToNextPlayer();
    }
    return this.view();
  }

  // QG : mission de 30 secondes. Réussie = le joueur gagne la part de la couleur.
  mission({ playerId, category, success }) {
    this.checkGameIsRunning();
    const chosenCategory = findCategory(category);
    if (!chosenCategory) {
      throw new GameError('Unknown category.');
    }
    const player = this.getPlayer(playerId);
    this.saveForUndo();

    if (success) {
      player.slices[chosenCategory.id] = true;
      this.addToLog('mission', player, `${player.name} wins the ${chosenCategory.name} slice`);
    } else {
      this.addToLog('mission', player, `${player.name} fails the ${chosenCategory.name} mission`);
    }
    this.goToNextPlayer();
    return this.view();
  }

  // Hack Alert! : juste = +2 XP.
  // Faux = le hacker vole une part (stolen), sauf si le joueur le bloque (blocked) pour 3 XP.
  hackAlert({ playerId, correct, stolen = null, blocked = false }) {
    this.checkGameIsRunning();
    const player = this.getPlayer(playerId);
    this.saveForUndo();

    if (correct) {
      player.xp += rules.HACK_ALERT_XP;
      player.stats.hackRight += 1;
      this.addToLog('hack', player, `${player.name} spots the scam +${rules.HACK_ALERT_XP} XP`);
    } else {
      player.stats.hackWrong += 1;

      if (blocked) {
        const cost = findBonus('block').cost;
        if (player.xp < cost) {
          this.undo(); // on remet la partie comme avant
          throw new GameError(`Not enough XP to block the hacker (${cost} needed).`);
        }
        player.xp -= cost;
        player.stats.spent += cost;
        this.addToLog('hack', player, `${player.name} blocks the hacker (−${cost} XP)`);
      } else if (this.countSlices(player) > 0) {
        const stolenCategory = findCategory(stolen);
        if (!stolenCategory || !player.slices[stolenCategory.id]) {
          this.undo();
          throw new GameError('Choose a slice the player owns (stolen).');
        }
        player.slices[stolenCategory.id] = false;
        this.addToLog('hack', player, `The hacker steals ${player.name}'s ${stolenCategory.name} slice`);
      } else {
        this.addToLog('hack', player, `${player.name} falls for the scam, but has no slice to steal`);
      }
    }
    this.goToNextPlayer();
    return this.view();
  }

  // Dépenser 3 XP : relancer le dé ou changer de question
  spend({ playerId, bonus }) {
    this.checkGameIsRunning();
    const chosenBonus = findBonus(bonus);
    if (!chosenBonus || chosenBonus.id === 'block') {
      throw new GameError('bonus must be reroll or change (block is used in Hack Alert).');
    }
    const player = this.getPlayer(playerId);
    if (player.xp < chosenBonus.cost) {
      throw new GameError(`Not enough XP (${chosenBonus.cost} needed).`);
    }
    this.saveForUndo();
    player.xp -= chosenBonus.cost;
    player.stats.spent += chosenBonus.cost;
    this.addToLog('bonus', player, `${player.name}: ${chosenBonus.name} (−${chosenBonus.cost} XP)`);
    if (chosenBonus.id === 'change') {
      this.resetTimer(false);
    }
    return this.view();
  }

  // Question finale au centre : il faut les 6 parts. Juste = victoire.
  final({ playerId, correct }) {
    this.checkGameIsRunning();
    const player = this.getPlayer(playerId);
    if (this.countSlices(player) < rules.CATEGORIES.length) {
      throw new GameError('The player needs the 6 slices first.');
    }
    this.saveForUndo();

    if (correct) {
      this.state.status = 'finished';
      this.state.winnerId = player.id;
      this.pauseTimer(false);
      this.addToLog('final', player, `${player.name} wins SIX Slices!`);
    } else {
      this.addToLog('final', player, `${player.name} misses the final question`);
      this.goToNextPlayer();
    }
    return this.view();
  }

  nextTurn() {
    this.checkGameIsRunning();
    this.saveForUndo();
    this.goToNextPlayer();
    return this.view();
  }

  /* =========================================================
     Corrections à la main (le plateau reste la référence)
     ========================================================= */

  adjustXp({ playerId, delta }) {
    const player = this.getPlayer(playerId);
    const amount = Math.trunc(Number(delta));
    if (!Number.isFinite(amount) || amount === 0) {
      throw new GameError('delta must be a non-zero number.');
    }
    this.saveForUndo();
    player.xp = Math.max(0, player.xp + amount);
    this.addToLog('adjust', player, `${player.name}: XP ${amount > 0 ? '+' : ''}${amount} (manual)`);
    return this.view();
  }

  setSlice({ playerId, category, owned }) {
    const player = this.getPlayer(playerId);
    const chosenCategory = findCategory(category);
    if (!chosenCategory) {
      throw new GameError('Unknown category.');
    }
    this.saveForUndo();
    player.slices[chosenCategory.id] = Boolean(owned);
    this.addToLog('adjust', player, `${player.name}: ${chosenCategory.name} slice ${owned ? 'added' : 'removed'} (manual)`);
    return this.view();
  }

  undo() {
    const previous = this.history.pop();
    if (!previous) {
      throw new GameError('Nothing to undo.');
    }
    this.state = JSON.parse(previous);
    return this.view();
  }

  /* =========================================================
     Timer
     Le serveur garde l'heure de départ : tous les écrans
     affichent le même temps.
     ========================================================= */

  remainingMs() {
    const timer = this.state.timer;
    if (timer.status !== 'running') {
      return timer.remainingMs;
    }
    const elapsed = this.now() - timer.startedAt;
    return Math.max(0, timer.remainingMs - elapsed);
  }

  // Si le temps est écoulé, on passe le timer en "finished"
  updateTimerStatus() {
    const timer = this.state.timer;
    if (timer.status === 'running' && this.remainingMs() === 0) {
      timer.status = 'finished';
      timer.remainingMs = 0;
      timer.startedAt = null;
    }
  }

  startTimer() {
    this.updateTimerStatus();
    const timer = this.state.timer;
    if (timer.status === 'running') {
      return this.view();
    }
    if (timer.status === 'finished') {
      timer.remainingMs = timer.duration * 1000;
    }
    timer.status = 'running';
    timer.startedAt = this.now();
    return this.view();
  }

  pauseTimer(returnView = true) {
    this.updateTimerStatus();
    const timer = this.state.timer;
    if (timer.status === 'running') {
      timer.remainingMs = this.remainingMs();
      timer.status = 'paused';
      timer.startedAt = null;
    }
    return returnView ? this.view() : undefined;
  }

  resetTimer(returnView = true) {
    const timer = this.state.timer;
    timer.status = 'idle';
    timer.startedAt = null;
    timer.remainingMs = timer.duration * 1000;
    return returnView ? this.view() : undefined;
  }

  /* =========================================================
     Ce qu'on envoie au front
     ========================================================= */

  view() {
    this.updateTimerStatus();
    const state = this.state;
    const current = this.currentPlayer();

    // Classement : d'abord le nombre de parts, puis les XP
    const ranking = [...state.players]
      .sort((a, b) => this.countSlices(b) - this.countSlices(a) || b.xp - a.xp)
      .map((player) => player.id);

    return {
      id: state.id,
      status: state.status,
      turn: state.turn,
      currentPlayerId: current ? current.id : null,
      winnerId: state.winnerId,
      players: state.players.map((player) => ({
        ...player,
        slicesCount: this.countSlices(player),
        canFinal: this.countSlices(player) === rules.CATEGORIES.length,
      })),
      ranking,
      timer: { ...state.timer, remainingMs: this.remainingMs(), serverNow: this.now() },
      canUndo: this.history.length > 0,
      log: state.log.slice(0, 30),
    };
  }
}

module.exports = Game;
