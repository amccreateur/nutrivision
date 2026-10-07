import { Platform } from 'react-native';

/**
 * Configuration RevenueCat pour NutriVision Pro
 */
export const REVENUECAT_CONFIG = {
  // Clés API SDK publiques
  apiKey: {
    // Clé Test Store RevenueCat ou clés spécifiques par plateforme
    android: 'test_RWtnHJXzfzMljyuTRfIyxpbpHTd',
    ios: 'test_RWtnHJXzfzMljyuTRfIyxpbpHTd',
  },
  // Identifiant de l'entitlement configuré dans RevenueCat
  entitlementId: 'NutriVision Pro',
  // Fallback si l'entitlement a été nommé nutrivision_pro ou pro
  fallbackEntitlementIds: ['NutriVision Pro', 'nutrivision_pro', 'pro', 'premium'],
};

export const getRevenueCatApiKey = (): string => {
  return Platform.OS === 'ios'
    ? REVENUECAT_CONFIG.apiKey.ios
    : REVENUECAT_CONFIG.apiKey.android;
};
