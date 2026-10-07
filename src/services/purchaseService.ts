import { NativeModules } from 'react-native';
import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesOffering,
    PurchasesOfferings,
    PurchasesPackage,
} from 'react-native-purchases';
import { getRevenueCatApiKey, REVENUECAT_CONFIG } from '../config/revenuecat';
import { savePreferences } from './storage';

let isInitialized = false;

/**
 * Vérifie si le module natif RevenueCat est disponible
 */
export function isPurchasesSupported(): boolean {
  try {
    return !!(
      NativeModules.RNPurchases ||
      NativeModules.Purchases
    );
  } catch {
    return false;
  }
}

/**
 * Vérifie si le CustomerInfo contient l'accès Pro
 */
export function checkIsPro(customerInfo: CustomerInfo | null | undefined): boolean {
  if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) {
    return false;
  }

  if (customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId]) {
    return true;
  }

  for (const id of REVENUECAT_CONFIG.fallbackEntitlementIds) {
    if (customerInfo.entitlements.active[id]) {
      return true;
    }
  }

  return false;
}

/**
 * Initialise le SDK RevenueCat en toute sécurité
 */
export async function initializePurchases(
  onStatusChange?: (isPro: boolean) => void
): Promise<boolean> {
  if (!isPurchasesSupported()) {
    return false;
  }

  try {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      return false;
    }

    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({ apiKey });
    isInitialized = true;

    Purchases.addCustomerInfoUpdateListener(async (info) => {
      const isPro = checkIsPro(info);
      await savePreferences({ isPremium: isPro });
      if (onStatusChange) {
        onStatusChange(isPro);
      }
    });

    const info = await Purchases.getCustomerInfo();
    const isPro = checkIsPro(info);
    if (isPro) {
      await savePreferences({ isPremium: true });
    }
    return isPro;
  } catch (error) {
    console.warn('RevenueCat non disponible ou en mode Expo Go :', error);
    return false;
  }
}

/**
 * Récupère les offres configurées sur RevenueCat
 */
export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  if (!isPurchasesSupported()) {
    return null;
  }

  try {
    if (!isInitialized) {
      await initializePurchases();
    }
    const offerings: PurchasesOfferings = await Purchases.getOfferings();
    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      return offerings.current;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Effectue l'achat d'un package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; isPro: boolean; userCancelled?: boolean; error?: string }> {
  if (!isPurchasesSupported()) {
    // Mode démo si le module natif n'est pas présent (Expo Go)
    await savePreferences({ isPremium: true });
    return { success: true, isPro: true };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = checkIsPro(customerInfo);
    if (isPro) {
      await savePreferences({ isPremium: true });
    }
    return { success: true, isPro };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, isPro: false, userCancelled: true };
    }
    return {
      success: false,
      isPro: false,
      error: error.message || "L'achat n'a pas pu être complété.",
    };
  }
}

/**
 * Restaure les achats de l'utilisateur
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isPro: boolean;
  error?: string;
}> {
  if (!isPurchasesSupported()) {
    return { success: false, isPro: false, error: 'Module In-App non disponible dans Expo Go.' };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = checkIsPro(customerInfo);
    await savePreferences({ isPremium: isPro });
    return { success: true, isPro };
  } catch (error: any) {
    return {
      success: false,
      isPro: false,
      error: error.message || 'Impossible de restaurer les achats.',
    };
  }
}
