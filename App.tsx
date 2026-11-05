import { Feather, Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    LogBox,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

LogBox.ignoreLogs([
  'Internal React error: Expected static flag',
  'Internal React error',
]);

import { analyzeFoodImage } from './src/services/aiVision';
import { fetchProductByBarcode } from './src/services/openFoodFacts';
import {
    initializeAds,
    recordScanAndMaybeShowAd,
    showAppOpenAdIfReady,
} from './src/services/adsService';
import { initializePurchases } from './src/services/purchaseService';
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
    MealHistoryItem,
    UserPreferences,
    UserProfile,
} from './src/types/nutrition';
import {
  getScanQuota,
  consumeScan,
  getBarcodeQuota,
  consumeBarcodeScan,
  ScanQuota,
} from './src/services/quotaService';

import { AdBannerComponent } from './src/components/AdBannerComponent';
import { CalorieCalculatorModal } from './src/components/CalorieCalculatorModal';
import { HistoryModal } from './src/components/HistoryModal';
import { OnboardingModal } from './src/components/OnboardingModal';
import { PaywallModal } from './src/components/PaywallModal';
import { RadialMenu, RadialMenuItem } from './src/components/RadialMenu';
import { ResultSheet } from './src/components/ResultSheet';
import { ScannerOverlay } from './src/components/ScannerOverlay';
import { ScanQuotaModal } from './src/components/ScanQuotaModal';
import { SettingsModal } from './src/components/SettingsModal';
import { VoiceInputModal } from './src/components/VoiceInputModal';
import { WaterTrackerModal } from './src/components/WaterTrackerModal';
import { getTranslation } from './src/i18n';

export default function App() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLargeScreen = screenWidth >= 400; // iPhone Plus, Pro Max, grands Android
  const isTablet = screenWidth >= 600;

  // Tailles dynamiques adaptatives pour une ergonomie parfaite sur toutes les tailles d'écran
  const dockMaxWidth = isTablet ? 480 : Math.min(screenWidth * 0.94, 420);
  const sideBtnWidth = isTablet ? 84 : isLargeScreen ? 76 : 68;
  const sideBtnHeight = isTablet ? 66 : isLargeScreen ? 62 : 56;
  const dockIconSize = isTablet ? 28 : isLargeScreen ? 26 : 24;
  const dockTextSize = isTablet ? 13 : isLargeScreen ? 12 : 11;
  const shutterOuterSize = isTablet ? 88 : isLargeScreen ? 82 : 76;
  const shutterInnerSize = isTablet ? 72 : isLargeScreen ? 66 : 60;
  const shutterIconSize = isTablet ? 32 : isLargeScreen ? 30 : 28;
  const bottomControlsBottom = Platform.OS === 'android'
    ? (screenHeight > 800 ? 54 : 36)
    : (screenHeight > 840 ? 34 : 20);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isAutoScan, setIsAutoScan] = useState<boolean>(false);

  const [liveDetection, setLiveDetection] = useState<FoodItemAnalysis | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItemAnalysis | null>(null);
  const [history, setHistory] = useState<MealHistoryItem[]>([]);
  const [todayWaterMl, setTodayWaterMl] = useState<number>(0);
  const scanBoxLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const [scanQuota, setScanQuota] = useState<ScanQuota>({
    usedToday: 0,
    totalAvailable: 2,
    remaining: 2,
    isUnlimited: false,
    bonusScans: 0,
  });

  const [barcodeQuota, setBarcodeQuota] = useState<ScanQuota>({
    usedToday: 0,
    totalAvailable: 5,
    remaining: 5,
    isUnlimited: false,
    bonusScans: 0,
  });

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
    diets: [],
    hasSeenOnboarding: false,
  });

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showWaterModal, setShowWaterModal] = useState<boolean>(false);
  const [showQuotaModal, setShowQuotaModal] = useState<boolean>(false);
  const [showBarcodeQuotaModal, setShowBarcodeQuotaModal] = useState<boolean>(false);
  const [showPaywallModal, setShowPaywallModal] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [showMandatoryProfileModal, setShowMandatoryProfileModal] = useState<boolean>(false);

  const cameraRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastBarcodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Charger les préférences, l'historique, l'eau et le quota au démarrage
  useEffect(() => {
    (async () => {
      // Initialisation AdMob & RevenueCat
      initializeAds();
      initializePurchases((isPro) => {
        setPreferences((prev) => ({ ...prev, isPremium: isPro }));
        getScanQuota(isPro).then(setScanQuota);
        getBarcodeQuota(isPro).then(setBarcodeQuota);
      });

      const prefs = await getPreferences();
      setPreferences(prefs);
      setIsAutoScan(prefs.isAutoScanEnabled);

      const quota = await getScanQuota(prefs.isPremium);
      setScanQuota(quota);

      const bQuota = await getBarcodeQuota(prefs.isPremium);
      setBarcodeQuota(bQuota);

      if (!prefs.hasSeenOnboarding) {
        setShowOnboardingModal(true);
      } else if (!prefs.userProfile) {
        setShowMandatoryProfileModal(true);
      }

      const savedHistory = await getMealHistory();
      setHistory(savedHistory);

      const waterLogs = await getWaterHistory();
      setTodayWaterMl(getTodayWaterTotal(waterLogs));

      // Afficher l'App Open Ad à l'ouverture pour les utilisateurs gratuits existants
      if (prefs.hasSeenOnboarding && prefs.userProfile && !prefs.isPremium) {
        setTimeout(() => {
          showAppOpenAdIfReady(false);
        }, 1200);
      }
    })();
  }, []);

  // Intervalle pour le Live Auto-Scan
  useEffect(() => {
    let intervalId: any = null;
    if (isAutoScan && permission?.granted) {
      intervalId = setInterval(() => {
        if (
          !isScanningRef.current &&
          !selectedFood &&
          !showHistoryModal &&
          !showSettingsModal &&
          !showWaterModal
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
    permission?.granted,
    preferences,
    selectedFood,
    showHistoryModal,
    showSettingsModal,
    showWaterModal,
  ]);

  // Handler de scan Code-Barres instantané (Open Food Facts)
  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (!preferences.enableBarcodeScanner || isScanningRef.current || selectedFood) return;
    const now = Date.now();
    if (result.data === lastBarcodeRef.current.code && now - lastBarcodeRef.current.time < 3000) {
      return;
    }
    lastBarcodeRef.current = { code: result.data, time: now };

    // Vérification du quota quotidien de code-barres (5 scans/jour pour non-pro)
    if (!preferences.isPremium) {
      const currentQuota = await getBarcodeQuota(false);
      if (currentQuota.remaining <= 0) {
        setBarcodeQuota(currentQuota);
        setShowBarcodeQuotaModal(true);
        return;
      }
    }

    try {
      isScanningRef.current = true;
      if (preferences.useHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      const product = await fetchProductByBarcode(result.data);
      if (product) {
        // Décompte effectif du quota code-barres
        if (!preferences.isPremium) {
          const { quota: updatedBQuota } = await consumeBarcodeScan(false);
          setBarcodeQuota(updatedBQuota);
        }

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

    // Vérification du quota quotidien pour les utilisateurs non-pro
    if (!preferences.isPremium && !isLiveBackground) {
      const currentQuota = await getScanQuota(false);
      if (currentQuota.remaining <= 0) {
        setScanQuota(currentQuota);
        setShowQuotaModal(true);
        return;
      }
    }

    try {
      isScanningRef.current = true;
      if (!isLiveBackground) {
        setIsAnalyzing(true);
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        isScanningRef.current = false;
        setIsAnalyzing(false);
        return;
      }

      // 1. Obtenir les dimensions réelles orientées de l'image de manière 100% garantie
      let imgWidth = photo.width;
      let imgHeight = photo.height;

      if (!imgWidth || !imgHeight) {
        const measured = await ImageManipulator.manipulateAsync(photo.uri, [], {
          format: ImageManipulator.SaveFormat.JPEG,
        });
        imgWidth = measured.width;
        imgHeight = measured.height;
      }

      // 2. Calcul des ratios de découpage précis au pixel près
      // En priorité : utilisation des coordonnées physiques réelles mesurées par measureInWindow
      let originRatioX = (screenWidth - 330) / (2 * screenWidth);
      let originRatioY = 0.14; // Position par défaut observée du cadre vert
      let ratioW = 330 / screenWidth;
      let ratioH = 330 / screenHeight;

      if (scanBoxLayoutRef.current && scanBoxLayoutRef.current.width > 0) {
        const { x, y, width: boxW, height: boxH } = scanBoxLayoutRef.current;
        originRatioX = Math.max(0, x / screenWidth);
        originRatioY = Math.max(0, y / screenHeight);
        ratioW = Math.min(1 - originRatioX, boxW / screenWidth);
        ratioH = Math.min(1 - originRatioY, boxH / screenHeight);
      } else {
        const fallbackBoxSize = Math.round(Math.min(screenWidth * 0.74, screenHeight * 0.42, 330));
        originRatioX = (screenWidth - fallbackBoxSize) / (2 * screenWidth);
        originRatioY = (screenHeight * 0.14); // 14% du haut de l'écran
        ratioW = fallbackBoxSize / screenWidth;
        ratioH = fallbackBoxSize / screenHeight;
      }

      const actions: ImageManipulator.Action[] = [];

      // Découpage (Crop) au carré vert mesuré
      if (imgWidth && imgHeight) {
        const cropX = Math.max(0, Math.round(originRatioX * imgWidth));
        const cropY = Math.max(0, Math.round(originRatioY * imgHeight));
        const cropWidth = Math.min(imgWidth - cropX, Math.round(ratioW * imgWidth));
        const cropHeight = Math.min(imgHeight - cropY, Math.round(ratioH * imgHeight));

        actions.push({
          crop: {
            originX: cropX,
            originY: cropY,
            width: cropWidth,
            height: cropHeight,
          },
        });
      }

      actions.push({ resize: { width: 512 } });

      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        actions,
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipResult.base64) {
        isScanningRef.current = false;
        setIsAnalyzing(false);
        return;
      }

      const analysis = await analyzeFoodImage(
        manipResult.base64,
        preferences.apiKey,
        preferences
      );
      analysis.photoUri = manipResult.uri;

      // Si l'IA n'a détecté aucun aliment (ex: photo d'un clavier, d'un mur ou d'un objet)
      if (analysis.confidence === 0 || analysis.name.toLowerCase().includes('aucun aliment') || analysis.name.toLowerCase().includes('no food')) {
        if (!isLiveBackground) {
          Alert.alert(
            preferences.language === 'en' ? 'No food detected' : 'Aucun aliment détecté',
            preferences.language === 'en' 
              ? 'Please frame a meal, ingredient, or beverage to calculate nutrition.' 
              : 'Veuillez cadrer une assiette, un aliment ou une boisson pour analyser les calories.'
          );
        }
        return;
      }

      // Décompte effectif du quota après analyse réussie
      if (!isLiveBackground && !preferences.isPremium) {
        const { quota: updatedQuota } = await consumeScan(false);
        setScanQuota(updatedQuota);
      }

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

      if (preferences.useHaptics) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // 1. Fermer d'abord la fiche de résultat pour déclencher la fermeture native
      setSelectedFood(null);

      // 2. Attendre la fin complète de l'animation de fermeture native (350ms)
      // pour éviter tout conflit de ViewController ou de calque bloquant sur iOS / Android
      setTimeout(() => {
        // Fréquence d'interstitiel intelligente (tous les 2 repas)
        const adShown = recordScanAndMaybeShowAd(preferences.isPremium);

        // Si aucune publicité n'est affichée, confirmer par l'alerte
        if (!adShown) {
          const successMsg = t.resultSheet.saveSuccess
            .replace('{name}', food.name)
            .replace('{calories}', food.macros.calories.toString());
          Alert.alert(t.resultSheet.saveSuccessTitle, successMsg);
        }
      }, 350);
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
    {
      id: 'voice',
      iconName: 'mic',
      iconType: 'ionicons',
      label: t.radial.voiceDictate,
      color: '#10B981',
      onPress: () => setShowVoiceModal(true),
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
      id: 'water',
      iconName: 'water',
      iconType: 'ionicons',
      label: `${todayWaterMl} ${t.radial.water}`,
      color: '#0EA5E9',
      onPress: () => setShowWaterModal(true),
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
        onBarcodeScanned={preferences.enableBarcodeScanner ? handleBarcodeScanned : undefined}
      />

      {/* Menu Camembert Unique (Haut d'écran propre & épuré) */}
      <RadialMenu
        items={radialMenuItems}
        currentModeLabel={t.modes.dish}
        currentModeIcon="silverware-fork-knife"
        todayCalories={todayCalories}
        todayWaterMl={todayWaterMl}
        remainingScans={scanQuota.remaining}
        isPremium={preferences.isPremium}
        language={preferences.language}
        onOpenQuotaModal={() => setShowQuotaModal(true)}
      />

      {/* HUD Scanner Reticle & Status Hint */}
      <ScannerOverlay
        isAnalyzing={isAnalyzing}
        liveDetection={liveDetection}
        isAutoScan={isAutoScan}
        language={preferences.language}
        onLayoutScanBox={(layout) => {
          scanBoxLayoutRef.current = layout;
        }}
      />

      {/* Barre de navigation basse & Bannière AdMob intégrée sans superposition */}
      <View style={[styles.bottomControlsWrapper, { bottom: bottomControlsBottom }]} pointerEvents="box-none">
        {/* Bulle d'indication Scanner / Analyse */}
        <View style={styles.scannerHintPill} pointerEvents="none">
          <Text style={[styles.scannerHintText, isAnalyzing && styles.scannerHintTextAnalyzing]}>
            {isAnalyzing
              ? t.hud.hintAnalyzingDish
              : isAutoScan
              ? t.hud.hintAutoScan
              : t.hud.hintAimDish}
          </Text>
        </View>

        {/* Bouton Flottant Dictée Vocale */}
        <TouchableOpacity
          style={styles.voiceFloatingPill}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setShowVoiceModal(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="mic" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.voiceFloatingText}>{t.hud.voiceDictateBtn}</Text>
        </TouchableOpacity>

        <View style={[styles.dockBar, { maxWidth: dockMaxWidth, paddingHorizontal: isLargeScreen ? 32 : 24 }]}>
          {/* Bouton Journal */}
          <TouchableOpacity
            style={[styles.dockSideButton, { width: sideBtnWidth, height: sideBtnHeight }]}
            onPress={() => setShowHistoryModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="journal-outline" size={dockIconSize} color="#CBD5E1" />
            <Text style={[styles.dockButtonText, { fontSize: dockTextSize }]}>{t.dock.journal}</Text>
          </TouchableOpacity>

          {/* Déclencheur Photo Central Intégré */}
          <TouchableOpacity
            style={[
              styles.shutterCenterButton,
              { width: shutterOuterSize, height: shutterOuterSize, borderRadius: shutterOuterSize / 2 },
              isAnalyzing && styles.shutterButtonLoading,
            ]}
            onPress={() => captureAndAnalyze(false)}
            disabled={isAnalyzing}
            activeOpacity={0.8}
          >
            <View style={[styles.shutterInner, { width: shutterInnerSize, height: shutterInnerSize, borderRadius: shutterInnerSize / 2 }]}>
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="camera" size={shutterIconSize} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          {/* Bouton Réglages */}
          <TouchableOpacity
            style={[styles.dockSideButton, { width: sideBtnWidth, height: sideBtnHeight }]}
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={dockIconSize} color="#CBD5E1" />
            <Text style={[styles.dockButtonText, { fontSize: dockTextSize }]}>{t.dock.settings}</Text>
          </TouchableOpacity>
        </View>

        {/* Bannière publicitaire en bas d'écran au-dessus des boutons système Android */}
        {!preferences.isPremium && (
          <View style={styles.bannerWrapper} pointerEvents="box-none">
            <AdBannerComponent isPremium={preferences.isPremium} />
          </View>
        )}
      </View>

      {/* Detail Result Bottom Sheet */}
      <ResultSheet
        visible={!!selectedFood}
        food={selectedFood}
        language={preferences.language}
        isPremium={preferences.isPremium}
        userProfile={preferences.userProfile}
        onClose={() => setSelectedFood(null)}
        onSaveToHistory={handleSaveToHistory}
      />

      {/* Voice Input Modal (Dictée de repas à la voix ou par écrit) */}
      <VoiceInputModal
        visible={showVoiceModal}
        language={preferences.language}
        preferences={preferences}
        onClose={() => setShowVoiceModal(false)}
        onSuccess={(analyzedFood) => {
          setSelectedFood(analyzedFood);
          if (preferences.enableVoiceFeedback) {
            speakDishResult(analyzedFood, preferences.language);
          }
        }}
      />

      {/* Scan Quota Modal (Freemium & Rewarded Video: IA) */}
      <ScanQuotaModal
        visible={showQuotaModal}
        quota={scanQuota}
        quotaType="ai"
        language={preferences.language}
        onClose={() => setShowQuotaModal(false)}
        onOpenPaywall={() => setShowPaywallModal(true)}
        onQuotaUpdated={(newQuota) => setScanQuota(newQuota)}
      />

      {/* Barcode Quota Modal (Freemium & Rewarded Video: Code-barres 5/jour) */}
      <ScanQuotaModal
        visible={showBarcodeQuotaModal}
        quota={barcodeQuota}
        quotaType="barcode"
        language={preferences.language}
        onClose={() => setShowBarcodeQuotaModal(false)}
        onOpenPaywall={() => setShowPaywallModal(true)}
        onQuotaUpdated={(newQuota) => setBarcodeQuota(newQuota)}
      />

      {/* Paywall Pro Modal */}
      <PaywallModal
        visible={showPaywallModal}
        language={preferences.language}
        onClose={() => setShowPaywallModal(false)}
        onSuccess={() => {
          setPreferences((prev) => ({ ...prev, isPremium: true }));
          getScanQuota(true).then(setScanQuota);
          getBarcodeQuota(true).then(setBarcodeQuota);
        }}
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
        userDiets={preferences.diets}
        language={preferences.language}
        isPremium={preferences.isPremium}
        todayWaterMl={todayWaterMl}
        targetWaterMl={preferences.dailyWaterTargetMl || 2000}
        onAddWater={handleAddWater}
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
  bottomControlsWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 68 : 30,
    left: 0,
    right: 0,
    zIndex: 25,
    alignItems: 'center',
  },
  dockBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
    marginBottom: 6,
  },
  bannerWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
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
  scannerHintPill: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 8,
  },
  scannerHintText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  scannerHintTextAnalyzing: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    color: '#A7F3D0',
  },
  voiceFloatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceFloatingText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
