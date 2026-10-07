import { Platform } from 'react-native';

/**
 * Configuration RevenueCat pour NutriVision Pro
 */
export const REVENUECAT_CONFIG = {
  // Clés API SDK publiques
  apiKey: {
    // Clés SDK officielles de production RevenueCat
    android: 'goog_fVeVMDlkrmAIyKpRlOnxaDcsKNK',
    ios: 'appl_DrSBqvlLQYpMnHOaaIExsJkEWsQ',
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

