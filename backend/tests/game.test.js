// Tests de la classe Game. Lancer avec : npm test
const test = require('node:test');
const assert = require('node:assert');
const Game = require('../game/Game');

function setup(names = ['Ana', 'Bob', 'Cleo']) {
  let t = 1_000_000;
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const g = new Game({ now: clock.now });
  g.newGame(names);
  return { g, clock };
}

test("il faut entre 2 et 6 joueurs", () => {
  const g = new Game();
  assert.throws(() => g.newGame(['Solo']));
  assert.throws(() => g.newGame(['a', 'b', 'c', 'd', 'e', 'f', 'g']));
  const v = g.newGame(['A', 'B']);
  assert.equal(v.players.length, 2);
  assert.equal(v.currentPlayerId, 'p1');
});

test("bonne réponse : XP du niveau et le joueur rejoue", () => {
  const { g } = setup();
  let v = g.answer({ level: 'newbie', correct: true });
  assert.equal(v.players[0].xp, 1);
  v = g.answer({ level: 'junior', correct: true });
  v = g.answer({ level: 'expert', correct: true });
  assert.equal(v.players[0].xp, 6);
  assert.equal(v.currentPlayerId, 'p1');
});

test("mauvaise réponse : joueur suivant", () => {
  const { g } = setup();
  const v = g.answer({ level: 'expert', correct: false });
  assert.equal(v.players[0].xp, 0);
  assert.equal(v.currentPlayerId, 'p2');
});

test("mission réussie : le joueur gagne la part", () => {
  const { g } = setup();
  const v = g.mission({ category: 'dev', success: true });
  assert.equal(v.players[0].slices.dev, true);
  assert.equal(v.players[0].slicesCount, 1);
  assert.equal(v.currentPlayerId, 'p2');
});

test("hack alert : +2 XP si juste, vol d'une part si faux, blocage à 3 XP", () => {
  const { g } = setup(['A', 'B']);
  let v = g.hackAlert({ correct: true });
  assert.equal(v.players[0].xp, 2);
  g.mission({ playerId: 'p1', category: 'design', success: true });
  g.nextTurn(); // p2 -> p1
  v = g.hackAlert({ playerId: 'p1', correct: false, stolen: 'design' });
  assert.equal(v.players[0].slices.design, false);
  g.adjustXp({ playerId: 'p2', delta: 3 });
  g.mission({ playerId: 'p2', category: 'data', success: true });
  v = g.hackAlert({ playerId: 'p2', correct: false, blocked: true });
  assert.equal(v.players[1].slices.data, true);
  assert.equal(v.players[1].xp, 0);
});

test("hack alert : une part invalide est refusée et rien ne change", () => {
  const { g } = setup(['A', 'B']);
  g.setSlice({ playerId: 'p1', category: 'uxui', owned: true });
  const before = JSON.stringify(g.state);
  assert.throws(() => g.hackAlert({ correct: false, stolen: 'marketing' }));
  assert.equal(JSON.stringify(g.state), before);
});

test("un bonus coûte 3 XP", () => {
  const { g } = setup();
  assert.throws(() => g.spend({ bonus: 'reroll' }));
  g.answer({ level: 'expert', correct: true });
  const v = g.spend({ bonus: 'reroll' });
  assert.equal(v.players[0].xp, 0);
});

test("question finale : il faut 6 parts, juste = victoire", () => {
  const { g } = setup(['A', 'B']);
  assert.throws(() => g.final({ playerId: 'p1', correct: true }));
  for (const c of ['marketing', 'social', 'dev', 'design', 'uxui', 'data']) g.setSlice({ playerId: 'p1', category: c, owned: true });
  const v = g.final({ playerId: 'p1', correct: true });
  assert.equal(v.status, 'finished');
  assert.equal(v.winnerId, 'p1');
});

test("timer : décompte, pause, fin et remise à zéro au tour suivant", () => {
  const { g, clock } = setup();
  g.startTimer();
  clock.advance(10_000);
  assert.equal(g.view().timer.remainingMs, 20_000);
  g.pauseTimer();
  clock.advance(5_000);
  assert.equal(g.view().timer.remainingMs, 20_000);
  g.startTimer();
  clock.advance(25_000);
  assert.equal(g.view().timer.status, 'finished');
  const v = g.nextTurn();
  assert.equal(v.timer.status, 'idle');
  assert.equal(v.timer.remainingMs, 30_000);
});

test("annuler remet la partie comme avant", () => {
  const { g } = setup();
  g.answer({ level: 'expert', correct: true });
  const v = g.undo();
  assert.equal(v.players[0].xp, 0);
});
