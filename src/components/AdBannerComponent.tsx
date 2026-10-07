import React, { useState } from 'react';
import { NativeModules, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdUnitIds } from '../config/admob';

interface Props {
  isPremium?: boolean;
}

const isAdMobSupported = (): boolean => {
  try {
    return !!(
      NativeModules.RNGoogleMobileAdsModule ||
      NativeModules.RNGoogleMobileAds
    );
  } catch {
    return false;
  }
};

export const AdBannerComponent: React.FC<Props> = ({ isPremium = false }) => {
  const [hasError, setHasError] = useState(false);

  // Si l'utilisateur est Pro, ou erreur, ou dans Expo Go standard sans module natif
  if (isPremium || hasError || !isAdMobSupported()) {
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
