import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealHistoryItem, UserPreferences, WaterLogItem } from '../types/nutrition';

const HISTORY_KEY = '@nutrivision_meal_history';
const PREFS_KEY = '@nutrivision_user_preferences';
const WATER_KEY = '@nutrivision_water_history';

const DEFAULT_PREFS: UserPreferences = {
  apiKey: '',
  dailyCalorieTarget: 2000,
  dailyWaterTargetMl: 2000,
  autoScanIntervalSeconds: 2,
  isAutoScanEnabled: false,
  useHaptics: true,
  enableBarcodeScanner: true,
  enableVoiceFeedback: true,
  allergens: [],
  diet: 'none',
  hasSeenOnboarding: false,
};

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      apiKey: parsed.apiKey && parsed.apiKey.trim() !== '' ? parsed.apiKey : DEFAULT_PREFS.apiKey,
      allergens: parsed.allergens || [],
      diet: parsed.diet || 'none',
      dailyWaterTargetMl: parsed.dailyWaterTargetMl || 2000,
      enableVoiceFeedback: parsed.enableVoiceFeedback !== undefined ? parsed.enableVoiceFeedback : true,
      userProfile: parsed.userProfile,
      hasSeenOnboarding: parsed.hasSeenOnboarding !== undefined ? parsed.hasSeenOnboarding : false,
    };
  } catch (e) {
    return DEFAULT_PREFS;
  }
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  try {
    const current = await getPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return DEFAULT_PREFS;
  }
}

export async function getMealHistory(): Promise<MealHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export async function addMealToHistory(meal: Omit<MealHistoryItem, 'id' | 'timestamp'>): Promise<MealHistoryItem> {
  try {
    const history = await getMealHistory();
    const newMeal: MealHistoryItem = {
      ...meal,
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      timestamp: Date.now(),
    };
    const updated = [newMeal, ...history].slice(0, 100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return newMeal;
  } catch (e) {
    throw e;
  }
}

export async function clearMealHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {}
}

export async function getWaterHistory(): Promise<WaterLogItem[]> {
  try {
    const raw = await AsyncStorage.getItem(WATER_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export async function addWaterLog(amountMl: number): Promise<number> {
  try {
    const history = await getWaterHistory();
    const newLog: WaterLogItem = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      timestamp: Date.now(),
      amountMl,
    };
    const updated = [newLog, ...history].slice(0, 200);
    await AsyncStorage.setItem(WATER_KEY, JSON.stringify(updated));
    return getTodayWaterTotal(updated);
  } catch (e) {
    return 0;
  }
}

export function getTodayWaterTotal(logs: WaterLogItem[]): number {
  const startOfDay = new Date().setHours(0, 0, 0, 0);
  return logs
    .filter((log) => log.timestamp >= startOfDay)
    .reduce((sum, item) => sum + item.amountMl, 0);
}

export async function resetTodayWater(): Promise<void> {
  try {
    const history = await getWaterHistory();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const filtered = history.filter((log) => log.timestamp < startOfDay);
    await AsyncStorage.setItem(WATER_KEY, JSON.stringify(filtered));
  } catch (e) {}
}
