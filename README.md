# SIX Slices – support visuel

Application qui accompagne le jeu de plateau **SIX Slices** : un timer de 30 secondes par joueur et un tableau qui compte les XP.

Le jeu marche aussi sans l'application (avec le sablier et les jetons XP). L'app est un plus, pas une obligation.

---

## 1. Lancer le projet

Il faut avoir **Node.js** (version 18 ou plus).

```bash
cd backend
npm install
npm start
```

Puis ouvrir **http://localhost:3000** dans le navigateur.

Autres commandes (dans le dossier `backend`) :

| Commande | À quoi ça sert |
|---|---|
| `npm start` | lance le serveur |
| `npm run dev` | lance le serveur et le relance à chaque modification de code |
| `npm test` | lance les tests du jeu |

On peut ouvrir l'app sur plusieurs écrans en même temps (ordinateur, tablette, vidéoprojecteur) : ils restent synchronisés. Depuis un autre appareil sur le même Wi-Fi : `http://<adresse-IP-de-l-ordinateur>:3000`.

---

## 2. Organisation des dossiers

```
six-slices/
│
├── README.md                  ← ce fichier
│
├── backend/                   ← le serveur (Node.js + Express)
│   ├── server.js              ← point de départ du serveur
│   ├── package.json
│   │
│   ├── config/
│   │   └── rules.js           ← les règles : XP, timer, catégories, couleurs
│   │
│   ├── game/
│   │   ├── Game.js            ← toute la logique d'une partie
│   │   └── GameError.js       ← les erreurs du jeu (ex : pas assez d'XP)
│   │
│   ├── routes/                ← les adresses de l'API
│   │   ├── configRoutes.js    ← /api/config, /api/health
│   │   ├── gameRoutes.js      ← /api/game/...
│   │   ├── timerRoutes.js     ← /api/timer/...
│   │   └── liveUpdates.js     ← /api/events (mise à jour de tous les écrans)
│   │
│   ├── utils/
│   │   ├── storage.js         ← sauvegarde de la partie dans data/game.json
│   │   └── runAction.js       ← lance une action, sauvegarde, prévient les écrans
│   │
│   ├── data/                  ← la sauvegarde de la partie (créée toute seule)
│   │
│   └── tests/
│       └── game.test.js       ← tests de Game.js
│
└── frontend/                  ← le site (HTML, CSS, JavaScript)
    ├── index.html             ← la page
    │
    ├── css/
    │   ├── fonts.css          ← les polices
    │   ├── base.css           ← couleurs, boutons, barre du haut, messages
    │   ├── setup.css          ← écran de départ
    │   ├── game.css           ← écran de jeu (les 3 colonnes)
    │   └── responsive.css     ← tablette et téléphone
    │
    ├── js/
    │   ├── main.js            ← démarre le site et met à jour l'écran
    │   ├── api.js             ← tous les appels au serveur
    │   ├── state.js           ← données partagées (règles, partie en cours)
    │   ├── utils.js           ← petites fonctions utiles
    │   ├── components.js      ← images des designers
    │   ├── setupScreen.js     ← écran de départ
    │   ├── playersList.js     ← tableau des XP (colonne de gauche)
    │   ├── board.js           ← plateau (colonne du milieu)
    │   ├── timer.js           ← timer (colonne de droite)
    │   └── turnActions.js     ← actions du tour (colonne de droite)
    │
    ├── images/                ← composants des designers (gateaux.pdf)
    │   ├── gateaux.svg        ← les 6 gâteaux (un par joueur)
    │   ├── parts.svg          ← les parts de gâteau
    │   └── bonbons.svg        ← les bonbons XP 1, 2, 3
    │
    └── fonts/                 ← polices Shrikhand et Lexend (le site marche sans Internet)
```

---

## 3. Où trouver quoi ?

| Je veux… | Fichier |
|---|---|
| changer le nombre d'XP d'un niveau, la durée du timer, le prix des bonus | `backend/config/rules.js` |
| changer ce qui se passe quand on répond juste / faux, le Hack Alert, la mission | `backend/game/Game.js` |
| ajouter une adresse à l'API | `backend/routes/gameRoutes.js` |
| changer une couleur de la palette | `frontend/css/base.css` (en haut, dans `:root`) et `backend/config/rules.js` |
| modifier l'écran de départ | `frontend/js/setupScreen.js` + `frontend/css/setup.css` |
| modifier le tableau des XP | `frontend/js/playersList.js` + `frontend/css/game.css` |
| intégrer le plateau des designers | `frontend/js/board.js` |
| modifier le timer (affichage, bip de fin) | `frontend/js/timer.js` |
| modifier les onglets Question / Mission / Hack Alert / Bonus | `frontend/js/turnActions.js` + `index.html` |
| modifier l'affichage sur téléphone | `frontend/css/responsive.css` |
| remplacer une image des designers | `frontend/images/` (voir partie 6) |

---

## 4. Comment ça marche

1. Le **serveur** (`backend`) garde la partie : joueurs, XP, parts, timer.
2. Le **site** (`frontend`) affiche la partie et envoie les actions au serveur (ex : « Ana a répondu juste au niveau Expert »).
3. Après chaque action, le serveur sauvegarde la partie et l'envoie à **tous les écrans ouverts**.

Le timer est calculé par le serveur, donc tous les écrans affichent le même temps.

---

## 5. Les règles codées

| Action | Effet |
|---|---|
| Question Newbie / Junior / Expert juste | +1 / +2 / +3 XP, le joueur rejoue |
| Question fausse | joueur suivant |
| Mission au QG réussie | le joueur gagne la part de la couleur |
| Hack Alert! juste | +2 XP |
| Hack Alert! faux | le hacker vole une part, sauf si le joueur le bloque pour 3 XP |
| Bonus | 3 XP : relancer le dé ou changer de question |
| Question finale (avec les 6 parts) | juste = victoire |
| Timer | 30 s, remis à zéro à chaque tour |

Le plateau reste la référence : on peut corriger à la main les XP (+1 / −1) et les parts (clic sur une part). **Undo** annule la dernière action.

Raccourcis clavier : `Espace` = lancer ou mettre en pause le timer, `N` = joueur suivant.

---

## 6. Les images des designers

Les fichiers de `frontend/images/` sont les pages de `gateaux.pdf` converties en SVG, sans modification (seul le fond blanc a été enlevé).
Chaque fichier contient toute la page : le `#...` à la fin de l'adresse choisit le composant.

| Image | Adresse |
|---|---|
| gâteaux | `images/gateaux.svg#plate-orange` (aussi `blue`, `pink`, `yellow`, `red`, `mauve`) |
| parts | `images/parts.svg#slice-marketing` (aussi `social`, `dev`, `uxui`, `data`) |
| bonbons | `images/bonbons.svg#candy-1` (aussi `candy-2`, `candy-3`) |

**À faire : la part Design (jaune, losange) manque dans gateaux.pdf.** En attendant, un cadre en pointillés la remplace.
Quand les designers la livrent :
1. l'ajouter dans `images/parts.svg` avec un `<view id="slice-design" viewBox="...">` ;
2. ajouter `'design'` dans la liste `DELIVERED_SLICES` de `frontend/js/components.js`.

---

## 7. Intégrer le plateau

Le plateau des designers n'est pas encore prêt. Pour l'instant, la colonne du milieu montre le gâteau du joueur en cours et ses parts.

Quand le plateau arrive, il faut modifier `frontend/js/board.js` (fonction `showBoard`). Elle est appelée à chaque changement de la partie et peut utiliser :

- `state.config.categories` : les 6 catégories
- `state.game.players` : les joueurs (`name`, `xp`, `slices`, `slicesCount`)
- `state.game.currentPlayerId` : le joueur dont c'est le tour

Pour faire avancer les pions sur le plateau, il faudra aussi ajouter une position par joueur dans `backend/game/Game.js`.

---

## 8. L'API

| Méthode | Adresse | Données envoyées |
|---|---|---|
| GET | `/api/config` | – |
| GET | `/api/game` | – |
| GET | `/api/events` | – (flux en direct) |
| POST | `/api/game` | `{ "players": ["Ana", "Bob"], "timerSeconds": 30 }` |
| POST | `/api/game/answer` | `{ "level": "expert", "correct": true }` |
| POST | `/api/game/mission` | `{ "category": "dev", "success": true }` |
| POST | `/api/game/hack` | `{ "correct": false, "stolen": "dev" }` ou `{ "correct": false, "blocked": true }` |
| POST | `/api/game/spend` | `{ "bonus": "reroll" }` ou `{ "bonus": "change" }` |
| POST | `/api/game/final` | `{ "playerId": "p1", "correct": true }` |
| POST | `/api/game/next-turn` | – |
| POST | `/api/game/undo` | – |
| POST | `/api/game/xp` | `{ "playerId": "p1", "delta": -1 }` |
| POST | `/api/game/slice` | `{ "playerId": "p1", "category": "dev", "owned": true }` |
| POST | `/api/timer/start`, `/api/timer/pause`, `/api/timer/reset` | – |

Si `playerId` n'est pas donné, l'action concerne le joueur dont c'est le tour.
