import { NativeModules } from 'react-native';
import { getAdUnitIds } from '../config/admob';

let isInitialized = false;
let interstitialAd: any = null;
let rewardedAd: any = null;
let isInterstitialLoaded = false;
let isRewardedLoaded = false;
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
 * Précharge l'annonce récompensée
 */
export function preloadRewarded(): void {
  if (!isAdMobNativeAvailable()) return;
  try {
    const mobileAdsModule = getMobileAdsModule();
    if (!mobileAdsModule) return;
    const { RewardedAd, RewardedAdEventType, AdEventType } = mobileAdsModule;

    const adUnitId = getAdUnitIds().rewardedId;
    rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      isRewardedLoaded = true;
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      // Récompense obtenue
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
 * Affiche l'annonce récompensée (ex: pour débloquer recette Frigo ou PDF).
 * Si l'annonce n'est pas prête ou échoue, on accorde quand même l'action pour ne jamais bloquer l'utilisateur.
 */
export async function showRewardedAdWithCallback(
  onRewardEarned: () => void,
  isPremium = false
): Promise<void> {
  if (isPremium) {
    onRewardEarned();
    return;
  }

  if (isRewardedLoaded && rewardedAd) {
    const mobileAdsModule = getMobileAdsModule();
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
        onRewardEarned();
      }
    });

    try {
      await rewardedAd.show();
    } catch (e) {
      console.warn('Erreur ouverture Rewarded, fallback direct :', e);
      onRewardEarned();
    }
  } else {
    // Si la pub n'était pas prête, ne pas bloquer l'utilisateur
    onRewardEarned();
    preloadRewarded();
  }
}
