import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Configuration des identifiants Google AdMob
 * En mode développement (__DEV__), on utilise automatiquement les TestIds officiels de Google
 * pour éviter tout risque de suspension de compte.
 */
export const ADMOB_CONFIG = {
  android: {
    appId: 'ca-app-pub-5303925075056294~8454086880',
    bannerId: __DEV__ ? TestIds.BANNER : 'ca-app-pub-5303925075056294/9575596868',
    interstitialId: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-5303925075056294/4187538817',
    rewardedId: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-5303925075056294/8485876477',
  },
  ios: {
    appId: 'ca-app-pub-5303925075056294~8454086880',
    bannerId: TestIds.BANNER,
    interstitialId: TestIds.INTERSTITIAL,
    rewardedId: TestIds.REWARDED,
  },
};

export const getAdUnitIds = () => {
  return Platform.OS === 'ios' ? ADMOB_CONFIG.ios : ADMOB_CONFIG.android;
};
