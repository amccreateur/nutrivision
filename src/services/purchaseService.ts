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
 * Vérifie si le CustomerInfo contient l'accès Pro
 */
export function checkIsPro(customerInfo: CustomerInfo | null | undefined): boolean {
  if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) {
    return false;
  }

  // Vérification sur l'ID principal
  if (customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId]) {
    return true;
  }

  // Vérification sur les variantes courantes
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
  try {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      console.warn('RevenueCat API key manquante.');
      return false;
    }

    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({ apiKey });
    isInitialized = true;

    // Écoute des mises à jour d'abonnements en direct (ex: renouvellement, annulation)
    Purchases.addCustomerInfoUpdateListener(async (info) => {
      const isPro = checkIsPro(info);
      await savePreferences({ isPremium: isPro });
      if (onStatusChange) {
        onStatusChange(isPro);
      }
    });

    // Vérification de l'état initial
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
 * Effectue l'achat d'un package (Mois, Année, À vie)
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; isPro: boolean; userCancelled?: boolean; error?: string }> {
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
 * Restaure les achats de l'utilisateur (utile lors d'un changement de téléphone)
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isPro: boolean;
  error?: string;
}> {
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

