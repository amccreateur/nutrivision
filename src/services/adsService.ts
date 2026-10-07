import { getAdUnitIds } from '../config/admob';

let isInitialized = false;
let interstitialAd: any = null;
let rewardedAd: any = null;
let isInterstitialLoaded = false;
let isRewardedLoaded = false;
let scanCounter = 0;

// Chargement sécurisé du module natif
let GoogleMobileAds: any = null;
try {
  GoogleMobileAds = require('react-native-google-mobile-ads');
} catch {
  GoogleMobileAds = null;
}

/**
 * Vérifie si le module natif AdMob est disponible
 */
export function isAdMobAvailable(): boolean {
  return !!GoogleMobileAds && typeof GoogleMobileAds.default === 'function';
}

/**
 * Initialise le SDK Google Mobile Ads
 */
export async function initializeAds(): Promise<void> {
  if (isInitialized || !isAdMobAvailable()) return;
  try {
    await GoogleMobileAds.default().initialize();
    isInitialized = true;
    preloadInterstitial();
    preloadRewarded();
  } catch (error) {
    console.warn('Erreur initialisation AdMob :', error);
  }
}

/**
 * Précharge l'annonce interstitielle
 */
export function preloadInterstitial(): void {
  if (!isAdMobAvailable()) return;
  try {
    const { InterstitialAd, AdEventType } = GoogleMobileAds;
    const adUnitId = getAdUnitIds().interstitialId;
    interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      isInterstitialLoaded = false;
      preloadInterstitial();
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
      isInterstitialLoaded = false;
      console.warn('Erreur chargement Interstitiel AdMob :', error);
    });

    interstitialAd.load();
  } catch (error) {
    console.warn('Erreur preload Interstitiel :', error);
  }
}

/**
 * Incrémente le compteur de scans et affiche un interstitiel tous les 2 scans si non-premium
 */
export function recordScanAndMaybeShowAd(isPremium = false): void {
  if (isPremium || !isAdMobAvailable()) return;
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
  if (!isAdMobAvailable()) return false;
  try {
    if (isInterstitialLoaded && interstitialAd) {
      interstitialAd.show();
      return true;
    }
  } catch (error) {
    console.warn('Erreur affichage Interstitiel :', error);
  }
  return false;
}

/**
 * Précharge l'annonce récompensée
 */
export function preloadRewarded(): void {
  if (!isAdMobAvailable()) return;
  try {
    const { RewardedAd, RewardedAdEventType, AdEventType } = GoogleMobileAds;
    const adUnitId = getAdUnitIds().rewardedId;
    rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      isRewardedLoaded = true;
    });

    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      isRewardedLoaded = false;
      preloadRewarded();
    });

    rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
      isRewardedLoaded = false;
      console.warn('Erreur chargement Rewarded AdMob :', error);
    });

    rewardedAd.load();
  } catch (error) {
    console.warn('Erreur preload Rewarded :', error);
  }
}

/**
 * Affiche l'annonce récompensée
 */
export async function showRewardedAdWithCallback(
  onRewardEarned: () => void,
  isPremium = false
): Promise<void> {
  if (isPremium || !isAdMobAvailable()) {
    onRewardEarned();
    return;
  }

  if (isRewardedLoaded && rewardedAd) {
    let earned = false;
    const { RewardedAdEventType, AdEventType } = GoogleMobileAds;

    const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });

    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribeEarned();
      unsubscribeClosed();
      onRewardEarned();
    });

    try {
      await rewardedAd.show();
    } catch (e) {
      console.warn('Erreur ouverture Rewarded, fallback direct :', e);
      onRewardEarned();
    }
  } else {
    onRewardEarned();
    preloadRewarded();
  }
}
