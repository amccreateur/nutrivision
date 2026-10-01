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
  portionGrams: number;
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
}

