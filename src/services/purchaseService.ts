import { getRevenueCatApiKey, REVENUECAT_CONFIG } from '../config/revenuecat';
import { savePreferences } from './storage';

let isInitialized = false;

let PurchasesModule: any = null;
try {
  PurchasesModule = require('react-native-purchases');
} catch {
  PurchasesModule = null;
}

const getPurchases = () => {
  return PurchasesModule?.default || PurchasesModule;
};

/**
 * Vérifie si le module natif RevenueCat est disponible
 */
export function isPurchasesSupported(): boolean {
  const p = getPurchases();
  return !!p && typeof p.configure === 'function';
}

/**
 * Vérifie si le CustomerInfo contient l'accès Pro
 */
export function checkIsPro(customerInfo: any): boolean {
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
    const Purchases = getPurchases();
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      return false;
    }

    if (__DEV__ && PurchasesModule?.LOG_LEVEL) {
      await Purchases.setLogLevel(PurchasesModule.LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({ apiKey });
    isInitialized = true;

    Purchases.addCustomerInfoUpdateListener(async (info: any) => {
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
export async function fetchOfferings(): Promise<any | null> {
  if (!isPurchasesSupported()) {
    return null;
  }

  try {
    const Purchases = getPurchases();
    if (!isInitialized) {
      await initializePurchases();
    }
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      return offerings.current;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Effectue l'achat d'un package
 */
export async function purchasePackage(
  pkg: any
): Promise<{ success: boolean; isPro: boolean; userCancelled?: boolean; error?: string }> {
  if (!isPurchasesSupported()) {
    await savePreferences({ isPremium: true });
    return { success: true, isPro: true };
  }

  try {
    const Purchases = getPurchases();
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
    const Purchases = getPurchases();
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
