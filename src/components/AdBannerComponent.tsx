import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdUnitIds } from '../config/admob';

interface Props {
  isPremium?: boolean;
}

export const AdBannerComponent: React.FC<Props> = ({ isPremium = false }) => {
  const [hasError, setHasError] = useState(false);

  if (isPremium || hasError) {
    return null;
  }

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
          console.warn('Bannière AdMob failed to load :', error.message);
          setHasError(true);
        }}
      />
    </View>
  );
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
