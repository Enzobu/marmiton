export type Recipe = {
  id: number;
  title: string;
  image: string;
  category: string;
  time: number;
  difficulty: 'Facile' | 'Moyen';
  rating: number;
  reviews: number;
  description: string;
  ingredients: string[];
  steps: string[];
  badge?: string;
};

export const recipes: Recipe[] = [
  { id: 1, title: 'Lasagnes à la bolognaise maison', category: 'Plats', time: 75, difficulty: 'Moyen', rating: 4.9, reviews: 342, badge: 'Coup de cœur', image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=900&q=85', description: 'Des lasagnes généreuses, fondantes et gratinées, à partager autour de la table.', ingredients: ['Feuilles de lasagne', 'Viande hachée', 'Sauce tomate', 'Béchamel', 'Oignon'], steps: ['Préparer la sauce bolognaise.', 'Alterner les couches de pâtes et de sauces.', 'Enfourner jusqu’à obtenir un beau gratin.'] },
  { id: 2, title: 'Moelleux au chocolat cœur fondant', category: 'Desserts', time: 25, difficulty: 'Facile', rating: 4.9, reviews: 578, badge: 'Très populaire', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900&q=85', description: 'Le dessert chocolaté incontournable, avec un cœur délicieusement coulant.', ingredients: ['Chocolat noir', 'Beurre', 'Œufs', 'Sucre', 'Farine'], steps: ['Faire fondre le chocolat et le beurre.', 'Incorporer les œufs, le sucre et la farine.', 'Cuire rapidement pour garder le cœur fondant.'] },
  { id: 3, title: 'Salade fraîcheur à la grecque', category: 'Entrées', time: 15, difficulty: 'Facile', rating: 4.7, reviews: 124, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=85', description: 'Une assiette ensoleillée, croquante et pleine de fraîcheur.', ingredients: ['Tomates', 'Concombre', 'Olives', 'Oignon rouge', 'Huile d’olive'], steps: ['Laver et découper les légumes.', 'Mélanger tous les ingrédients.', 'Assaisonner juste avant de servir.'] },
  { id: 4, title: 'Pancakes moelleux du dimanche', category: 'Petit-déjeuner', time: 20, difficulty: 'Facile', rating: 4.8, reviews: 286, image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=900&q=85', description: 'Des pancakes épais et tout doux pour bien commencer la journée.', ingredients: ['Farine', 'Lait', 'Œufs', 'Levure chimique', 'Sucre'], steps: ['Mélanger les ingrédients secs puis les liquides.', 'Laisser reposer quelques minutes.', 'Cuire les pancakes dans une poêle chaude.'] },
  { id: 5, title: 'Poulet rôti et pommes de terre', category: 'Plats', time: 90, difficulty: 'Facile', rating: 4.8, reviews: 196, image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=900&q=85', description: 'Un classique familial croustillant à l’extérieur et tendre à l’intérieur.', ingredients: ['Poulet entier', 'Pommes de terre', 'Ail', 'Thym', 'Huile d’olive'], steps: ['Préchauffer le four.', 'Assaisonner le poulet et répartir les pommes de terre.', 'Rôtir en arrosant régulièrement.'] },
  { id: 6, title: 'Cookies aux pépites de chocolat', category: 'Desserts', time: 30, difficulty: 'Facile', rating: 4.9, reviews: 413, image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=900&q=85', description: 'Croustillants sur les bords, tendres au milieu : le goûter parfait.', ingredients: ['Farine', 'Beurre', 'Cassonade', 'Œuf', 'Pépites de chocolat'], steps: ['Crémer le beurre et le sucre.', 'Ajouter les autres ingrédients.', 'Former les cookies et enfourner.'] },
  { id: 7, title: 'Pâtes crémeuses aux champignons', category: 'Plats', time: 30, difficulty: 'Facile', rating: 4.6, reviews: 89, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=900&q=85', description: 'Une recette réconfortante, rapide et parfaite pour un soir de semaine.', ingredients: ['Pâtes', 'Champignons', 'Crème', 'Ail', 'Persil'], steps: ['Cuire les pâtes.', 'Faire revenir les champignons avec l’ail.', 'Mélanger avec la crème et les pâtes.'] },
  { id: 8, title: 'Tarte aux pommes de grand-mère', category: 'Desserts', time: 55, difficulty: 'Facile', rating: 4.8, reviews: 231, image: 'https://images.unsplash.com/photo-1562007908-17c67e878c88?w=900&q=85', description: 'Une tarte dorée et parfumée qui sent bon les souvenirs d’enfance.', ingredients: ['Pâte feuilletée', 'Pommes', 'Beurre', 'Sucre', 'Cannelle'], steps: ['Étaler la pâte.', 'Disposer les pommes en fines tranches.', 'Saupoudrer et cuire jusqu’à coloration.'] }
];


export type Ingredient = { name: string; amount: number | null; unit?: string; icon: 'vegetable' | 'meat' | 'dairy' | 'grain' | 'spice' | 'other' };
export const BASE_SERVINGS = 4;
export const ingredientQuantities: Record<number, Ingredient[]> = {
  1: [
    { name: 'Feuilles de lasagne', amount: 12, icon: 'grain' },
    { name: 'Viande hachée', amount: 500, unit: 'g', icon: 'meat' },
    { name: 'Sauce tomate', amount: 600, unit: 'g', icon: 'vegetable' },
    { name: 'Béchamel', amount: 400, unit: 'ml', icon: 'dairy' },
    { name: 'Oignon', amount: 1, icon: 'vegetable' }
  ],
  2: [
    { name: 'Chocolat noir', amount: 200, unit: 'g', icon: 'other' },
    { name: 'Beurre', amount: 100, unit: 'g', icon: 'dairy' },
    { name: 'Œufs', amount: 4, icon: 'dairy' },
    { name: 'Sucre', amount: 90, unit: 'g', icon: 'grain' },
    { name: 'Farine', amount: 50, unit: 'g', icon: 'grain' }
  ],
  3: [
    { name: 'Tomates', amount: 4, icon: 'vegetable' },
    { name: 'Concombre', amount: 1, icon: 'vegetable' },
    { name: 'Olives', amount: 100, unit: 'g', icon: 'vegetable' },
    { name: 'Oignon rouge', amount: 1, icon: 'vegetable' },
    { name: 'Huile d’olive', amount: 3, unit: 'c. à soupe', icon: 'other' }
  ],
  4: [
    { name: 'Farine', amount: 250, unit: 'g', icon: 'grain' },
    { name: 'Lait', amount: 300, unit: 'ml', icon: 'dairy' },
    { name: 'Œufs', amount: 2, icon: 'dairy' },
    { name: 'Levure chimique', amount: 1, unit: 'sachet', icon: 'grain' },
    { name: 'Sucre', amount: 35, unit: 'g', icon: 'grain' }
  ],
  5: [
    { name: 'Poulet entier', amount: 1, icon: 'meat' },
    { name: 'Pommes de terre', amount: 800, unit: 'g', icon: 'vegetable' },
    { name: 'Ail', amount: 4, unit: 'gousses', icon: 'vegetable' },
    { name: 'Thym', amount: 2, unit: 'branches', icon: 'spice' },
    { name: 'Huile d’olive', amount: 3, unit: 'c. à soupe', icon: 'other' }
  ],
  6: [
    { name: 'Farine', amount: 230, unit: 'g', icon: 'grain' },
    { name: 'Beurre', amount: 120, unit: 'g', icon: 'dairy' },
    { name: 'Cassonade', amount: 110, unit: 'g', icon: 'grain' },
    { name: 'Œuf', amount: 1, icon: 'dairy' },
    { name: 'Pépites de chocolat', amount: 150, unit: 'g', icon: 'other' }
  ],
  7: [
    { name: 'Pâtes', amount: 400, unit: 'g', icon: 'grain' },
    { name: 'Champignons', amount: 350, unit: 'g', icon: 'vegetable' },
    { name: 'Crème', amount: 200, unit: 'ml', icon: 'dairy' },
    { name: 'Ail', amount: 2, unit: 'gousses', icon: 'vegetable' },
    { name: 'Persil', amount: 1, unit: 'bouquet', icon: 'spice' }
  ],
  8: [
    { name: 'Pâte feuilletée', amount: 1, icon: 'grain' },
    { name: 'Pommes', amount: 5, icon: 'vegetable' },
    { name: 'Beurre', amount: 40, unit: 'g', icon: 'dairy' },
    { name: 'Sucre', amount: 50, unit: 'g', icon: 'grain' },
    { name: 'Cannelle', amount: 1, unit: 'c. à café', icon: 'spice' }
  ]
};
export const recipePreparation: Record<number, { prep: number; cook: number; rest: number; budget: string; utensils: string[] }> = {
  1: { prep: 30, cook: 45, rest: 0, budget: 'Moyen', utensils: ['Plat à gratin', 'Poêle', 'Four'] },
  2: { prep: 15, cook: 10, rest: 0, budget: 'Bon marché', utensils: ['Four', 'Moule', 'Saladier'] },
  3: { prep: 15, cook: 0, rest: 0, budget: 'Bon marché', utensils: ['Couteau', 'Saladier'] },
  4: { prep: 10, cook: 10, rest: 0, budget: 'Bon marché', utensils: ['Poêle', 'Fouet', 'Saladier'] },
  5: { prep: 20, cook: 70, rest: 0, budget: 'Moyen', utensils: ['Four', 'Plat à rôtir'] },
  6: { prep: 15, cook: 15, rest: 0, budget: 'Bon marché', utensils: ['Four', 'Plaque', 'Saladier'] },
  7: { prep: 10, cook: 20, rest: 0, budget: 'Bon marché', utensils: ['Casserole', 'Poêle'] },
  8: { prep: 20, cook: 35, rest: 0, budget: 'Bon marché', utensils: ['Four', 'Moule à tarte'] }
};

export function formatQuantity(ingredient: Ingredient, servings: number, baseServings = BASE_SERVINGS): string {
  if (ingredient.amount === null) return 'À votre goût';
  const scaled = ingredient.amount * servings / baseServings;
  const formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Math.round(scaled * 100) / 100);
  return `${formatted}${ingredient.unit ? ' ' + ingredient.unit : ''}`;
}

export function recipePath(id: number): string { return `/recipes/${id}`; }
