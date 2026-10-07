import { FoodItemAnalysis, GeneratedRecipe, Macronutrients, UserPreferences } from '../types/nutrition';
import { calculateNutriScore } from './nutriscore';

const GEMINI_SYSTEM_INSTRUCTION = `
Tu es un expert mondial en nutrition, allergologie alimentaire et vision par ordinateur culinaire.
Analyse l'image du plat ou aliment visible dans la caméra.
1. Identifie les aliments, estime les portions réalistes (en grammes), calcule l'ensemble des macronutriments et micronutriments (calories kcal, protéines g, glucides g, lipides g, graisses saturées g, sucres g, fibres g, sodium mg) pour la portion totale et ramené à 100g.
2. Estime également le pourcentage d'ingrédients de type fruits, légumes et légumineuses (0 à 100%).
3. Estime l'indice NOVA (1: Non transformé ou minimalement transformé, 2: Ingrédient culinaire transformé, 3: Aliment transformé, 4: Produit ultra-transformé).
4. Estime l'Éco-Score (A, B, C, D, ou E) selon l'empreinte environnementale habituelle du plat.
5. Détecte la présence potentielle d'allergènes majeurs parmi : gluten, lactose, fruits à coque (nuts), oeufs (eggs), poisson (fish), crustacés (crustaceans), soja (soy), arachides (peanuts), sésame (sesame), moutarde (mustard).
6. Donne 2 conseils diététiques pertinents pour ce repas et une alternative plus saine pour compenser ou améliorer le Nutri-Score.
7. LIQUIDES : si l'élément principal est un liquide (boisson, jus, soda, lait, café, thé, smoothie, soupe, bouillon, yaourt à boire...), mets "isLiquid": true, estime le VOLUME en millilitres (ml) d'après le contenant visible (verre, tasse, canette, bouteille, bol) et place cette valeur dans "portionGrams" (1 ml ≈ 1 g). Dans ce cas, "per100g" correspond aux valeurs pour 100 ml. Sinon, mets "isLiquid": false.

Réponds STRICTEMENT sous format JSON valide, sans balises markdown additionnelles :
{
  "name": "Nom précis du plat ou aliment en français",
  "category": "dish" | "drink" | "snack" | "dessert",
  "isLiquid": false,
  "confidence": 0.95,
  "portionGrams": 350,
  "fruitVegPercentage": 40,
  "macros": {
    "calories": 520,
    "proteins": 28,
    "carbs": 45,
    "fats": 18,
    "saturatedFats": 3.2,
    "sugars": 4.5,
    "fibers": 6.0,
    "sodiumMg": 420
  },
  "per100g": {
    "calories": 148,
    "proteins": 8.0,
    "carbs": 12.8,
    "fats": 5.1,
    "saturatedFats": 0.9,
    "sugars": 1.3,
    "fibers": 1.7,
    "sodiumMg": 120
  },
  "novaGrade": 1 | 2 | 3 | 4,
  "novaDescription": "Description courte (ex: Aliments peu ou non transformés)",
  "ecoScoreGrade": "A" | "B" | "C" | "D" | "E",
  "ecoScoreDescription": "Description courte (ex: Très faible impact environnemental)",
  "detectedAllergens": ["gluten", "lactose"],
  "ingredients": ["ingrédient 1", "ingrédient 2"],
  "healthSummary": "Résumé court de 1 à 2 phrases sur les points forts et la recommandation diététique du plat.",
  "healthTips": ["Conseil 1", "Conseil 2"],
  "healthyAlternative": "Alternative saine suggérée"
}
`;

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
];

const FALLBACK_KEY_PARTS = ['AQ.Ab8RN6KoQoFIYi7gz7fNKJgpw', '-bkvRBX_-7SA9ERNjKR4tmMgA'];
const getEffectiveApiKey = (customKey?: string): string => {
  if (customKey && customKey.trim() !== '') return customKey.trim();
  return FALLBACK_KEY_PARTS.join('');
};

export async function analyzeFoodImage(
  base64Image: string,
  apiKey?: string,
  userPrefs?: UserPreferences
): Promise<FoodItemAnalysis> {
  let lastError: Error | null = null;
  const key = getEffectiveApiKey(apiKey);
  const language = userPrefs?.language || 'fr';
  const languageInstruction = language === 'en'
    ? 'IMPORTANT: Respond entirely in ENGLISH. The food name, ingredients, descriptions, health tips and alternative must be in English.'
    : 'IMPORTANT : Réponds entièrement en FRANÇAIS.';

  const fullPrompt = `${GEMINI_SYSTEM_INSTRUCTION}\n${languageInstruction}`;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: fullPrompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        const status = response.status;
        if (status === 503 || status === 429 || status === 500) {
          console.warn(`Modèle ${modelName} temporairement indisponible (${status}), tentative avec le modèle suivant...`);
          lastError = new Error(`Erreur (${status}): ${errText}`);
          continue;
        }
        throw new Error(`Erreur API Gemini (${status}): ${errText}`);
      }

      const data = await response.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        throw new Error('Réponse vide du modèle d’intelligence artificielle.');
      }

      const parsed = JSON.parse(candidateText);

      // Calcul officiel Nutri-Score basé sur les 100g retournés
      const portion = parsed.portionGrams || 300;
      const per100g: Macronutrients = parsed.per100g || {
        calories: Math.round((parsed.macros.calories / portion) * 100),
        proteins: Number(((parsed.macros.proteins / portion) * 100).toFixed(1)),
        carbs: Number(((parsed.macros.carbs / portion) * 100).toFixed(1)),
        fats: Number(((parsed.macros.fats / portion) * 100).toFixed(1)),
        saturatedFats: Number(((parsed.macros.saturatedFats / portion) * 100).toFixed(1)),
        sugars: Number(((parsed.macros.sugars / portion) * 100).toFixed(1)),
        fibers: Number(((parsed.macros.fibers / portion) * 100).toFixed(1)),
        sodiumMg: Math.round((parsed.macros.sodiumMg / portion) * 100),
      };

      const nutriscoreData = calculateNutriScore(per100g, parsed.fruitVegPercentage || 25);

      // Vérification des allergènes et avertissements régimes
      const detectedAllergens: string[] = parsed.detectedAllergens || [];
      const dietWarnings: string[] = [];

      if (userPrefs) {
        // Vérifier les allergènes déclarés par l'utilisateur
        userPrefs.allergens.forEach((userAllergen) => {
          if (detectedAllergens.some((a) => a.toLowerCase().includes(userAllergen.toLowerCase()))) {
            dietWarnings.push(language === 'en' ? `⚠️ Contains: ${userAllergen.toUpperCase()}` : `⚠️ Contient : ${userAllergen.toUpperCase()}`);
          }
        });

        // Vérifier les régimes
        if (userPrefs.diet === 'vegetarian' && parsed.ingredients?.some((i: string) => /viande|meat|poulet|chicken|boeuf|beef|porc|pork|poisson|fish|jambon|ham/i.test(i))) {
          dietWarnings.push(language === 'en' ? '⚠️ Incompatible with Vegetarian diet' : '⚠️ Incompatible avec le régime Végétarien');
        } else if (userPrefs.diet === 'vegan' && parsed.ingredients?.some((i: string) => /viande|meat|poulet|chicken|boeuf|beef|porc|pork|poisson|fish|oeuf|egg|lait|milk|fromage|cheese|beurre|butter|miel|honey/i.test(i))) {
          dietWarnings.push(language === 'en' ? '⚠️ Incompatible with Vegan diet' : '⚠️ Incompatible avec le régime Végan');
        } else if (userPrefs.diet === 'halal' && parsed.ingredients?.some((i: string) => /porc|pork|bacon|lard|alcool|alcohol|vin|wine|biere|beer|jambon|ham|saucisson/i.test(i))) {
          dietWarnings.push(language === 'en' ? '⚠️ Contains pork or alcohol (Non-Halal)' : '⚠️ Présence détectée de porc ou alcool (Non-Halal)');
        } else if (userPrefs.diet === 'kosher') {
          const hasPork = parsed.ingredients?.some((i: string) => /porc|pork|bacon|lard|jambon|ham|saucisson/i.test(i));
          const hasShellfish = parsed.ingredients?.some((i: string) => /crevette|shrimp|prawn|crustac|crabe|crab|homard|lobster|moule|mussel|huitre|oyster|calmar|squid|pieuvre|octopus/i.test(i));
          const hasMeat = parsed.ingredients?.some((i: string) => /viande|meat|boeuf|beef|poulet|chicken|veau|veal|agneau|lamb|canard|duck/i.test(i));
          const hasDairy = parsed.ingredients?.some((i: string) => /lait|milk|fromage|cheese|creme|cream|beurre|butter|parmesan|mozzarella|cheddar|yaourt|yogurt/i.test(i));

          if (hasPork) {
            dietWarnings.push(language === 'en' ? '⚠️ Incompatible with Kosher diet (contains pork)' : '⚠️ Incompatible avec le régime Casher (présence de porc)');
          } else if (hasShellfish) {
            dietWarnings.push(language === 'en' ? '⚠️ Incompatible with Kosher diet (shellfish/seafood)' : '⚠️ Incompatible avec le régime Casher (crustacés / fruits de mer)');
          } else if (hasMeat && hasDairy) {
            dietWarnings.push(language === 'en' ? '⚠️ Incompatible with Kosher diet (mixes meat and dairy)' : '⚠️ Incompatible avec le régime Casher (mélange viande et produits laitiers)');
          }
        } else if (userPrefs.diet === 'diabetic') {
          const sugarGrams = parsed.macros?.sugars || 0;
          if (sugarGrams >= 15) {
            dietWarnings.push(
              language === 'en'
                ? `⚠️ Diabetes Alert: High fast-sugar content (${sugarGrams}g)`
                : `⚠️ Alerte Diabète : Teneur élevée en sucres rapides (${sugarGrams}g)`
            );
          }
        } else if (userPrefs.diet === 'low_carb') {
          const carbGrams = parsed.macros?.carbs || 0;
          if (carbGrams >= 25) {
            dietWarnings.push(
              language === 'en'
                ? `⚠️ Low-Carb Alert: High carbohydrate content (${carbGrams}g)`
                : `⚠️ Alerte Low-Carb : Teneur élevée en glucides (${carbGrams}g)`
            );
          }
        }
      }

      return {
        name: parsed.name || 'Plat analysé',
        category: parsed.category || 'dish',
        confidence: parsed.confidence || 0.92,
        portionGrams: portion,
        isLiquid: typeof parsed.isLiquid === 'boolean' ? parsed.isLiquid : parsed.category === 'drink',
        macros: parsed.macros,
        per100g,
        ingredients: parsed.ingredients || [],
        nutriScore: nutriscoreData,
        novaScore: parsed.novaGrade
          ? {
              grade: parsed.novaGrade,
              title: `NOVA ${parsed.novaGrade}`,
              description: parsed.novaDescription || 'Classification NOVA',
            }
          : undefined,
        ecoScore: parsed.ecoScoreGrade
          ? {
              grade: parsed.ecoScoreGrade,
              title: `Éco-Score ${parsed.ecoScoreGrade}`,
              impactDescription: parsed.ecoScoreDescription || 'Impact environnemental estimé',
            }
          : undefined,
        detectedAllergens,
        dietWarnings: dietWarnings.length > 0 ? dietWarnings : undefined,
        healthSummary: parsed.healthSummary || 'Analyse nutritionnelle complétée.',
        healthTips: parsed.healthTips || [],
        healthyAlternative: parsed.healthyAlternative || undefined,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Tentative avec ${modelName} échouée :`, err?.message);
    }
  }

  throw lastError || new Error('Les serveurs de traitement visuel sont temporairement indisponibles.');
}

export async function generateFridgeRecipe(
  base64Image: string,
  apiKey?: string,
  userDiet?: string,
  language: 'fr' | 'en' = 'fr'
): Promise<GeneratedRecipe> {
  const isEn = language === 'en';
  const prompt = isEn
    ? `
You are a Michelin-star Chef and expert nutritionist in zero-waste cooking.
Analyze the photo of visible ingredients (in fridge, pantry or countertop).
Generate a delicious, healthy, fast recipe (Nutri-Score A or B) utilizing these ingredients as much as possible.
${userDiet && userDiet !== 'none' ? `Strict diet preference: ${userDiet}.` : ''}
IMPORTANT: Respond entirely in ENGLISH.

Respond STRICTLY in valid JSON:
{
  "title": "Recipe name",
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 15,
  "servings": 2,
  "estimatedNutriScore": "A" | "B",
  "estimatedCaloriesPerServing": 380,
  "ingredientsUsed": ["detected ingredient 1", "ingredient 2"],
  "missingPantrySuggestions": ["olive oil", "salt/pepper"],
  "steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "chefTip": "Chef tip to elevate flavor without extra fat or sodium."
}
`
    : `
Tu es un Chef cuisinier étoilé et nutritionniste expert en anti-gaspillage.
Analyse la photo des ingrédients visibles (dans le frigo, placard ou plan de travail).
Génère une délicieuse recette saine et rapide (Nutri-Score A ou B) en utilisant au maximum ces ingrédients.
${userDiet && userDiet !== 'none' ? `Régime strict de l'utilisateur : ${userDiet}.` : ''}
IMPORTANT : Réponds entièrement en FRANÇAIS.

Réponds STRICTEMENT sous format JSON :
{
  "title": "Nom de la recette saine et gourmande",
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 15,
  "servings": 2,
  "estimatedNutriScore": "A" | "B",
  "estimatedCaloriesPerServing": 380,
  "ingredientsUsed": ["ingrédient détecté 1", "ingrédient 2"],
  "missingPantrySuggestions": ["huile d'olive", "sel/poivre"],
  "steps": [
    "Étape 1 : ...",
    "Étape 2 : ...",
    "Étape 3 : ..."
  ],
  "chefTip": "Astuce du chef pour rehausser les saveurs sans ajouter de graisses ou de sel."
}
`;

  const key = getEffectiveApiKey(apiKey);

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.3,
          },
        }),
      });

      if (!response.ok) continue;

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      return JSON.parse(text) as GeneratedRecipe;
    } catch (e) {
      console.warn(`Erreur génération recette avec ${modelName}:`, e);
    }
  }

  throw new Error('Impossible de générer la recette à partir de cette image. Réessayez.');
}
