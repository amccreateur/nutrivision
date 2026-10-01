import { Macronutrients, NutriScoreGrade } from '../types/nutrition';

/**
 * Calculateur officiel Nutri-Score (Algorithme standardisé pour 100g d'aliment solide)
 */
export function calculateNutriScore(
  per100g: Macronutrients,
  fruitVegLegumePercentage: number = 20
): {
  grade: NutriScoreGrade;
  score: number;
  positivePoints: number;
  negativePoints: number;
  insights: string[];
} {
  const energyKj = per100g.calories * 4.184; // 1 kcal = 4.184 kJ
  const satFatG = per100g.saturatedFats;
  const sugarsG = per100g.sugars;
  const sodiumMg = per100g.sodiumMg;
  const fibersG = per100g.fibers;
  const proteinsG = per100g.proteins;

  // --- 1. Calcul des points négatifs (N) de 0 à 40 ---
  // Énergie (kJ) : 0 à 10 points
  let energyPoints = 0;
  const energyThresholds = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
  for (let i = 0; i < energyThresholds.length; i++) {
    if (energyKj > energyThresholds[i]) energyPoints = i + 1;
  }

  // Acides gras saturés (g) : 0 à 10 points
  let satFatPoints = 0;
  const satFatThresholds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (let i = 0; i < satFatThresholds.length; i++) {
    if (satFatG > satFatThresholds[i]) satFatPoints = i + 1;
  }

  // Sucres simples (g) : 0 à 10 points
  let sugarPoints = 0;
  const sugarThresholds = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45];
  for (let i = 0; i < sugarThresholds.length; i++) {
    if (sugarsG > sugarThresholds[i]) sugarPoints = i + 1;
  }

  // Sodium (mg) : 0 à 10 points
  let sodiumPoints = 0;
  const sodiumThresholds = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900];
  for (let i = 0; i < sodiumThresholds.length; i++) {
    if (sodiumMg > sodiumThresholds[i]) sodiumPoints = i + 1;
  }

  const negativePoints = energyPoints + satFatPoints + sugarPoints + sodiumPoints;

  // --- 2. Calcul des points positifs (P) de 0 à 15 ---
  // Fruits, légumes, légumineuses (%) : 0 à 5 points
  let fruitVegPoints = 0;
  if (fruitVegLegumePercentage > 80) fruitVegPoints = 5;
  else if (fruitVegLegumePercentage > 60) fruitVegPoints = 2;
  else if (fruitVegLegumePercentage > 40) fruitVegPoints = 1;

  // Fibres (g) : 0 à 5 points
  let fiberPoints = 0;
  const fiberThresholds = [0.9, 1.9, 2.8, 3.7, 4.7];
  for (let i = 0; i < fiberThresholds.length; i++) {
    if (fibersG > fiberThresholds[i]) fiberPoints = i + 1;
  }

  // Protéines (g) : 0 à 5 points
  let proteinPoints = 0;
  const proteinThresholds = [1.6, 3.2, 4.8, 6.4, 8.0];
  for (let i = 0; i < proteinThresholds.length; i++) {
    if (proteinsG > proteinThresholds[i]) proteinPoints = i + 1;
  }

  let positivePoints = fruitVegPoints + fiberPoints;

  // Règle d'attribution des protéines :
  // Si les points N >= 11 et que les fruits/légumes < 5, les protéines ne sont pas comptabilisées (sauf si fruits > 80%)
  if (negativePoints < 11 || fruitVegPoints >= 5) {
    positivePoints += proteinPoints;
  }

  // --- 3. Score final ---
  const finalScore = negativePoints - positivePoints;

  // --- 4. Attribution de la lettre ---
  let grade: NutriScoreGrade = 'A';
  if (finalScore <= -1) {
    grade = 'A';
  } else if (finalScore <= 2) {
    grade = 'B';
  } else if (finalScore <= 10) {
    grade = 'C';
  } else if (finalScore <= 18) {
    grade = 'D';
  } else {
    grade = 'E';
  }

  // Insights explicatifs
  const insights: string[] = [];
  if (satFatPoints >= 4) insights.push('Teneur élevée en graisses saturées');
  if (sugarPoints >= 4) insights.push('Teneur élevée en sucres');
  if (sodiumPoints >= 4) insights.push('Riche en sel / sodium');
  if (fiberPoints >= 3) insights.push('Bonne source de fibres');
  if (proteinPoints >= 3) insights.push('Excellente source de protéines');
  if (fruitVegPoints >= 2) insights.push('Riche en végétaux');

  return {
    grade,
    score: finalScore,
    positivePoints,
    negativePoints,
    insights,
  };
}

export const NUTRI_SCORE_COLORS: Record<NutriScoreGrade, { bg: string; text: string; label: string }> = {
  A: { bg: '#038141', text: '#FFFFFF', label: 'Très bonne qualité nutritionnelle' },
  B: { bg: '#85BB2F', text: '#FFFFFF', label: 'Bonne qualité nutritionnelle' },
  C: { bg: '#FECB02', text: '#111827', label: 'Qualité nutritionnelle moyenne' },
  D: { bg: '#EE8100', text: '#FFFFFF', label: 'Qualité nutritionnelle médiocre' },
  E: { bg: '#E63E11', text: '#FFFFFF', label: 'Faible qualité nutritionnelle' },
};
