import React, { useState } from 'react';
import { NativeModules, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdUnitIds } from '../config/admob';

interface Props {
  isPremium?: boolean;
}

// Vérifie si le module natif AdMob est présent (absent dans Expo Go standard)
const isAdMobSupported = (): boolean => {
  return !!(
    NativeModules.RNGoogleMobileAdsModule ||
    NativeModules.RNGoogleMobileAds
  );
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
          onAdFailedToLoad={(error) => {
            console.warn('Bannière AdMob failed to load :', error?.message);
            setHasError(true);
          }}
        />
      </View>
    );
  } catch (e) {
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
