import React, { useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { getAdUnitIds, GOOGLE_TEST_IDS } from '../config/admob';

let BannerAd: any = null;
let BannerAdSize: any = null;

if (Platform.OS !== 'web') {
  try {
    const GoogleAds = require('react-native-google-mobile-ads');
    BannerAd = GoogleAds.BannerAd;
    BannerAdSize = GoogleAds.BannerAdSize;
  } catch (e) {
    // Non natif (Expo Go / web)
  }
}

interface Props {
  isPremium?: boolean;
}

export const AdBannerComponent: React.FC<Props> = ({ isPremium = false }) => {
  const [useFallback, setUseFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (isPremium || hasError || Platform.OS === 'web' || !BannerAd || !BannerAdSize) {
    return null;
  }

  try {
    const defaultUnitId = getAdUnitIds().bannerId;
    const fallbackUnitId = Platform.OS === 'ios' ? GOOGLE_TEST_IDS.ios.banner : GOOGLE_TEST_IDS.android.banner;
    const adUnitId = useFallback ? fallbackUnitId : defaultUnitId;

    return (
      <View style={styles.container}>
        <BannerAd
          key={adUnitId}
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdFailedToLoad={(error: any) => {
            console.warn(`[AdMob] Bannière (${useFallback ? 'Fallback Test' : 'Prod'}) failed:`, error?.message);
            if (!useFallback) {
              setUseFallback(true);
            } else {
              setHasError(true);
            }
          }}
        />
      </View>
    );
  } catch {
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
});
