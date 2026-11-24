// Composants des designers (fichier gateaux.pdf), repris tels quels.
// Ils sont dans le dossier images/ :
//   gateaux.svg : les 6 gâteaux entiers (un par joueur)
//   parts.svg   : les parts de gâteau (une par catégorie)
//   bonbons.svg : les bonbons XP 1, 2 et 3
// Chaque fichier contient toute la page du PDF. Le "#..." à la fin de l'adresse
// choisit le composant à afficher (ex : parts.svg#slice-dev).

// Parts livrées par les designers.
// La part Design (jaune) manque encore : quand elle arrive, ajouter 'design' ici.
const DELIVERED_SLICES = ['marketing', 'social', 'dev', 'uxui', 'data'];

const PLATES_ORDER = ['orange', 'blue', 'pink', 'yellow', 'red', 'mauve'];

// Gâteau entier d'un joueur
export function plateImage(plateName, altText = '') {
  return `<img class="component plate" src="images/gateaux.svg#plate-${plateName}" alt="${altText}">`;
}

// Part de gâteau d'une catégorie
export function sliceImage(categoryId, altText = '') {
  if (!DELIVERED_SLICES.includes(categoryId)) {
    // En attendant la part des designers : cadre en pointillés
    return `<span class="component slice missing" role="img" aria-label="${altText}" title="Slice not delivered by the designers yet"></span>`;
  }
  return `<img class="component slice" src="images/parts.svg#slice-${categoryId}" alt="${altText}">`;
}

// Bonbon XP (1, 2 ou 3)
export function candyImage(value, altText = '') {
  return `<img class="component candy" src="images/bonbons.svg#candy-${value}" alt="${altText}">`;
}

// Gâteau d'un joueur (avec une valeur par défaut pour les vieilles sauvegardes)
export function plateOfPlayer(player, playerIndex = 0) {
  return player.plate || PLATES_ORDER[playerIndex % PLATES_ORDER.length];
}
