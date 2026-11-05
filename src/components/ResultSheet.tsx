import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getTranslation } from '../i18n';
import { refineFoodAnalysis } from '../services/aiVision';
import { speakDishResult } from '../services/voiceFeedback';
import { AppLanguage, FoodItemAnalysis, Macronutrients, UserProfile } from '../types/nutrition';
import { MacrosChart } from './MacrosChart';
import { NovaEcoScoreBadge } from './NovaEcoScoreBadge';
import { NutriScoreBadge } from './NutriScoreBadge';
import { AdBannerComponent } from './AdBannerComponent';

interface Props {
  visible: boolean;
  food: FoodItemAnalysis | null;
  language?: AppLanguage;
  isPremium?: boolean;
  userProfile?: UserProfile;
  onClose: () => void;
  onSaveToHistory: (food: FoodItemAnalysis) => void;
}

export const ResultSheet: React.FC<Props> = ({
  visible,
  food,
  language = 'fr',
  isPremium = false,
  userProfile,
  onClose,
  onSaveToHistory,
}) => {
  // Conserver le dernier plat valide pour permettre une animation de fermeture native fluide
  // sans unmount brutal qui bloquerait la hiérarchie de fenêtres sur iOS / Android
  const [cachedFood, setCachedFood] = useState<FoodItemAnalysis | null>(food);
  const [displayedFood, setDisplayedFood] = useState<FoodItemAnalysis | null>(food);
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);
  const [currentGrams, setCurrentGrams] = useState<number>(food?.portionGrams || 100);
  const [customizationText, setCustomizationText] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);

  useEffect(() => {
    if (food) {
      setCachedFood(food);
      setDisplayedFood(food);
      setPortionMultiplier(1.0);
      setCurrentGrams(food.portionGrams);
      setCustomizationText('');
    }
  }, [food]);

  if (!cachedFood) return null;
  const t = getTranslation(language);

  const currentDish = displayedFood || cachedFood;

  const updatePortion = (multiplier: number) => {
    setPortionMultiplier(multiplier);
    setCurrentGrams(Math.round(currentDish.portionGrams * multiplier));
  };

  const adjustGrams = (delta: number) => {
    const newGrams = Math.max(30, currentGrams + delta);
    setCurrentGrams(newGrams);
    setPortionMultiplier(newGrams / currentDish.portionGrams);
  };

  const handleRefine = async () => {
    if (!customizationText.trim() || isRefining) return;
    try {
      setIsRefining(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const refined = await refineFoodAnalysis(
        {
          ...currentDish,
          portionGrams: currentGrams,
          macros: dynamicMacros,
        },
        customizationText.trim(),
        undefined,
        { language } as any
      );
      setDisplayedFood(refined);
      setCurrentGrams(refined.portionGrams);
      setPortionMultiplier(1.0);
      setCustomizationText('');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      Alert.alert(
        language === 'en' ? 'Refinement failed' : 'Ajustement impossible',
        e?.message || (language === 'en' ? 'Unable to recalculate with this precision.' : 'Impossible de recalculer avec cette précision.')
      );
    } finally {
      setIsRefining(false);
    }
  };

  // Recalcul dynamique des macros en fonction de la portion sélectionnée
  const dynamicMacros: Macronutrients = {
    calories: Math.round(currentDish.per100g.calories * (currentGrams / 100)),
    proteins: Number((currentDish.per100g.proteins * (currentGrams / 100)).toFixed(1)),
    carbs: Number((currentDish.per100g.carbs * (currentGrams / 100)).toFixed(1)),
    fats: Number((currentDish.per100g.fats * (currentGrams / 100)).toFixed(1)),
    saturatedFats: Number((currentDish.per100g.saturatedFats * (currentGrams / 100)).toFixed(1)),
    sugars: Number((currentDish.per100g.sugars * (currentGrams / 100)).toFixed(1)),
    fibers: Number((currentDish.per100g.fibers * (currentGrams / 100)).toFixed(1)),
    sodiumMg: Math.round(currentDish.per100g.sodiumMg * (currentGrams / 100)),
  };

  // Équivalence activité physique (PACE - METs)
  const userWeight = userProfile?.weightKg && userProfile.weightKg >= 35 ? userProfile.weightKg : 70;
  const activeCalories = Math.max(1, dynamicMacros.calories);

  const calcMinutes = (met: number) => {
    const kcalPerMin = (met * userWeight) / 60;
    return Math.max(1, Math.round(activeCalories / kcalPerMin));
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`;
  };

  const walkingTime = formatDuration(calcMinutes(3.5));
  const runningTime = formatDuration(calcMinutes(8.5));
  const cyclingTime = formatDuration(calcMinutes(6.0));
  const swimmingTime = formatDuration(calcMinutes(7.0));

  const handleSave = () => {
    onSaveToHistory({
      ...currentDish,
      portionGrams: currentGrams,
      macros: dynamicMacros,
    });
  };

  const handleSpeak = () => {
    speakDishResult(
      {
        ...currentDish,
        portionGrams: currentGrams,
        macros: dynamicMacros,
      },
      language
    );
  };

  const confidenceText = currentDish.isBarcode
    ? t.resultSheet.barcodeVerified
    : t.resultSheet.confidence.replace('{percent}', Math.round(currentDish.confidence * 100).toString());

  return (
    <Modal visible={visible && !!food} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.indicator} />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Photo Preview if available */}
            {currentDish.photoUri && (
              <View style={styles.photoContainer}>
                <Image source={{ uri: currentDish.photoUri }} style={styles.photoImage} resizeMode="cover" />
              </View>
            )}

            {/* Title & Category & Voice Button */}
            <View style={styles.titleSection}>
              <View style={styles.badgesRow}>
                <View style={styles.confidenceBadge}>
                  <Ionicons name="sparkles" size={14} color="#10B981" />
                  <Text style={styles.confidenceText}>{confidenceText}</Text>
                </View>
                {currentDish.isBarcode && (
                  <View style={styles.offBadge}>
                    <Text style={styles.offBadgeText}>Open Food Facts</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.voiceBtn} onPress={handleSpeak}>
                  <Ionicons name="volume-high" size={16} color="#38BDF8" />
                  <Text style={styles.voiceBtnText}>{t.resultSheet.listenBtn}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.dishTitle}>{currentDish.name}</Text>
            </View>

            {/* Avertissements Allergènes & Régimes */}
            {currentDish.dietWarnings && currentDish.dietWarnings.length > 0 && (
              <View style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                  <Text style={styles.warningTitle}>
                    {language === 'en' ? 'Health & Diet Verification' : 'Contrôle Santé & Régime'}
                  </Text>
                </View>
                {currentDish.dietWarnings.map((w, i) => (
                  <Text key={i} style={styles.warningItemText}>{w}</Text>
                ))}
              </View>
            )}

            {/* Badge FODMAP / Digestion pour le côlon irritable si disponible */}
            {currentDish.fodmapGrade && (
              <View style={[
                styles.fodmapBanner,
                currentDish.fodmapGrade === 'low' && styles.fodmapBannerLow,
                currentDish.fodmapGrade === 'medium' && styles.fodmapBannerMed,
                currentDish.fodmapGrade === 'high' && styles.fodmapBannerHigh,
              ]}>
                <View style={styles.fodmapHeaderRow}>
                  <Ionicons
                    name={currentDish.fodmapGrade === 'low' ? 'checkmark-circle' : currentDish.fodmapGrade === 'medium' ? 'alert-circle' : 'warning'}
                    size={18}
                    color={currentDish.fodmapGrade === 'low' ? '#10B981' : currentDish.fodmapGrade === 'medium' ? '#F59E0B' : '#EF4444'}
                  />
                  <Text style={[
                    styles.fodmapTitle,
                    { color: currentDish.fodmapGrade === 'low' ? '#10B981' : currentDish.fodmapGrade === 'medium' ? '#F59E0B' : '#EF4444' }
                  ]}>
                    {currentDish.fodmapGrade === 'low'
                      ? (language === 'en' ? 'Digestive Score: Low FODMAP (Safe)' : 'Score Digestif : Faible en FODMAPs (Très Digeste)')
                      : currentDish.fodmapGrade === 'medium'
                      ? (language === 'en' ? 'Digestive Score: Moderate FODMAP' : 'Score Digestif : FODMAPs Modérés')
                      : (language === 'en' ? 'Digestive Score: High FODMAP (IBS Risk)' : 'Score Digestif : Riche en FODMAPs (Risque Côlon Irritable)')}
                  </Text>
                </View>
                {currentDish.fodmapDetails && (
                  <Text style={styles.fodmapDesc}>{currentDish.fodmapDetails}</Text>
                )}
              </View>
            )}

            {/* Nutri-Score Big Badge */}
            <View style={styles.nutriScoreCard}>
              <Text style={styles.sectionTitle}>{t.resultSheet.nutriQuality}</Text>
              <NutriScoreBadge grade={currentDish.nutriScore.grade} size="large" showLabel language={language} />

              {/* Badges NOVA & Éco-Score */}
              <NovaEcoScoreBadge
                novaGrade={currentDish.novaScore?.grade}
                ecoScoreGrade={currentDish.ecoScore?.grade}
                language={language}
              />

              {/* Insights */}
              {currentDish.nutriScore.insights.length > 0 && (
                <View style={styles.insightsList}>
                  {currentDish.nutriScore.insights.map((insight, idx) => (
                    <View key={idx} style={styles.insightItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Interactive Portion / Volume Adjuster */}
            <View style={styles.portionAdjusterCard}>
              <View style={styles.portionHeader}>
                <View style={styles.portionHeaderLeft}>
                  <MaterialCommunityIcons name={currentDish.isLiquid ? 'cup-water' : 'scale-bathroom'} size={18} color="#10B981" />
                  <Text style={styles.sectionTitleNoMargin}>
                    {currentDish.isLiquid ? t.resultSheet.adjustVolume : t.resultSheet.adjustPortion}
                  </Text>
                </View>
                
                {/* Stepper Pill */}
                <View style={styles.stepperPill}>
                  <TouchableOpacity
                    style={styles.stepperMiniBtn}
                    onPress={() => adjustGrams(currentDish.isLiquid ? -50 : -25)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                  
                  <Text style={styles.portionGramsDisplay}>
                    {currentGrams} <Text style={styles.portionUnitText}>{currentDish.isLiquid ? 'ml' : 'g'}</Text>
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.stepperMiniBtn}
                    onPress={() => adjustGrams(currentDish.isLiquid ? +50 : +25)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={16} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Segmented Preset Selector */}
              {currentDish.isLiquid ? (
                <View style={styles.segmentedContainer}>
                  <TouchableOpacity
                    style={[styles.segmentBtn, currentGrams === 250 && styles.segmentBtnActive]}
                    onPress={() => {
                      setCurrentGrams(250);
                      setPortionMultiplier(250 / currentDish.portionGrams);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.segmentText, currentGrams === 250 && styles.segmentTextActive]}>
                      {t.resultSheet.glassPreset}
                    </Text>
                    <Text style={[styles.segmentSubText, currentGrams === 250 && styles.segmentSubTextActive]}>
                      250ml
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.segmentBtn, currentGrams === 330 && styles.segmentBtnActive]}
                    onPress={() => {
                      setCurrentGrams(330);
                      setPortionMultiplier(330 / currentDish.portionGrams);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.segmentText, currentGrams === 330 && styles.segmentTextActive]}>
                      {t.resultSheet.canPreset}
                    </Text>
                    <Text style={[styles.segmentSubText, currentGrams === 330 && styles.segmentSubTextActive]}>
                      330ml
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.segmentBtn, currentGrams === 500 && styles.segmentBtnActive]}
                    onPress={() => {
                      setCurrentGrams(500);
                      setPortionMultiplier(500 / currentDish.portionGrams);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.segmentText, currentGrams === 500 && styles.segmentTextActive]}>
                      {t.resultSheet.bottlePreset}
                    </Text>
                    <Text style={[styles.segmentSubText, currentGrams === 500 && styles.segmentSubTextActive]}>
                      500ml
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.segmentedContainer}>
                  <TouchableOpacity
                    style={[styles.segmentBtn, portionMultiplier === 0.7 && styles.segmentBtnActive]}
                    onPress={() => updatePortion(0.7)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.segmentText, portionMultiplier === 0.7 && styles.segmentTextActive]}>
                      {t.resultSheet.smallPortion}
                    </Text>
                    <Text style={[styles.segmentSubText, portionMultiplier === 0.7 && styles.segmentSubTextActive]}>
                      0.7x
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.segmentBtn, portionMultiplier === 1.0 && styles.segmentBtnActive]}
                    onPress={() => updatePortion(1.0)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.segmentText, portionMultiplier === 1.0 && styles.segmentTextActive]}>
                      {t.resultSheet.mediumPortion}
                    </Text>
                    <Text style={[styles.segmentSubText, portionMultiplier === 1.0 && styles.segmentSubTextActive]}>
                      1.0x
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.segmentBtn, portionMultiplier === 1.4 && styles.segmentBtnActive]}
                    onPress={() => updatePortion(1.4)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.segmentText, portionMultiplier === 1.4 && styles.segmentTextActive]}>
                      {t.resultSheet.largePortion}
                    </Text>
                    <Text style={[styles.segmentSubText, portionMultiplier === 1.4 && styles.segmentSubTextActive]}>
                      1.4x
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Customization & Refinement Card (Ajout / précision d'ingrédient ou cuisson) */}
            <View style={styles.customizationCard}>
              <View style={styles.customizationHeader}>
                <MaterialCommunityIcons name="auto-fix" size={18} color="#10B981" />
                <Text style={styles.customizationTitle}>{t.resultSheet.refineTitle}</Text>
              </View>
              <View style={styles.customizationInputRow}>
                <TextInput
                  style={styles.customizationInput}
                  placeholder={t.resultSheet.refinePlaceholder}
                  placeholderTextColor="#64748B"
                  value={customizationText}
                  onChangeText={setCustomizationText}
                  returnKeyType="done"
                  onSubmitEditing={handleRefine}
                />
                <TouchableOpacity
                  style={[
                    styles.refineBtn,
                    (!customizationText.trim() || isRefining) && styles.refineBtnDisabled,
                  ]}
                  onPress={handleRefine}
                  disabled={!customizationText.trim() || isRefining}
                  activeOpacity={0.8}
                >
                  {isRefining ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.refineBtnContent}>
                      <Ionicons name="sparkles" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.refineBtnText}>{t.resultSheet.refineBtn}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button (Action Principale Directe avant la composition détaillée) */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {t.resultSheet.addMealBtn.replace('{calories}', dynamicMacros.calories.toString())}
              </Text>
            </TouchableOpacity>

            {/* Macros and Calories Chart */}
            <Text style={styles.sectionTitle}>{t.resultSheet.nutritionTitle}</Text>
            <MacrosChart
              macros={dynamicMacros}
              portionGrams={currentGrams}
              unit={currentDish.isLiquid ? 'ml' : 'g'}
              language={language}
            />

            {/* Équivalence Activité Physique (PACE) */}
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={styles.activityIconBadge}>
                  <MaterialCommunityIcons name="fire" size={18} color="#F97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{t.resultSheet.activityEquivalentTitle}</Text>
                  <Text style={styles.activitySubtitle}>
                    {t.resultSheet.activityEquivalentSubtitle.replace('{calories}', dynamicMacros.calories.toString())}
                  </Text>
                </View>
              </View>

              <View style={styles.activityGrid}>
                {/* Marche */}
                <View style={styles.activityItem}>
                  <View style={[styles.activityItemIcon, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <MaterialCommunityIcons name="walk" size={20} color="#38BDF8" />
                  </View>
                  <Text style={styles.activityItemName}>{t.resultSheet.activityWalking}</Text>
                  <Text style={styles.activityItemTime}>{walkingTime}</Text>
                </View>

                {/* Course */}
                <View style={styles.activityItem}>
                  <View style={[styles.activityItemIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <MaterialCommunityIcons name="run-fast" size={20} color="#EF4444" />
                  </View>
                  <Text style={styles.activityItemName}>{t.resultSheet.activityRunning}</Text>
                  <Text style={styles.activityItemTime}>{runningTime}</Text>
                </View>

                {/* Vélo */}
                <View style={styles.activityItem}>
                  <View style={[styles.activityItemIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <MaterialCommunityIcons name="bike" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.activityItemName}>{t.resultSheet.activityCycling}</Text>
                  <Text style={styles.activityItemTime}>{cyclingTime}</Text>
                </View>

                {/* Natation */}
                <View style={styles.activityItem}>
                  <View style={[styles.activityItemIcon, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                    <MaterialCommunityIcons name="swim" size={20} color="#A855F7" />
                  </View>
                  <Text style={styles.activityItemName}>{t.resultSheet.activitySwimming}</Text>
                  <Text style={styles.activityItemTime}>{swimmingTime}</Text>
                </View>
              </View>
            </View>

            {/* Health Tips & Healthy Alternative */}
            {(currentDish.healthTips?.length || currentDish.healthyAlternative) && (
              <View style={styles.tipsSection}>
                <View style={styles.tipsHeader}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#F59E0B" />
                  <Text style={styles.tipsTitle}>{t.resultSheet.tipsTitle}</Text>
                </View>

                {currentDish.healthTips?.map((tip, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipContent}>{tip}</Text>
                  </View>
                ))}

                {/* Repas de substitution recommandé */}
                {currentDish.substituteMeal && (
                  <View style={styles.substituteCard}>
                    <View style={styles.substituteHeaderRow}>
                      <View style={styles.substituteIconBadge}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={16} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.substituteTitle}>{t.resultSheet.substituteMealTitle}</Text>
                        <Text style={styles.substituteBadge}>{t.resultSheet.substituteMealBadge}</Text>
                      </View>
                    </View>
                    <Text style={styles.substituteText}>{currentDish.substituteMeal}</Text>
                  </View>
                )}

                {currentDish.healthyAlternative && currentDish.healthyAlternative !== currentDish.substituteMeal && (
                  <View style={styles.alternativeCard}>
                    <Text style={styles.alternativeTitle}>{t.resultSheet.healthyAltTitle}</Text>
                    <Text style={styles.alternativeText}>{currentDish.healthyAlternative}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Ingredients Chips */}
            {currentDish.ingredients && currentDish.ingredients.length > 0 && (
              <View style={styles.ingredientsSection}>
                <Text style={styles.sectionTitle}>{t.resultSheet.ingredientsDetected}</Text>
                <View style={styles.chipsContainer}>
                  {currentDish.ingredients.map((ing, i) => (
                    <View key={i} style={styles.ingredientChip}>
                      <Text style={styles.ingredientChipText}>{ing}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Bannière AdMob intégrée */}
            <AdBannerComponent isPremium={isPremium} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  indicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#475569',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  photoContainer: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#1E293B',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  titleSection: {
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  offBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offBadgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  voiceBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  dishTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  warningCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warningTitle: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 13,
  },
  warningItemText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  fodmapBanner: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  fodmapBannerLow: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  fodmapBannerMed: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  fodmapBannerHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  fodmapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fodmapTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  fodmapDesc: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    marginLeft: 26,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitleNoMargin: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  nutriScoreCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginVertical: 6,
  },
  insightsList: {
    marginTop: 14,
    width: '100%',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  insightText: {
    color: '#E2E8F0',
    fontSize: 13,
    marginLeft: 8,
  },
  portionAdjusterCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  portionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  portionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  stepperMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionGramsDisplay: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
    minWidth: 54,
    textAlign: 'center',
  },
  portionUnitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  segmentBtn: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  segmentSubText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 1,
  },
  segmentSubTextActive: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    textAlign: 'center',
  },
  customizationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  customizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  customizationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  customizationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customizationInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  refineBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  refineBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  refineBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tipsSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  tipRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tipBullet: {
    color: '#F59E0B',
    fontSize: 14,
    marginRight: 6,
  },
  tipContent: {
    flex: 1,
    color: '#FEF3C7',
    fontSize: 13,
    lineHeight: 18,
  },
  alternativeCard: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  alternativeTitle: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  alternativeText: {
    color: '#FEF3C7',
    fontSize: 13,
    lineHeight: 18,
  },
  activityCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  activityIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  activitySubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  activityItem: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activityItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  activityItemName: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  activityItemTime: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  substituteCard: {
    marginTop: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  substituteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  substituteIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  substituteTitle: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '800',
  },
  substituteBadge: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '500',
  },
  substituteText: {
    color: '#F0FDF4',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  ingredientsSection: {
    marginVertical: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ingredientChipText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 18,
    marginBottom: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
