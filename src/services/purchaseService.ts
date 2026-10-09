import { NativeModules } from 'react-native';
import type {
    CustomerInfo,
    PurchasesOffering,
    PurchasesOfferings,
    PurchasesPackage,
} from 'react-native-purchases';
import { getRevenueCatApiKey, REVENUECAT_CONFIG } from '../config/revenuecat';
import { savePreferences } from './storage';

let isInitialized = false;

const isPurchasesNativeAvailable = (): boolean => {
  try {
    return NativeModules.RNPurchases != null;
  } catch {
    return false;
  }
};

const getPurchasesModule = () => {
  if (!isPurchasesNativeAvailable()) return null;
  try {
    const mod = require('react-native-purchases');
    return mod.default || mod;
  } catch {
    return null;
  }
};

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
 * Initialise le SDK RevenueCat
 */
export async function initializePurchases(
  onStatusChange?: (isPro: boolean) => void
): Promise<boolean> {
  const Purchases = getPurchasesModule();
  if (!Purchases) {
    console.warn('RevenueCat natif non disponible (mode Expo Go/Web).');
    return false;
  }
  try {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      console.warn('RevenueCat API key manquante.');
      return false;
    }

    if (__DEV__ && Purchases.LOG_LEVEL) {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({ apiKey });
    isInitialized = true;

    // Écoute des mises à jour d'abonnements en direct
    Purchases.addCustomerInfoUpdateListener(async (info: CustomerInfo) => {
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
    console.warn('Erreur initialisation RevenueCat :', error);
    return false;
  }
}

/**
 * Récupère les offres configurées sur RevenueCat
 */
export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  const Purchases = getPurchasesModule();
  if (!Purchases) return null;
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
    console.warn('Erreur récupération des offres RevenueCat :', error);
    return null;
  }
}

/**
 * Effectue l'achat d'un package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; isPro: boolean; userCancelled?: boolean; error?: string }> {
  const Purchases = getPurchasesModule();
  if (!Purchases) {
    return { success: false, isPro: false, error: 'Module d\'achat non disponible en mode développement.' };
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
  const Purchases = getPurchasesModule();
  if (!Purchases) {
    return { success: false, isPro: false, error: 'Module d\'achat non disponible en mode développement.' };
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
