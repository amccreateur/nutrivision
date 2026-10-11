import { NativeModules, Platform } from 'react-native';
import { getAdUnitIds } from '../config/admob';

let isInitialized = false;
let interstitialAd: any = null;
let rewardedAd: any = null;
let isInterstitialLoaded = false;
let isRewardedLoaded = false;
let isRewardedLoading = false;
let scanCounter = 0;

const isAdMobNativeAvailable = (): boolean => {
  try {
    return NativeModules.RNGoogleMobileAdsModule != null;
  } catch {
    return false;
  }
};

const getMobileAdsModule = () => {
  if (!isAdMobNativeAvailable()) return null;
  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
};

/**
 * Initialise le SDK Google Mobile Ads en production
 */
export async function initializeAds(): Promise<void> {
  if (isInitialized || !isAdMobNativeAvailable()) return;
  try {
    const mobileAdsModule = getMobileAdsModule();
    if (!mobileAdsModule) return;
    const mobileAds = mobileAdsModule.default || mobileAdsModule;
    await mobileAds().initialize();
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
  if (!isAdMobNativeAvailable()) return;
  try {
    const mobileAdsModule = getMobileAdsModule();
    if (!mobileAdsModule) return;
    const { InterstitialAd, AdEventType } = mobileAdsModule;

    const adUnitId = getAdUnitIds().interstitialId;
    interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      isInterstitialLoaded = false;
      preloadInterstitial(); // Recharger pour la prochaine fois
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
  if (isPremium) return;
  scanCounter++;

  // Affiche une publicité tous les 2 scans
  if (scanCounter >= 2) {
    scanCounter = 0;
    showInterstitialIfReady();
  }
}

/**
 * Tente d'afficher l'interstitiel
 */
export function showInterstitialIfReady(): boolean {
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
 * Précharge l'annonce récompensée de production.
 */
export function preloadRewarded(): void {
  if (!isAdMobNativeAvailable()) return;
  try {
    const mobileAdsModule = getMobileAdsModule();
    if (!mobileAdsModule) return;
    const { RewardedAd, RewardedAdEventType, AdEventType } = mobileAdsModule;

    const adUnitId = getAdUnitIds().rewardedId;
    isRewardedLoading = true;

    rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      isRewardedLoaded = true;
      isRewardedLoading = false;
      console.log('[AdMob] Rewarded Ad de production chargée avec succès');
    });

    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      isRewardedLoaded = false;
      isRewardedLoading = false;
      preloadRewarded(); // Recharger pour la prochaine fois
    });

    rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
      isRewardedLoaded = false;
      isRewardedLoading = false;
      console.warn('[AdMob] Rewarded Ad de production en attente d’inventaire :', error);
    });

    rewardedAd.load();
  } catch (error) {
    isRewardedLoading = false;
    console.warn('Erreur preload Rewarded :', error);
  }
}

/**
 * Affiche l'annonce récompensée réelle.
 * Accorde la récompense UNIQUEMENT si l'utilisateur a regardé la vidéo jusqu'au bout.
 */
export async function showRewardedAdWithCallback(
  onRewardEarned: () => void,
  onAdFailedOrIsPremium?: ((reason: 'incomplete' | 'not_ready' | 'error') => void) | boolean,
  isPremium = false
): Promise<void> {
  const actualIsPremium = typeof onAdFailedOrIsPremium === 'boolean' ? onAdFailedOrIsPremium : isPremium;
  const onAdFailed = typeof onAdFailedOrIsPremium === 'function' ? onAdFailedOrIsPremium : undefined;

  if (actualIsPremium) {
    onRewardEarned();
    return;
  }

  const mobileAdsModule = getMobileAdsModule();
  if (!mobileAdsModule) {
    onAdFailed?.('error');
    return;
  }

  // 1. Si pas encore chargée, lui laisser jusqu'à 4s pour télécharger
  if (!isRewardedLoaded || !rewardedAd) {
    if (!isRewardedLoading) {
      preloadRewarded();
    }
    let waited = 0;
    while (!isRewardedLoaded && waited < 4000) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      waited += 250;
    }
  }

  // 2. Affichage si prête
  if (isRewardedLoaded && rewardedAd) {
    const earnedEventType = mobileAdsModule?.RewardedAdEventType?.EARNED_REWARD || 'rewarded_earned_reward';
    const closedEventType = mobileAdsModule?.AdEventType?.CLOSED || 'closed';

    let earned = false;
    const unsubscribeEarned = rewardedAd.addAdEventListener(earnedEventType, () => {
      earned = true;
    });

    const unsubscribeClosed = rewardedAd.addAdEventListener(closedEventType, () => {
      unsubscribeEarned();
      unsubscribeClosed();
      if (earned) {
        onRewardEarned();
      } else {
        onAdFailed?.('incomplete');
      }
    });

    try {
      await rewardedAd.show();
    } catch (e) {
      console.warn('Erreur affichage Rewarded :', e);
      onAdFailed?.('error');
    }
  } else {
    // Aucune pub en stock chez AdMob pour l'instant
    preloadRewarded();
    onAdFailed?.('not_ready');
  }
}
