import { Feather, Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
    NutriScoreGrade,
    UserPreferences,
} from './src/types/nutrition';

import { HistoryModal } from './src/components/HistoryModal';
import { RecipeModal } from './src/components/RecipeModal';
import { ResultSheet } from './src/components/ResultSheet';
import { ScannerOverlay } from './src/components/ScannerOverlay';
import { SettingsModal } from './src/components/SettingsModal';
import { WaterTrackerModal } from './src/components/WaterTrackerModal';

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
    dailyCalorieTarget: 2000,
    dailyWaterTargetMl: 2000,
    autoScanIntervalSeconds: 3,
    isAutoScanEnabled: false,
    useHaptics: true,
    enableBarcodeScanner: true,
    enableVoiceFeedback: true,
    allergens: [],
    diet: 'none',
  });

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showWaterModal, setShowWaterModal] = useState<boolean>(false);
  const [showRecipeModal, setShowRecipeModal] = useState<boolean>(false);

  const cameraRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastBarcodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Charger les préférences, l'historique et l'eau au démarrage
  useEffect(() => {
    (async () => {
      const prefs = await getPreferences();
      setPreferences(prefs);
      setIsAutoScan(prefs.isAutoScanEnabled);

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
          speakDishResult(product);
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

    try {
      isScanningRef.current = true;
      if (!isLiveBackground) {
        setIsAnalyzing(true);
      }

      // Capture de la photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        isScanningRef.current = false;
        setIsAnalyzing(false);
        return;
      }

      // Compression & Redimensionnement ultra-rapide (< 100kb)
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
        // Mode Frigo & Anti-Gaspi
        const recipe = await generateFridgeRecipe(
          manipResult.base64,
          preferences.apiKey,
          preferences.diet
        );
        if (preferences.useHaptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setGeneratedRecipe(recipe);
        setShowRecipeModal(true);
      } else {
        // Mode Assiette / Plat classique
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
            speakDishResult(analysis);
          }
        }
      }
    } catch (err: any) {
      console.warn('Erreur capture & analyse:', err?.message);
      if (!isLiveBackground) {
        Alert.alert(
          'Analyse impossible',
          err?.message || 'Veuillez vérifier votre cadrage ou votre connexion.'
        );
      }
    } finally {
      isScanningRef.current = false;
      setIsAnalyzing(false);
    }
  };

  const handleSaveToHistory = async (food: FoodItemAnalysis) => {
    try {
      const saved = await addMealToHistory({
        dishName: food.name,
        calories: food.macros.calories,
        nutriScore: food.nutriScore.grade,
        novaGrade: food.novaScore?.grade,
        ecoScoreGrade: food.ecoScore?.grade,
        portionGrams: food.portionGrams,
        macros: food.macros,
        photoUri: food.photoUri,
        ingredients: food.ingredients,
      });
      setHistory((prev) => [saved, ...prev]);
      setSelectedFood(null);

      if (preferences.useHaptics) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Succès !', `${food.name} (${food.macros.calories} kcal) a été ajouté à votre journée.`);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d’enregistrer le repas.');
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
          <Feather name="camera" size={50} color="#10B981" />
          <Text style={styles.permissionTitle}>Accès Caméra Requis</Text>
          <Text style={styles.permissionSubtitle}>
            NutriVision a besoin de la caméra pour analyser vos plats, identifier les aliments et calculer le Nutri-Score en direct.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calcul des calories consommées aujourd'hui
  const today = new Date().setHours(0, 0, 0, 0);
  const todayMeals = history.filter((h) => h.timestamp >= today);
  const todayCalories = todayMeals.reduce((sum, h) => sum + h.calories, 0);

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

      {/* Floating Header Badges (Calories + Eau + Mode Switch) */}
      <SafeAreaView style={styles.topSummaryOverlay} pointerEvents="box-none">
        <View style={styles.topBadgesRow}>
          {/* Badge Calories */}
          <TouchableOpacity
            style={styles.summaryBadge}
            onPress={() => setShowHistoryModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="flame" size={15} color="#F59E0B" />
            <Text style={styles.calorieCounterText}>
              {todayCalories}/{preferences.dailyCalorieTarget} kcal
            </Text>
          </TouchableOpacity>

          {/* Badge Eau */}
          <TouchableOpacity
            style={[styles.summaryBadge, { borderColor: 'rgba(14, 165, 233, 0.3)' }]}
            onPress={() => setShowWaterModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="water" size={15} color="#0EA5E9" />
            <Text style={[styles.calorieCounterText, { color: '#38BDF8' }]}>
              {todayWaterMl}/{preferences.dailyWaterTargetMl || 2000} ml
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode Selector (Plat vs Frigo) */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeBtn, scanMode === 'dish' && styles.modeBtnActive]}
            onPress={() => setScanMode('dish')}
          >
            <Text style={[styles.modeBtnText, scanMode === 'dish' && styles.modeBtnTextActive]}>
              🍽️ Plat / Assiette
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, scanMode === 'fridge' && styles.modeBtnActive]}
            onPress={() => setScanMode('fridge')}
          >
            <Text style={[styles.modeBtnText, scanMode === 'fridge' && styles.modeBtnTextActive]}>
              🥦 Frigo Anti-Gaspi
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* HUD Scanner Controls and Reticle */}
      <ScannerOverlay
        isAnalyzing={isAnalyzing}
        liveDetection={liveDetection}
        torchOn={torchOn}
        onToggleTorch={() => setTorchOn((prev) => !prev)}
        onFlipCamera={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
        onManualCapture={() => captureAndAnalyze(false)}
        isAutoScan={isAutoScan}
        onToggleAutoScan={() => setIsAutoScan((prev) => !prev)}
      />

      {/* Bottom Navigation Dock */}
      <SafeAreaView style={styles.bottomDockContainer} pointerEvents="box-none">
        <View style={styles.dockBar}>
          <TouchableOpacity
            style={styles.dockButton}
            onPress={() => setShowHistoryModal(true)}
          >
            <Ionicons name="journal-outline" size={22} color="#CBD5E1" />
            <Text style={styles.dockButtonText}>Journal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dockButton}
            onPress={() => setShowWaterModal(true)}
          >
            <Ionicons name="water-outline" size={22} color="#38BDF8" />
            <Text style={[styles.dockButtonText, { color: '#38BDF8' }]}>Eau</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dockButton}
            onPress={() => setShowSettingsModal(true)}
          >
            <Ionicons name="settings-outline" size={22} color="#CBD5E1" />
            <Text style={styles.dockButtonText}>Réglages</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Detail Result Bottom Sheet */}
      <ResultSheet
        visible={!!selectedFood}
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        onSaveToHistory={handleSaveToHistory}
      />

      {/* Recipe Modal (Frigo Anti-Gaspi) */}
      <RecipeModal
        visible={showRecipeModal}
        recipe={generatedRecipe}
        onClose={() => setShowRecipeModal(false)}
      />

      {/* Water Tracker Modal */}
      <WaterTrackerModal
        visible={showWaterModal}
        currentWaterMl={todayWaterMl}
        targetWaterMl={preferences.dailyWaterTargetMl || 2000}
        onClose={() => setShowWaterModal(false)}
        onAddWater={handleAddWater}
        onResetWater={handleResetWater}
      />

      {/* History Modal */}
      <HistoryModal
        visible={showHistoryModal}
        history={history}
        dailyTarget={preferences.dailyCalorieTarget}
        onClose={() => setShowHistoryModal(false)}
        onClear={handleClearHistory}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettingsModal}
        preferences={preferences}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleUpdatePreferences}
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
  topSummaryOverlay: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  topBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 5,
  },
  calorieCounterText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeBtnActive: {
    backgroundColor: '#10B981',
  },
  modeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomDockContainer: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  dockBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  dockButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dockButtonText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
});
