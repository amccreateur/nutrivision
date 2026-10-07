import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getAdUnitIds } from '../config/admob';

interface Props {
  isPremium?: boolean;
}

let GoogleMobileAds: any = null;
try {
  GoogleMobileAds = require('react-native-google-mobile-ads');
} catch {
  GoogleMobileAds = null;
}

export const AdBannerComponent: React.FC<Props> = ({ isPremium = false }) => {
  const [hasError, setHasError] = useState(false);

  // Si l'utilisateur est Pro, ou erreur, ou dans Expo Go standard sans module natif
  if (isPremium || hasError || !GoogleMobileAds?.BannerAd) {
    return null;
  }

  try {
    const { BannerAd, BannerAdSize } = GoogleMobileAds;
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
