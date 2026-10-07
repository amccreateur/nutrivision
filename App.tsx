import { Feather, Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { analyzeFoodImage, generateFridgeRecipe } from './src/services/aiVision';
import { fetchProductByBarcode } from './src/services/openFoodFacts';
import {
    addMealToHistory,
    addWaterLog,
    clearMealHistory,
    getDeviceLanguage,
    getMealHistory,
    getPreferences,
    getTodayWaterTotal,
    getWaterHistory,
    resetTodayWater,
    savePreferences,
} from './src/services/storage';
import { speakDishResult } from './src/services/voiceFeedback';
import {
    FoodItemAnalysis,
    GeneratedRecipe,
    MealHistoryItem,
    UserPreferences,
    UserProfile,
} from './src/types/nutrition';

import { CalorieCalculatorModal } from './src/components/CalorieCalculatorModal';
import { HistoryModal } from './src/components/HistoryModal';
import { OnboardingModal } from './src/components/OnboardingModal';
import { RadialMenu, RadialMenuItem } from './src/components/RadialMenu';
import { RecipeModal } from './src/components/RecipeModal';
import { ResultSheet } from './src/components/ResultSheet';
import { ScannerOverlay } from './src/components/ScannerOverlay';
import { SettingsModal } from './src/components/SettingsModal';
import { WaterTrackerModal } from './src/components/WaterTrackerModal';
import { getTranslation } from './src/i18n';

type ScanMode = 'dish' | 'fridge';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isAutoScan, setIsAutoScan] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<ScanMode>('dish');

  const [liveDetection, setLiveDetection] = useState<FoodItemAnalysis | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItemAnalysis | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [history, setHistory] = useState<MealHistoryItem[]>([]);
  const [todayWaterMl, setTodayWaterMl] = useState<number>(0);

  const [preferences, setPreferences] = useState<UserPreferences>({
    language: getDeviceLanguage(),
    dailyCalorieTarget: 2000,
    dailyWaterTargetMl: 2000,
    autoScanIntervalSeconds: 3,
    isAutoScanEnabled: false,
    useHaptics: true,
    enableBarcodeScanner: true,
    enableVoiceFeedback: true,
    allergens: [],
    diet: 'none',
    hasSeenOnboarding: false,
  });

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showWaterModal, setShowWaterModal] = useState<boolean>(false);
  const [showRecipeModal, setShowRecipeModal] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [showMandatoryProfileModal, setShowMandatoryProfileModal] = useState<boolean>(false);

  const cameraRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastBarcodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Charger les préférences, l'historique et l'eau au démarrage
  useEffect(() => {
    (async () => {
      const prefs = await getPreferences();
      setPreferences(prefs);
      setIsAutoScan(prefs.isAutoScanEnabled);

      if (!prefs.hasSeenOnboarding) {
        setShowOnboardingModal(true);
      } else if (!prefs.userProfile) {
        setShowMandatoryProfileModal(true);
      }

      const savedHistory = await getMealHistory();
      setHistory(savedHistory);

      const waterLogs = await getWaterHistory();
      setTodayWaterMl(getTodayWaterTotal(waterLogs));
    })();
  }, []);

  // Intervalle pour le Live Auto-Scan
  useEffect(() => {
    let intervalId: any = null;
    if (isAutoScan && permission?.granted && scanMode === 'dish') {
      intervalId = setInterval(() => {
        if (
          !isScanningRef.current &&
          !selectedFood &&
          !showHistoryModal &&
          !showSettingsModal &&
          !showWaterModal &&
          !showRecipeModal
        ) {
          captureAndAnalyze(true);
        }
      }, preferences.autoScanIntervalSeconds * 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    isAutoScan,
    scanMode,
    permission?.granted,
    preferences,
    selectedFood,
    showHistoryModal,
    showSettingsModal,
    showWaterModal,
    showRecipeModal,
  ]);

  // Handler de scan Code-Barres instantané (Open Food Facts)
  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (!preferences.enableBarcodeScanner || isScanningRef.current || selectedFood || scanMode !== 'dish') return;
    const now = Date.now();
    if (result.data === lastBarcodeRef.current.code && now - lastBarcodeRef.current.time < 3000) {
      return;
    }
    lastBarcodeRef.current = { code: result.data, time: now };

    try {
      isScanningRef.current = true;
      if (preferences.useHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      const product = await fetchProductByBarcode(result.data);
      if (product) {
        setLiveDetection(product);
        setSelectedFood(product);
        if (preferences.enableVoiceFeedback) {
          speakDishResult(product, preferences.language);
        }
      }
    } catch (e) {
      console.warn('Erreur scan code barre:', e);
    } finally {
      isScanningRef.current = false;
    }
  };

  const captureAndAnalyze = async (isLiveBackground = false) => {
    if (!cameraRef.current || isScanningRef.current) return;
    const t = getTranslation(preferences.language);

    try {
      isScanningRef.current = true;
      if (!isLiveBackground) {
        setIsAnalyzing(true);
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        isScanningRef.current = false;
        setIsAnalyzing(false);
        return;
      }

      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipResult.base64) {
        isScanningRef.current = false;
        setIsAnalyzing(false);
        return;
      }

      if (scanMode === 'fridge') {
        const recipe = await generateFridgeRecipe(
          manipResult.base64,
          preferences.apiKey,
          preferences.diet,
          preferences.language
        );
        if (preferences.useHaptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setGeneratedRecipe(recipe);
        setShowRecipeModal(true);
      } else {
        const analysis = await analyzeFoodImage(
          manipResult.base64,
          preferences.apiKey,
          preferences
        );
        analysis.photoUri = manipResult.uri;

        if (preferences.useHaptics) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        setLiveDetection(analysis);

        if (!isLiveBackground) {
          setSelectedFood(analysis);
          if (preferences.enableVoiceFeedback) {
            speakDishResult(analysis, preferences.language);
          }
        }
      }
    } catch (err: any) {
      console.warn('Erreur capture & analyse:', err?.message);
      if (!isLiveBackground) {
        Alert.alert(
          t.resultSheet.analysisFailedTitle,
          err?.message || t.resultSheet.analysisFailedDesc
        );
      }
    } finally {
      isScanningRef.current = false;
      setIsAnalyzing(false);
    }
  };

  const handleSaveToHistory = async (food: FoodItemAnalysis) => {
    const t = getTranslation(preferences.language);
    try {
      const saved = await addMealToHistory({
        dishName: food.name,
        calories: food.macros.calories,
        nutriScore: food.nutriScore.grade,
        novaGrade: food.novaScore?.grade,
        ecoScoreGrade: food.ecoScore?.grade,
        portionGrams: food.portionGrams,
        isLiquid: food.isLiquid,
        macros: food.macros,
        photoUri: food.photoUri,
        ingredients: food.ingredients,
      });
      setHistory((prev) => [saved, ...prev]);
      setSelectedFood(null);

      if (preferences.useHaptics) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const successMsg = t.resultSheet.saveSuccess
        .replace('{name}', food.name)
        .replace('{calories}', food.macros.calories.toString());
      Alert.alert(t.resultSheet.saveSuccessTitle, successMsg);
    } catch (e) {
      Alert.alert(t.resultSheet.saveErrorTitle, t.resultSheet.saveError);
    }
  };

  const handleAddWater = async (amountMl: number) => {
    if (preferences.useHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newTotal = await addWaterLog(amountMl);
    setTodayWaterMl(newTotal);
  };

  const handleResetWater = async () => {
    await resetTodayWater();
    setTodayWaterMl(0);
  };

  const handleClearHistory = async () => {
    await clearMealHistory();
    setHistory([]);
  };

  const handleUpdatePreferences = async (updated: Partial<UserPreferences>) => {
    const saved = await savePreferences(updated);
    setPreferences(saved);
  };

  const handleCompleteOnboarding = async () => {
    setShowOnboardingModal(false);
    if (!preferences.userProfile) {
      setShowMandatoryProfileModal(true);
    } else {
      const saved = await savePreferences({ hasSeenOnboarding: true });
      setPreferences(saved);
    }
  };

  const handleSaveMandatoryProfile = async (
    calorieTarget: number,
    waterTargetMl: number,
    profile: UserProfile
  ) => {
    setShowMandatoryProfileModal(false);
    const updated = await savePreferences({
      hasSeenOnboarding: true,
      dailyCalorieTarget: calorieTarget,
      dailyWaterTargetMl: waterTargetMl,
      userProfile: profile,
    });
    setPreferences(updated);
  };

  const t = getTranslation(preferences.language);

  // Demande de permission
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.permissionCard}>
          <Ionicons name="camera" size={50} color="#10B981" />
          <Text style={styles.permissionTitle}>{t.resultSheet.cameraRequiredTitle}</Text>
          <Text style={styles.permissionSubtitle}>
            {t.resultSheet.cameraRequiredDesc}
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{t.resultSheet.cameraPermissionBtn}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calcul des calories consommées aujourd'hui
  const today = new Date().setHours(0, 0, 0, 0);
  const todayMeals = history.filter((h) => h.timestamp >= today);
  const todayCalories = todayMeals.reduce((sum, h) => sum + h.calories, 0);

  // Configuration du Menu Camembert (Radial Action Menu)
  const radialMenuItems: RadialMenuItem[] = [
    {
      id: 'dish',
      iconName: 'silverware-fork-knife',
      iconType: 'material',
      label: t.modes.dish,
      color: '#10B981',
      isActive: scanMode === 'dish',
      onPress: () => setScanMode('dish'),
    },
    {
      id: 'fridge',
      iconName: 'fridge-outline',
      iconType: 'material',
      label: t.modes.fridge,
      color: '#38BDF8',
      isActive: scanMode === 'fridge',
      onPress: () => setScanMode('fridge'),
    },
    {
      id: 'water',
      iconName: 'water',
      iconType: 'ionicons',
      label: `${todayWaterMl} ${t.radial.water}`,
      color: '#0EA5E9',
      onPress: () => setShowWaterModal(true),
    },
    {
      id: 'calories',
      iconName: 'flame',
      iconType: 'ionicons',
      label: `${todayCalories} ${t.radial.calories}`,
      color: '#F59E0B',
      onPress: () => setShowHistoryModal(true),
    },
    {
      id: 'torch',
      iconName: torchOn ? 'flash' : 'flash-off',
      iconType: 'ionicons',
      label: torchOn ? t.radial.torchOn : t.radial.torchOff,
      color: torchOn ? '#FACC15' : '#94A3B8',
      isActive: torchOn,
      onPress: () => setTorchOn((prev) => !prev),
    },
    {
      id: 'flip',
      iconName: 'camera-reverse-outline',
      iconType: 'ionicons',
      label: t.radial.flipCamera,
      color: '#A78BFA',
      onPress: () => setFacing((prev) => (prev === 'back' ? 'front' : 'back')),
    },
    {
      id: 'autoscan',
      iconName: 'auto-fix',
      iconType: 'material',
      label: isAutoScan ? t.radial.autoScanOn : t.radial.autoScanOff,
      color: isAutoScan ? '#10B981' : '#94A3B8',
      isActive: isAutoScan,
      onPress: () => setIsAutoScan((prev) => !prev),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Live Camera View with Barcode scanning */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
        }}
        onBarcodeScanned={preferences.enableBarcodeScanner && scanMode === 'dish' ? handleBarcodeScanned : undefined}
      />

      {/* Menu Camembert Unique (Haut d'écran propre & épuré) */}
      <RadialMenu
        items={radialMenuItems}
        currentModeLabel={scanMode === 'dish' ? t.modes.dish : t.modes.fridge}
        currentModeIcon={scanMode === 'dish' ? 'silverware-fork-knife' : 'fridge-outline'}
        todayCalories={todayCalories}
        todayWaterMl={todayWaterMl}
        language={preferences.language}
      />

      {/* HUD Scanner Reticle & Status Hint */}
      <ScannerOverlay
        isAnalyzing={isAnalyzing}
        liveDetection={liveDetection}
        isAutoScan={isAutoScan}
        scanMode={scanMode}
        language={preferences.language}
      />

      {/* Barre de navigation basse épurée sans superposition */}
      <SafeAreaView style={styles.bottomDockContainer} pointerEvents="box-none">
        <View style={styles.dockBar}>
          {/* Bouton Journal */}
          <TouchableOpacity
            style={styles.dockSideButton}
            onPress={() => setShowHistoryModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="journal-outline" size={24} color="#CBD5E1" />
            <Text style={styles.dockButtonText}>{t.dock.journal}</Text>
          </TouchableOpacity>

          {/* Déclencheur Photo Central Intégré */}
          <TouchableOpacity
            style={[
              styles.shutterCenterButton,
              isAnalyzing && styles.shutterButtonLoading,
              scanMode === 'fridge' && { borderColor: '#38BDF8' },
            ]}
            onPress={() => captureAndAnalyze(false)}
            disabled={isAnalyzing}
            activeOpacity={0.8}
          >
            <View style={[styles.shutterInner, scanMode === 'fridge' && { backgroundColor: '#0EA5E9' }]}>
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="camera" size={28} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          {/* Bouton Réglages */}
          <TouchableOpacity
            style={styles.dockSideButton}
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="#CBD5E1" />
            <Text style={styles.dockButtonText}>{t.dock.settings}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Detail Result Bottom Sheet */}
      <ResultSheet
        visible={!!selectedFood}
        food={selectedFood}
        language={preferences.language}
        onClose={() => setSelectedFood(null)}
        onSaveToHistory={handleSaveToHistory}
      />

      {/* Recipe Modal (Frigo Anti-Gaspi) */}
      <RecipeModal
        visible={showRecipeModal}
        recipe={generatedRecipe}
        language={preferences.language}
        onClose={() => setShowRecipeModal(false)}
      />

      {/* Water Tracker Modal */}
      <WaterTrackerModal
        visible={showWaterModal}
        currentWaterMl={todayWaterMl}
        targetWaterMl={preferences.dailyWaterTargetMl || 2000}
        language={preferences.language}
        onClose={() => setShowWaterModal(false)}
        onAddWater={handleAddWater}
        onResetWater={handleResetWater}
      />

      {/* History Modal */}
      <HistoryModal
        visible={showHistoryModal}
        history={history}
        dailyTarget={preferences.dailyCalorieTarget}
        userProfile={preferences.userProfile}
        userDiet={preferences.diet}
        language={preferences.language}
        onClose={() => setShowHistoryModal(false)}
        onClear={handleClearHistory}
        onOpenCalculator={() => {
          setShowHistoryModal(false);
          setShowSettingsModal(true);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettingsModal}
        preferences={preferences}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleUpdatePreferences}
        onOpenOnboarding={() => {
          setShowSettingsModal(false);
          setShowOnboardingModal(true);
        }}
      />

      {/* Onboarding Welcome Walkthrough Modal */}
      <OnboardingModal
        visible={showOnboardingModal}
        language={preferences.language}
        onComplete={handleCompleteOnboarding}
      />

      {/* Mandatory Initial Profile Setup Modal */}
      <CalorieCalculatorModal
        visible={showMandatoryProfileModal}
        isMandatory={true}
        initialProfile={preferences.userProfile}
        language={preferences.language}
        onClose={() => {}}
        onApply={handleSaveMandatoryProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  permissionTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomDockContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 82 : 46,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  dockBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  dockSideButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    width: 68,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dockButtonText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  shutterCenterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  shutterButtonLoading: {
    borderColor: '#3B82F6',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
