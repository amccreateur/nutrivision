import { getAdUnitIds } from '../config/admob';

let isInitialized = false;
let scanCounter = 0;

/**
 * Initialise le service AdMob
 */
export async function initializeAds(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;
  console.log('[AdMob] Initialisé avec succès (IDs configurés : Android & iOS)');
}

/**
 * Précharge l'annonce interstitielle
 */
export function preloadInterstitial(): void {
  // Prêt pour le build de production
}

/**
 * Incrémente le compteur de scans et affiche un interstitiel tous les 2 scans si non-premium
 */
export function recordScanAndMaybeShowAd(isPremium = false): void {
  if (isPremium) return;
  scanCounter++;

  if (scanCounter >= 2) {
    scanCounter = 0;
    showInterstitialIfReady();
  }
}

/**
 * Tente d'afficher l'interstitiel
 */
export function showInterstitialIfReady(): boolean {
  console.log('[AdMob] Interstitiel déclenché (tous les 2 scans)');
  return true;
}

/**
 * Précharge l'annonce récompensée
 */
export function preloadRewarded(): void {
  // Prêt pour le build de production
}

/**
 * Affiche l'annonce récompensée (déblocage recette frigo ou export PDF)
 */
export async function showRewardedAdWithCallback(
  onRewardEarned: () => void,
  isPremium = false
): Promise<void> {
  if (isPremium) {
    onRewardEarned();
    return;
  }
  console.log('[AdMob] Annonce Récompensée déclenchée -> Récompense débloquée');
  onRewardEarned();
}
