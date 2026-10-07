import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getTranslation } from '../i18n';
import { speakDishResult } from '../services/voiceFeedback';
import { AppLanguage, FoodItemAnalysis, Macronutrients } from '../types/nutrition';
import { MacrosChart } from './MacrosChart';
import { NovaEcoScoreBadge } from './NovaEcoScoreBadge';
import { NutriScoreBadge } from './NutriScoreBadge';

interface Props {
  visible: boolean;
  food: FoodItemAnalysis | null;
  language?: AppLanguage;
  onClose: () => void;
  onSaveToHistory: (food: FoodItemAnalysis) => void;
}

export const ResultSheet: React.FC<Props> = ({
  visible,
  food,
  language = 'fr',
  onClose,
  onSaveToHistory,
}) => {
  if (!food) return null;
  const t = getTranslation(language);

  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);
  const [currentGrams, setCurrentGrams] = useState<number>(food.portionGrams);

  useEffect(() => {
    if (food) {
      setPortionMultiplier(1.0);
      setCurrentGrams(food.portionGrams);
    }
  }, [food]);

  const updatePortion = (multiplier: number) => {
    setPortionMultiplier(multiplier);
    setCurrentGrams(Math.round(food.portionGrams * multiplier));
  };

  const adjustGrams = (delta: number) => {
    const newGrams = Math.max(30, currentGrams + delta);
    setCurrentGrams(newGrams);
    setPortionMultiplier(newGrams / food.portionGrams);
  };

  // Recalcul dynamique des macros en fonction de la portion sélectionnée
  const dynamicMacros: Macronutrients = {
    calories: Math.round(food.per100g.calories * (currentGrams / 100)),
    proteins: Number((food.per100g.proteins * (currentGrams / 100)).toFixed(1)),
    carbs: Number((food.per100g.carbs * (currentGrams / 100)).toFixed(1)),
    fats: Number((food.per100g.fats * (currentGrams / 100)).toFixed(1)),
    saturatedFats: Number((food.per100g.saturatedFats * (currentGrams / 100)).toFixed(1)),
    sugars: Number((food.per100g.sugars * (currentGrams / 100)).toFixed(1)),
    fibers: Number((food.per100g.fibers * (currentGrams / 100)).toFixed(1)),
    sodiumMg: Math.round(food.per100g.sodiumMg * (currentGrams / 100)),
  };

  const handleSave = () => {
    onSaveToHistory({
      ...food,
      portionGrams: currentGrams,
      macros: dynamicMacros,
    });
  };

  const handleSpeak = () => {
    speakDishResult(
      {
        ...food,
        portionGrams: currentGrams,
        macros: dynamicMacros,
      },
      language
    );
  };

  const confidenceText = food.isBarcode
    ? t.resultSheet.barcodeVerified
    : t.resultSheet.confidence.replace('{percent}', Math.round(food.confidence * 100).toString());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
            {food.photoUri && (
              <View style={styles.photoContainer}>
                <Image source={{ uri: food.photoUri }} style={styles.photoImage} resizeMode="cover" />
              </View>
            )}

            {/* Title & Category & Voice Button */}
            <View style={styles.titleSection}>
              <View style={styles.badgesRow}>
                <View style={styles.confidenceBadge}>
                  <Ionicons name="sparkles" size={14} color="#10B981" />
                  <Text style={styles.confidenceText}>{confidenceText}</Text>
                </View>
                {food.isBarcode && (
                  <View style={styles.offBadge}>
                    <Text style={styles.offBadgeText}>Open Food Facts</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.voiceBtn} onPress={handleSpeak}>
                  <Ionicons name="volume-high" size={16} color="#38BDF8" />
                  <Text style={styles.voiceBtnText}>{t.resultSheet.listenBtn}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.dishTitle}>{food.name}</Text>
            </View>

            {/* Avertissements Allergènes & Régimes */}
            {food.dietWarnings && food.dietWarnings.length > 0 && (
              <View style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Ionicons name="warning" size={18} color="#EF4444" />
                  <Text style={styles.warningTitle}>{t.resultSheet.dietAlert}</Text>
                </View>
                {food.dietWarnings.map((w, i) => (
                  <Text key={i} style={styles.warningItemText}>{w}</Text>
                ))}
              </View>
            )}

            {/* Nutri-Score Big Badge */}
            <View style={styles.nutriScoreCard}>
              <Text style={styles.sectionTitle}>{t.resultSheet.nutriQuality}</Text>
              <NutriScoreBadge grade={food.nutriScore.grade} size="large" showLabel language={language} />

              {/* Badges NOVA & Éco-Score */}
              <NovaEcoScoreBadge
                novaGrade={food.novaScore?.grade}
                ecoScoreGrade={food.ecoScore?.grade}
                language={language}
              />

              {/* Insights */}
              {food.nutriScore.insights.length > 0 && (
                <View style={styles.insightsList}>
                  {food.nutriScore.insights.map((insight, idx) => (
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
                <Text style={styles.sectionTitleNoMargin}>
                  {food.isLiquid ? t.resultSheet.adjustVolume : t.resultSheet.adjustPortion}
                </Text>
                <Text style={styles.portionGramsDisplay}>
                  {currentGrams}{food.isLiquid ? 'ml' : 'g'}
                </Text>
              </View>

              {/* Preset buttons */}
              {food.isLiquid ? (
                <View style={styles.presetsRow}>
                  <TouchableOpacity
                    style={[styles.presetBtn, currentGrams === 250 && styles.presetBtnActive]}
                    onPress={() => {
                      setCurrentGrams(250);
                      setPortionMultiplier(250 / food.portionGrams);
                    }}
                  >
                    <Text style={[styles.presetText, currentGrams === 250 && styles.presetTextActive]}>
                      {t.resultSheet.glassPreset} (250ml)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.presetBtn, currentGrams === 330 && styles.presetBtnActive]}
                    onPress={() => {
                      setCurrentGrams(330);
                      setPortionMultiplier(330 / food.portionGrams);
                    }}
                  >
                    <Text style={[styles.presetText, currentGrams === 330 && styles.presetTextActive]}>
                      {t.resultSheet.canPreset} (330ml)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.presetBtn, currentGrams === 500 && styles.presetBtnActive]}
                    onPress={() => {
                      setCurrentGrams(500);
                      setPortionMultiplier(500 / food.portionGrams);
                    }}
                  >
                    <Text style={[styles.presetText, currentGrams === 500 && styles.presetTextActive]}>
                      {t.resultSheet.bottlePreset} (500ml)
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.presetsRow}>
                  <TouchableOpacity
                    style={[styles.presetBtn, portionMultiplier === 0.7 && styles.presetBtnActive]}
                    onPress={() => updatePortion(0.7)}
                  >
                    <Text style={[styles.presetText, portionMultiplier === 0.7 && styles.presetTextActive]}>
                      {t.resultSheet.smallPortion}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.presetBtn, portionMultiplier === 1.0 && styles.presetBtnActive]}
                    onPress={() => updatePortion(1.0)}
                  >
                    <Text style={[styles.presetText, portionMultiplier === 1.0 && styles.presetTextActive]}>
                      {t.resultSheet.mediumPortion}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.presetBtn, portionMultiplier === 1.4 && styles.presetBtnActive]}
                    onPress={() => updatePortion(1.4)}
                  >
                    <Text style={[styles.presetText, portionMultiplier === 1.4 && styles.presetTextActive]}>
                      {t.resultSheet.largePortion}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step Buttons */}
              <View style={styles.stepperRow}>
                {food.isLiquid ? (
                  <>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => adjustGrams(-50)}>
                      <Text style={styles.stepBtnText}>- 50ml</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => adjustGrams(+50)}>
                      <Text style={styles.stepBtnText}>+ 50ml</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => adjustGrams(+100)}>
                      <Text style={styles.stepBtnText}>+ 100ml</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => adjustGrams(-25)}>
                      <Text style={styles.stepBtnText}>- 25g</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => adjustGrams(+25)}>
                      <Text style={styles.stepBtnText}>+ 25g</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => adjustGrams(+50)}>
                      <Text style={styles.stepBtnText}>+ 50g</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Macros and Calories Chart */}
            <Text style={styles.sectionTitle}>{t.resultSheet.nutritionTitle}</Text>
            <MacrosChart
              macros={dynamicMacros}
              portionGrams={currentGrams}
              unit={food.isLiquid ? 'ml' : 'g'}
              language={language}
            />

            {/* Health Tips & Healthy Alternative */}
            {(food.healthTips?.length || food.healthyAlternative) && (
              <View style={styles.tipsSection}>
                <View style={styles.tipsHeader}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#F59E0B" />
                  <Text style={styles.tipsTitle}>{t.resultSheet.tipsTitle}</Text>
                </View>

                {food.healthTips?.map((tip, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipContent}>{tip}</Text>
                  </View>
                ))}

                {food.healthyAlternative && (
                  <View style={styles.alternativeCard}>
                    <Text style={styles.alternativeTitle}>{t.resultSheet.healthyAltTitle}</Text>
                    <Text style={styles.alternativeText}>{food.healthyAlternative}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Ingredients Chips */}
            {food.ingredients && food.ingredients.length > 0 && (
              <View style={styles.ingredientsSection}>
                <Text style={styles.sectionTitle}>{t.resultSheet.ingredientsDetected}</Text>
                <View style={styles.chipsContainer}>
                  {food.ingredients.map((ing, i) => (
                    <View key={i} style={styles.ingredientChip}>
                      <Text style={styles.ingredientChipText}>{ing}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {t.resultSheet.addMealBtn.replace('{calories}', dynamicMacros.calories.toString())}
              </Text>
            </TouchableOpacity>
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
  },
  sheetContainer: {
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
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  portionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  portionGramsDisplay: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  presetText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  stepBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
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
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 14,
    marginBottom: Platform.OS === 'android' ? 24 : 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
