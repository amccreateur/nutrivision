export type NutriScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type NovaGrade = 1 | 2 | 3 | 4;
export type EcoScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export type AllergenType =
  | 'gluten'
  | 'lactose'
  | 'nuts'
  | 'eggs'
  | 'fish'
  | 'crustaceans'
  | 'soy'
  | 'peanuts';

export type DietType =
  | 'none'
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'kosher'
  | 'diabetic'
  | 'low_carb';

export interface Macronutrients {
  calories: number; // kcal
  proteins: number; // g
  carbs: number; // g
  fats: number; // g
  saturatedFats: number; // g
  sugars: number; // g
  fibers: number; // g
  sodiumMg: number; // mg
}

export interface FoodItemAnalysis {
  name: string;
  category: 'dish' | 'drink' | 'snack' | 'dessert';
  confidence: number;
  /** Portion size: grams for solids, millilitres when `isLiquid` is true (1 ml ≈ 1 g). */
  portionGrams: number;
  /** True for drinks / soups: portion is expressed in ml and per100g means per 100 ml. */
  isLiquid?: boolean;
  macros: Macronutrients;
  per100g: Macronutrients;
  ingredients: string[];
  nutriScore: {
    grade: NutriScoreGrade;
    score: number;
    positivePoints: number;
    negativePoints: number;
    insights: string[];
  };
  novaScore?: {
    grade: NovaGrade;
    title: string;
    description: string;
  };
  ecoScore?: {
    grade: EcoScoreGrade;
    title: string;
    impactDescription: string;
  };
  detectedAllergens?: string[];
  dietWarnings?: string[];
  healthSummary: string;
  healthTips?: string[];
  healthyAlternative?: string;
  photoUri?: string;
  isBarcode?: boolean;
}

export interface MealHistoryItem {
  id: string;
  timestamp: number;
  dishName: string;
  calories: number;
  nutriScore: NutriScoreGrade;
  novaGrade?: NovaGrade;
  ecoScoreGrade?: EcoScoreGrade;
  portionGrams: number;
  isLiquid?: boolean;
  photoUri?: string;
  macros: Macronutrients;
  ingredients?: string[];
}

export interface GeneratedRecipe {
  title: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  estimatedNutriScore: NutriScoreGrade;
  estimatedCaloriesPerServing: number;
  ingredientsUsed: string[];
  missingPantrySuggestions?: string[];
  steps: string[];
  chefTip: string;
}

export interface WaterLogItem {
  id: string;
  timestamp: number;
  amountMl: number;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type CalorieGoal = 'lose_weight' | 'maintain' | 'gain_muscle';

export interface UserProfile {
  gender: 'male' | 'female';
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: CalorieGoal;
}

export type AppLanguage = 'fr' | 'en';

export interface UserPreferences {
  apiKey?: string;
  dailyCalorieTarget: number;
  dailyWaterTargetMl: number;
  autoScanIntervalSeconds: number;
  isAutoScanEnabled: boolean;
  useHaptics: boolean;
  enableBarcodeScanner: boolean;
  enableVoiceFeedback: boolean;
  allergens: AllergenType[];
  diet: DietType;
  userProfile?: UserProfile;
  hasSeenOnboarding?: boolean;
  language: AppLanguage;
  isPremium?: boolean;
}

