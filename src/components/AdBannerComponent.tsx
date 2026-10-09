import React, { useState } from 'react';
import { NativeModules, StyleSheet, UIManager, View } from 'react-native';
import { getAdUnitIds } from '../config/admob';

interface Props {
  isPremium?: boolean;
}

const isBannerSupported = (): boolean => {
  try {
    return (
      NativeModules.RNGoogleMobileAdsModule != null ||
      (UIManager.getViewManagerConfig && UIManager.getViewManagerConfig('RNGoogleMobileAdsBannerView') != null)
    );
  } catch {
    return false;
  }
};

export const AdBannerComponent: React.FC<Props> = ({ isPremium = false }) => {
  const [hasError, setHasError] = useState(false);

  if (isPremium || hasError || !isBannerSupported()) {
    return null;
  }

  try {
    const { BannerAd, BannerAdSize } = require('react-native-google-mobile-ads');
    const adUnitId = getAdUnitIds().bannerId;

    return (
      <View style={styles.container}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdFailedToLoad={(error: any) => {
            console.warn('Bannière AdMob failed to load :', error?.message);
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
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
});
