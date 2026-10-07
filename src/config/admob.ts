import { Platform } from 'react-native';

/**
 * Identifiants de test officiels Google AdMob
 */
export const GOOGLE_TEST_IDS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
};

/**
 * Configuration des identifiants Google AdMob
 */
export const ADMOB_CONFIG = {
  android: {
    appId: 'ca-app-pub-5303925075056294~8454086880',
    bannerId: __DEV__ ? GOOGLE_TEST_IDS.android.banner : 'ca-app-pub-5303925075056294/9575596868',
    interstitialId: __DEV__ ? GOOGLE_TEST_IDS.android.interstitial : 'ca-app-pub-5303925075056294/4187538817',
    rewardedId: __DEV__ ? GOOGLE_TEST_IDS.android.rewarded : 'ca-app-pub-5303925075056294/8485876477',
  },
  ios: {
    appId: 'ca-app-pub-5303925075056294~4361789479',
    bannerId: __DEV__ ? GOOGLE_TEST_IDS.ios.banner : 'ca-app-pub-5303925075056294/1812656919',
    interstitialId: __DEV__ ? GOOGLE_TEST_IDS.ios.interstitial : 'ca-app-pub-5303925075056294/6403383470',
    rewardedId: __DEV__ ? GOOGLE_TEST_IDS.ios.rewarded : 'ca-app-pub-5303925075056294/2299742073',
  },
};

export const getAdUnitIds = () => {
  return Platform.OS === 'ios' ? ADMOB_CONFIG.ios : ADMOB_CONFIG.android;
};
