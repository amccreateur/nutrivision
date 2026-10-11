import React, { useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { getAdUnitIds } from '../config/admob';

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
  const [hasError, setHasError] = useState(false);

  if (isPremium || hasError || Platform.OS === 'web' || !BannerAd || !BannerAdSize) {
    return null;
  }

  try {
    const adUnitId = getAdUnitIds().bannerId;

    return (
      <View style={styles.container}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdFailedToLoad={(error: any) => {
            console.warn('[AdMob] Bannière de production en attente d’inventaire :', error?.message);
            setHasError(true);
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
