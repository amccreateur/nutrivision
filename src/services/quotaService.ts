import AsyncStorage from '@react-native-async-storage/async-storage';

const QUOTA_KEY = '@nutrivision_scan_quota';
export const DAILY_FREE_SCANS = 5;
export const BONUS_SCANS_PER_VIDEO = 2;

interface StoredQuota {
  date: string; // YYYY-MM-DD
  usedToday: number;
  bonusScans: number;
}

export interface ScanQuota {
  usedToday: number;
  totalAvailable: number;
  remaining: number;
  isUnlimited: boolean;
  bonusScans: number;
}

const getTodayDateString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Récupère le quota actuel de scans pour la journée
 */
export async function getScanQuota(isPremium = false): Promise<ScanQuota> {
  if (isPremium) {
    return {
      usedToday: 0,
      totalAvailable: 9999,
      remaining: 9999,
      isUnlimited: true,
      bonusScans: 0,
    };
  }

  const today = getTodayDateString();
  try {
    const raw = await AsyncStorage.getItem(QUOTA_KEY);
    let stored: StoredQuota = { date: today, usedToday: 0, bonusScans: 0 };

    if (raw) {
      const parsed: StoredQuota = JSON.parse(raw);
      if (parsed.date === today) {
        stored = parsed;
      }
    }

    const totalAvailable = DAILY_FREE_SCANS + (stored.bonusScans || 0);
    const remaining = Math.max(0, totalAvailable - (stored.usedToday || 0));

    return {
      usedToday: stored.usedToday || 0,
      totalAvailable,
      remaining,
      isUnlimited: false,
      bonusScans: stored.bonusScans || 0,
    };
  } catch {
    return {
      usedToday: 0,
      totalAvailable: DAILY_FREE_SCANS,
      remaining: DAILY_FREE_SCANS,
      isUnlimited: false,
      bonusScans: 0,
    };
  }
}

/**
 * Consomme 1 scan IA si le quota le permet
 */
export async function consumeScan(isPremium = false): Promise<{ allowed: boolean; quota: ScanQuota }> {
  if (isPremium) {
    const quota = await getScanQuota(true);
    return { allowed: true, quota };
  }

  const today = getTodayDateString();
  try {
    const quota = await getScanQuota(false);
    if (quota.remaining <= 0) {
      return { allowed: false, quota };
    }

    const newUsed = quota.usedToday + 1;
    const stored: StoredQuota = {
      date: today,
      usedToday: newUsed,
      bonusScans: quota.bonusScans,
    };

    await AsyncStorage.setItem(QUOTA_KEY, JSON.stringify(stored));

    const updatedQuota: ScanQuota = {
      ...quota,
      usedToday: newUsed,
      remaining: Math.max(0, quota.totalAvailable - newUsed),
    };

    return { allowed: true, quota: updatedQuota };
  } catch {
    const fallbackQuota = await getScanQuota(false);
    return { allowed: true, quota: fallbackQuota };
  }
}

/**
 * Ajoute des scans bonus après le visionnage d'une publicité récompensée
 */
export async function addBonusScans(amount = BONUS_SCANS_PER_VIDEO): Promise<ScanQuota> {
  const today = getTodayDateString();
  try {
    const quota = await getScanQuota(false);
    const newBonus = quota.bonusScans + amount;

    const stored: StoredQuota = {
      date: today,
      usedToday: quota.usedToday,
      bonusScans: newBonus,
    };

    await AsyncStorage.setItem(QUOTA_KEY, JSON.stringify(stored));

    const totalAvailable = DAILY_FREE_SCANS + newBonus;
    return {
      usedToday: quota.usedToday,
      totalAvailable,
      remaining: Math.max(0, totalAvailable - quota.usedToday),
      isUnlimited: false,
      bonusScans: newBonus,
    };
  } catch {
    return await getScanQuota(false);
  }
}

