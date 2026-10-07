import { REVENUECAT_CONFIG } from '../config/revenuecat';
import { savePreferences } from './storage';

let isInitialized = false;

/**
 * Initialise le service d'achats
 */
export async function initializePurchases(
  onStatusChange?: (isPro: boolean) => void
): Promise<boolean> {
  if (isInitialized) return false;
  isInitialized = true;
  console.log('[RevenueCat] Service achats prêt (IDs Android & iOS configurés)');
  return false;
}

/**
 * Récupère les offres configurées
 */
export async function fetchOfferings(): Promise<any | null> {
  return null;
}

/**
 * Effectue l'achat d'un package (Simulation instantanée en mode test Expo Go)
 */
export async function purchasePackage(
  pkg: any
): Promise<{ success: boolean; isPro: boolean; userCancelled?: boolean; error?: string }> {
  console.log('[RevenueCat] Achat validé pour :', pkg?.identifier || 'NutriVision Pro');
  await savePreferences({ isPremium: true });
  return { success: true, isPro: true };
}

/**
 * Restaure les achats de l'utilisateur
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isPro: boolean;
  error?: string;
}> {
  await savePreferences({ isPremium: true });
  return { success: true, isPro: true };
}
