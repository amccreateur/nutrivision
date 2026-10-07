import React from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  isPremium?: boolean;
}

export const AdBannerComponent: React.FC<Props> = ({ isPremium = false }) => {
  if (isPremium) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* En production EAS / APK, la bannière native s'affiche ici */}
    </View>
  );
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
