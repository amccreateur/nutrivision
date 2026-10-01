import { FoodItemAnalysis, NutriScoreGrade } from '../types/nutrition';
import { calculateNutriScore } from './nutriscore';

/**
 * Service pour interroger la base mondiale Open Food Facts par code-barres (Gratuit & Sans Clé API)
 */
export async function fetchProductByBarcode(barcode: string): Promise<FoodItemAnalysis | null> {
  try {
    const cleanCode = barcode.trim();
    // Les codes-barres alimentaires sont numériques (EAN-8, EAN-13, UPC, etc.)
    // Si c'est un QR code contenant du JSON ou du texte non numérique, on ignore proprement
    if (!/^\d{6,14}$/.test(cleanCode)) {
      return null;
    }

    const url = `https://world.openfoodfacts.org/api/v2/product/${cleanCode}.json`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const product = data.product;
    const nutriments = product.nutriments || {};

    const calories100g = Math.round(
      nutriments['energy-kcal_100g'] ||
      (nutriments['energy-kj_100g'] ? nutriments['energy-kj_100g'] / 4.184 : 0) ||
      0
    );

    const proteins100g = Number((nutriments.proteins_100g || 0).toFixed(1));
    const carbs100g = Number((nutriments.carbohydrates_100g || 0).toFixed(1));
    const fats100g = Number((nutriments.fat_100g || 0).toFixed(1));
    const saturatedFats100g = Number((nutriments['saturated-fat_100g'] || 0).toFixed(1));
    const sugars100g = Number((nutriments.sugars_100g || 0).toFixed(1));
    const fibers100g = Number((nutriments.fiber_100g || 0).toFixed(1));
    const sodiumMg100g = Math.round((nutriments.sodium_100g || (nutriments.salt_100g ? nutriments.salt_100g / 2.5 : 0)) * 1000);

    const per100g = {
      calories: calories100g,
      proteins: proteins100g,
      carbs: carbs100g,
      fats: fats100g,
      saturatedFats: saturatedFats100g,
      sugars: sugars100g,
      fibers: fibers100g,
      sodiumMg: sodiumMg100g,
    };

    // Estimation ou extraction de la portion du paquet
    let servingGrams = 100;
    if (product.serving_quantity) {
      servingGrams = Number(product.serving_quantity);
    } else if (product.product_quantity) {
      servingGrams = Math.min(Number(product.product_quantity), 250);
    }

    const ratio = servingGrams / 100;
    const macros = {
      calories: Math.round(per100g.calories * ratio),
      proteins: Number((per100g.proteins * ratio).toFixed(1)),
      carbs: Number((per100g.carbs * ratio).toFixed(1)),
      fats: Number((per100g.fats * ratio).toFixed(1)),
      saturatedFats: Number((per100g.saturatedFats * ratio).toFixed(1)),
      sugars: Number((per100g.sugars * ratio).toFixed(1)),
      fibers: Number((per100g.fibers * ratio).toFixed(1)),
      sodiumMg: Math.round(per100g.sodiumMg * ratio),
    };

    // Grade officiel ou calculé
    let officialGrade: NutriScoreGrade = 'C';
    if (product.nutriscore_grade && ['a', 'b', 'c', 'd', 'e'].includes(product.nutriscore_grade.toLowerCase())) {
      officialGrade = product.nutriscore_grade.toUpperCase() as NutriScoreGrade;
    } else {
      officialGrade = calculateNutriScore(per100g, 20).grade;
    }

    const nutriscoreData = calculateNutriScore(per100g, 20);
    nutriscoreData.grade = officialGrade;

    // Nova & Eco-Score depuis Open Food Facts si disponible
    const novaGrade = product.nova_group && [1, 2, 3, 4].includes(Number(product.nova_group))
      ? (Number(product.nova_group) as 1 | 2 | 3 | 4)
      : undefined;

    const ecoScoreGrade = product.ecoscore_grade && ['a', 'b', 'c', 'd', 'e'].includes(product.ecoscore_grade.toLowerCase())
      ? (product.ecoscore_grade.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E')
      : undefined;

    const brand = product.brands ? ` (${product.brands})` : '';
    const productName = (product.product_name_fr || product.product_name || `Produit code ${cleanCode}`) + brand;

    const ingredients = product.ingredients_text_fr
      ? product.ingredients_text_fr.split(',').slice(0, 6).map((s: string) => s.trim())
      : [];

    return {
      name: productName,
      category: 'snack',
      confidence: 1.0,
      portionGrams: servingGrams,
      macros,
      per100g,
      ingredients,
      nutriScore: nutriscoreData,
      novaScore: novaGrade
        ? {
            grade: novaGrade,
            title: `NOVA ${novaGrade}`,
            description: 'Classification Open Food Facts',
          }
        : undefined,
      ecoScore: ecoScoreGrade
        ? {
            grade: ecoScoreGrade,
            title: `Éco-Score ${ecoScoreGrade}`,
            impactDescription: 'Impact environnemental officiel',
          }
        : undefined,
      healthSummary: `Produit certifié Open Food Facts. Nutri-Score officiel : ${officialGrade}.`,
      isBarcode: true,
      photoUri: product.image_url || undefined,
    };
  } catch (error) {
    console.warn('Erreur Open Food Facts:', error);
    return null;
  }
}

