import { ActivityLevel, CalorieGoal, UserProfile } from '../types/nutrition';

export interface CalculationResult {
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  dailyWaterTargetMl: number;
  bmi: number;
  bmiCategory: string;
}

export const calculateNutritionNeeds = (profile: UserProfile): CalculationResult => {
  const { gender, age, weightKg, heightCm, activityLevel, goal } = profile;

  // 1. Indice de Masse Corporelle (IMC / BMI)
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : 22;

  let bmiCategory = 'Poids normal';
  if (bmi < 18.5) bmiCategory = 'Insuffisance pondérale';
  else if (bmi >= 25 && bmi < 30) bmiCategory = 'Surpoids';
  else if (bmi >= 30) bmiCategory = 'Obésité';

  // 2. Métabolisme de Base (Formule Mifflin-St Jeor)
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  bmr = Math.round(Math.max(800, bmr));

  // 3. Multiplicateur d'activité physique (TDEE)
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = activityMultipliers[activityLevel] || 1.375;
  const tdee = Math.round(bmr * multiplier);

  // 4. Ajustement selon l'objectif
  let dailyCalorieTarget = tdee;
  if (goal === 'lose_weight') {
    dailyCalorieTarget = Math.round(tdee - 400);
  } else if (goal === 'gain_muscle') {
    dailyCalorieTarget = Math.round(tdee + 350);
  }

  // Seuil de sécurité métabolique minimum
  const minCalories = gender === 'female' ? 1200 : 1500;
  dailyCalorieTarget = Math.max(minCalories, dailyCalorieTarget);

  // 5. Hydratation quotidienne recommandée (~35ml / kg de poids)
  let dailyWaterTargetMl = Math.round((weightKg * 35) / 50) * 50;
  if (dailyWaterTargetMl < 1500) dailyWaterTargetMl = 1500;
  if (dailyWaterTargetMl > 4000) dailyWaterTargetMl = 4000;

  return {
    bmr,
    tdee,
    dailyCalorieTarget,
    dailyWaterTargetMl,
    bmi,
    bmiCategory,
  };
};
