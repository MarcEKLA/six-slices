// Règles du jeu SIX Slices
// Pour changer une règle (XP, durée du timer...), c'est ici.
// Le front récupère aussi ces infos avec GET /api/config.

// Palette donnée par l'équipe design
const PALETTE = {
  red: '#6D0101',
  pink: '#EFC6E9',
  blue: '#C0D6FF',
  orange: '#F88C2F',
  yellow: '#FCF4C0',
  mauve: '#3B174F',
};

// Les 6 catégories = les 6 parts du gâteau
const CATEGORIES = [
  { id: 'marketing', name: 'Marketing', job: 'Digital Marketer', color: PALETTE.orange },
  { id: 'social', name: 'Social Media', job: 'Community Manager', color: PALETTE.pink },
  { id: 'dev', name: 'Development', job: 'Software Developer', color: PALETTE.blue },
  { id: 'design', name: 'Design', job: 'Graphic Designer', color: PALETTE.yellow },
  { id: 'uxui', name: 'UX/UI', job: 'UX/UI Designer', color: PALETTE.red },
  { id: 'data', name: 'Data & AI', job: 'Data Analyst', color: PALETTE.mauve },
];

// Niveaux des questions et XP gagnés si la réponse est juste
const LEVELS = [
  { id: 'newbie', name: 'Newbie', fr: 'Débutant', xp: 1 },
  { id: 'junior', name: 'Junior', fr: 'Intermédiaire', xp: 2 },
  { id: 'expert', name: 'Expert', fr: 'Expert', xp: 3 },
];

// Hack Alert! : XP gagnés si le joueur repère l'arnaque
const HACK_ALERT_XP = 2;

// Bonus qu'on peut acheter avec des XP
const BONUSES = [
  { id: 'reroll', name: 'Roll again', cost: 3 },
  { id: 'change', name: 'Change question', cost: 3 },
  { id: 'block', name: 'Block the hacker', cost: 3 },
];

// Timer (en secondes)
const TIMER_SECONDS = 30;

// Nombre de joueurs
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;

// Chaque joueur reçoit un gâteau (voir frontend/images/gateaux.svg)
const PLAYER_PLATES = ['orange', 'blue', 'pink', 'yellow', 'red', 'mauve'];
const PLAYER_COLORS = [PALETTE.orange, PALETTE.blue, PALETTE.pink, PALETTE.yellow, PALETTE.red, PALETTE.mauve];

module.exports = {
  PALETTE,
  CATEGORIES,
  LEVELS,
  HACK_ALERT_XP,
  BONUSES,
  TIMER_SECONDS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  PLAYER_PLATES,
  PLAYER_COLORS,
};
