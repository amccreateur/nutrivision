import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getTranslation } from '../i18n';
import { NUTRI_SCORE_COLORS } from '../services/nutriscore';
import { generateAndSharePdfReport, ReportPeriod } from '../services/reportExport';
import { getPreferences, getTodayWaterTotal, getWaterHistory } from '../services/storage';
import { showRewardedAdWithCallback } from '../services/adsService';
import { AppLanguage, DietType, MealHistoryItem, NutriScoreGrade, UserProfile } from '../types/nutrition';
import { NutriScoreBadge } from './NutriScoreBadge';
import { AdBannerComponent } from './AdBannerComponent';

interface Props {
  visible: boolean;
  history: MealHistoryItem[];
  dailyTarget: number;
  userProfile?: UserProfile;
  userDiet?: DietType;
  language?: AppLanguage;
  isPremium?: boolean;
  onClose: () => void;
  onClear: () => void;
  onOpenCalculator?: () => void;
}

const GRADE_VALUES: Record<NutriScoreGrade, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
const VALUE_TO_GRADE: Record<number, NutriScoreGrade> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };

export const HistoryModal: React.FC<Props> = ({
  visible,
  history,
  dailyTarget,
  userProfile,
  userDiet,
  language = 'fr',
  isPremium = false,
  onClose,
  onClear,
  onOpenCalculator,
}) => {
  const t = getTranslation(language);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('today');

  const periodTabs: { id: ReportPeriod; label: string }[] = [
    { id: 'today', label: t.journal.tabToday },
    { id: '7days', label: t.journal.tab7Days },
    { id: '30days', label: t.journal.tab30Days },
    { id: 'all', label: t.journal.tabAll },
  ];

  // Filtrage selon la période & Calculs Glucides / Sucres
  const {
    filteredMeals,
    totalCalories,
    avgCalories,
    totalSugars,
    totalCarbs,
    avgSugars,
    avgCarbs,
    uniqueDays,
    progressPercent,
    averageGrade,
  } = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);

    let meals = history;
    if (selectedPeriod === 'today') {
      meals = history.filter((m) => m.timestamp >= todayStart);
    } else if (selectedPeriod === '7days') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      meals = history.filter((m) => m.timestamp >= sevenDaysAgo);
    } else if (selectedPeriod === '30days') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      meals = history.filter((m) => m.timestamp >= thirtyDaysAgo);
    }

    const daysCount = Math.max(1, new Set(meals.map((m) => new Date(m.timestamp).toDateString())).size);
    const sumCalories = meals.reduce((acc, m) => acc + m.calories, 0);
    const dailyAvg = meals.length > 0 ? Math.round(sumCalories / daysCount) : 0;

    const sumSugars = Number(meals.reduce((acc, m) => acc + (m.macros?.sugars || 0), 0).toFixed(1));
    const sumCarbs = Number(meals.reduce((acc, m) => acc + (m.macros?.carbs || 0), 0).toFixed(1));
    const dailyAvgSugars = daysCount > 0 ? Number((sumSugars / daysCount).toFixed(1)) : 0;
    const dailyAvgCarbs = daysCount > 0 ? Number((sumCarbs / daysCount).toFixed(1)) : 0;

    const baseCal = selectedPeriod === 'today' ? sumCalories : dailyAvg;
    const progress = Math.min(Math.round((baseCal / dailyTarget) * 100), 100);

    let grade: NutriScoreGrade = 'B';
    if (meals.length > 0) {
      const sumPoints = meals.reduce((acc, m) => acc + (GRADE_VALUES[m.nutriScore] || 3), 0);
      const avgPoint = Math.round(sumPoints / meals.length);
      grade = VALUE_TO_GRADE[Math.max(1, Math.min(5, avgPoint))];
    }

    return {
      filteredMeals: meals,
      totalCalories: sumCalories,
      avgCalories: dailyAvg,
      totalSugars: sumSugars,
      totalCarbs: sumCarbs,
      avgSugars: dailyAvgSugars,
      avgCarbs: dailyAvgCarbs,
      uniqueDays: daysCount,
      progressPercent: progress,
      averageGrade: grade,
    };
  }, [history, selectedPeriod, dailyTarget]);

  const handleExportPdf = async () => {
    if (filteredMeals.length === 0) {
      Alert.alert('PDF', t.journal.emptyTitle);
      return;
    }

    const doExport = async () => {
      try {
        setIsExporting(true);
        const prefs = await getPreferences();
        const waterLogs = await getWaterHistory();
        const todayWater = getTodayWaterTotal(waterLogs);
        await generateAndSharePdfReport(history, prefs, todayWater, selectedPeriod);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to export PDF.');
      } finally {
        setIsExporting(false);
      }
    };

    showRewardedAdWithCallback(doExport, isPremium);
  };

  const getProfileGoalLabel = () => {
    if (!userProfile) return '';
    if (userProfile.goal === 'lose_weight') return t.calculator.loseWeight;
    if (userProfile.goal === 'gain_muscle') return t.calculator.gainMuscle;
    return t.calculator.maintain;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t.journal.title}</Text>
            <View style={styles.headerRightRow}>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExportPdf}
                disabled={isExporting}
                activeOpacity={0.7}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={16} color="#10B981" />
                    <Text style={styles.exportBtnText}>{t.journal.pdfBtn}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Onglets Filtres Période */}
          <View style={styles.periodTabsContainer}>
            {periodTabs.map((tab) => {
              const isSelected = selectedPeriod === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.periodTab, isSelected && styles.periodTabActive]}
                  onPress={() => setSelectedPeriod(tab.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.periodTabText, isSelected && styles.periodTabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Daily Goal & Nutri-Score Summary */}
          <View style={styles.goalCard}>
            <View style={styles.goalRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.goalTitleRow}>
                  <Text style={styles.goalLabel}>
                    {selectedPeriod === 'today'
                      ? userProfile ? t.journal.goalProfileToday : t.journal.goalToday
                      : `${t.journal.goalAveragePrefix} (${uniqueDays} ${uniqueDays > 1 ? t.journal.activeDaysSuffixPlural : t.journal.activeDaysSuffix})`}
                  </Text>
                  {userProfile && (
                    <View style={styles.profileActiveBadge}>
                      <Ionicons name="sparkles" size={10} color="#10B981" />
                      <Text style={styles.profileActiveBadgeText}>{t.journal.mifflinBadge}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.goalCalories}>
                  {selectedPeriod === 'today' ? totalCalories : avgCalories}{' '}
                  <Text style={styles.goalSub}>
                    / {dailyTarget} kcal {selectedPeriod !== 'today' ? '/d' : ''}
                  </Text>
                </Text>
              </View>

              {/* Nutri-Score Average Pill */}
              {filteredMeals.length > 0 ? (
                <View
                  style={[
                    styles.avgGradePill,
                    { backgroundColor: NUTRI_SCORE_COLORS[averageGrade].bg },
                  ]}
                >
                  <Text style={styles.avgGradeText}>
                    {language === 'en' ? `Average ${averageGrade}` : `Moyenne ${averageGrade}`}
                  </Text>
                </View>
              ) : (
                <View style={styles.flameCircle}>
                  <Ionicons name="flame" size={24} color="#F59E0B" />
                </View>
              )}
            </View>

            {/* Profile Info Row or Calculate Prompt */}
            {userProfile ? (
              <View style={styles.profileSummaryRow}>
                <Text style={styles.profileSummaryText} numberOfLines={1}>
                  👤 {userProfile.gender === 'male' ? t.calculator.male : t.calculator.female}, {userProfile.age} yrs • {userProfile.weightKg}kg • {userProfile.heightCm}cm ({getProfileGoalLabel()})
                </Text>
                {onOpenCalculator && (
                  <TouchableOpacity onPress={onOpenCalculator} style={styles.recalculateBtn} activeOpacity={0.7}>
                    <Ionicons name="pencil" size={11} color="#10B981" />
                    <Text style={styles.recalculateBtnText}>{t.journal.adjustBtn}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              onOpenCalculator && (
                <TouchableOpacity onPress={onOpenCalculator} style={styles.calculatePromptBanner} activeOpacity={0.8}>
                  <Ionicons name="calculator-outline" size={14} color="#10B981" />
                  <Text style={styles.calculatePromptText}>
                    {t.journal.calculatePrompt}
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color="#10B981" />
                </TouchableOpacity>
              )
            )}

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: progressPercent > 100 ? '#EF4444' : '#10B981',
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {selectedPeriod === 'today'
                ? dailyTarget - totalCalories > 0
                  ? t.journal.remainingCalories.replace('{count}', (dailyTarget - totalCalories).toString())
                  : t.journal.goalReached
                : t.journal.periodTotal
                    .replace('{calories}', totalCalories.toString())
                    .replace('{count}', filteredMeals.length.toString())}
            </Text>
          </View>

          {/* Sugar & Carbohydrates Isolation Card (Spécial Diabète / Santé) */}
          <View style={styles.sugarCard}>
            <View style={styles.sugarHeader}>
              <View style={styles.sugarTitleRow}>
                <View style={styles.sugarIconCircle}>
                  <MaterialCommunityIcons name="cube-outline" size={16} color="#EC4899" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sugarCardTitle}>{t.journal.sugarTrackerTitle}</Text>
                  <Text style={styles.sugarCardSubtitle}>
                    {selectedPeriod === 'today' ? t.journal.tabToday : `${uniqueDays} ${uniqueDays > 1 ? t.journal.activeDaysSuffixPlural : t.journal.activeDaysSuffix}`} • {t.journal.sugarRecommendedMax}
                  </Text>
                </View>
              </View>
              {userDiet === 'diabetic' && (
                <View style={styles.diabeticBadge}>
                  <Ionicons name="medical" size={11} color="#38BDF8" />
                  <Text style={styles.diabeticBadgeText}>{t.journal.diabeticBadge}</Text>
                </View>
              )}
            </View>

            <View style={styles.sugarStatsGrid}>
              <View style={styles.sugarStatBox}>
                <Text style={styles.sugarStatLabel}>{t.journal.totalSugarsLabel}</Text>
                <Text style={[styles.sugarStatValue, { color: (selectedPeriod === 'today' ? totalSugars : avgSugars) > 50 ? '#EF4444' : (selectedPeriod === 'today' ? totalSugars : avgSugars) > 25 ? '#F59E0B' : '#10B981' }]}>
                  {selectedPeriod === 'today' ? totalSugars : avgSugars} <Text style={styles.sugarStatUnit}>g{selectedPeriod !== 'today' ? '/j' : ''}</Text>
                </Text>
              </View>

              <View style={styles.sugarStatDivider} />

              <View style={styles.sugarStatBox}>
                <Text style={styles.sugarStatLabel}>{t.journal.totalCarbsLabel}</Text>
                <Text style={[styles.sugarStatValue, { color: '#F8FAFC' }]}>
                  {selectedPeriod === 'today' ? totalCarbs : avgCarbs} <Text style={styles.sugarStatUnit}>g{selectedPeriod !== 'today' ? '/j' : ''}</Text>
                </Text>
              </View>

              <View style={styles.sugarStatDivider} />

              <View style={styles.sugarStatBox}>
                <Text style={styles.sugarStatLabel}>{t.journal.sugarShareLabel}</Text>
                <Text style={[styles.sugarStatValue, { color: '#EC4899' }]}>
                  {totalCarbs > 0 ? Math.round((totalSugars / totalCarbs) * 100) : 0} <Text style={styles.sugarStatUnit}>%</Text>
                </Text>
              </View>
            </View>

            {/* Jauge visuelle de sucre */}
            <View style={styles.sugarProgressBarBg}>
              <View
                style={[
                  styles.sugarProgressBarFill,
                  {
                    width: `${Math.min(100, Math.max(8, ((selectedPeriod === 'today' ? totalSugars : avgSugars) / 50) * 100))}%`,
                    backgroundColor: (selectedPeriod === 'today' ? totalSugars : avgSugars) > 50 ? '#EF4444' : (selectedPeriod === 'today' ? totalSugars : avgSugars) > 25 ? '#F59E0B' : '#10B981',
                  },
                ]}
              />
            </View>

            <View style={styles.sugarStatusRow}>
              <Ionicons
                name={(selectedPeriod === 'today' ? totalSugars : avgSugars) > 50 ? 'alert-circle' : (selectedPeriod === 'today' ? totalSugars : avgSugars) > 25 ? 'information-circle' : 'checkmark-circle'}
                size={14}
                color={(selectedPeriod === 'today' ? totalSugars : avgSugars) > 50 ? '#EF4444' : (selectedPeriod === 'today' ? totalSugars : avgSugars) > 25 ? '#F59E0B' : '#10B981'}
              />
              <Text style={styles.sugarStatusText}>
                {(selectedPeriod === 'today' ? totalSugars : avgSugars) > 50
                  ? t.journal.sugarHighStatus
                  : (selectedPeriod === 'today' ? totalSugars : avgSugars) > 25
                  ? t.journal.sugarModerateStatus
                  : t.journal.sugarLowStatus}
              </Text>
            </View>
          </View>

          {/* Meals list */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {t.journal.recordedMeals.replace('{count}', filteredMeals.length.toString())}
            </Text>
            {filteredMeals.length > 0 && (
              <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                <Text style={styles.clearBtnText}>{t.journal.clearAll}</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredMeals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="food-apple-outline" size={40} color="#475569" />
                <Text style={styles.emptyTitle}>{t.journal.emptyTitle}</Text>
                <Text style={styles.emptySubtitle}>{t.journal.emptySubtitle}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const itemDate = new Date(item.timestamp);
              const isToday = itemDate.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
              const dateStr = isToday
                ? itemDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : itemDate.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

              const sugarAmount = item.macros?.sugars !== undefined ? item.macros.sugars : 0;
              const isHighSugar = sugarAmount >= 15;

              return (
                <View style={styles.mealCard}>
                  {item.photoUri ? (
                    <Image source={{ uri: item.photoUri }} style={styles.mealThumbnail} />
                  ) : (
                    <View style={styles.mealPlaceholderThumb}>
                      <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#64748B" />
                    </View>
                  )}

                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName} numberOfLines={1}>
                      {item.dishName}
                    </Text>
                    <View style={styles.mealMeta}>
                      <Ionicons name="time-outline" size={12} color="#94A3B8" />
                      <Text style={styles.mealTime}>{dateStr}</Text>
                      <Text style={styles.mealPortion}>• ~{item.portionGrams} {item.isLiquid ? 'ml' : 'g'}</Text>
                    </View>
                    <View style={styles.mealNutriRow}>
                      <Text style={styles.mealCalories}>🔥 {item.calories} kcal</Text>
                      {item.macros?.sugars !== undefined && (
                        <View style={[styles.mealSugarTag, isHighSugar && styles.mealSugarTagHigh]}>
                          <Text style={[styles.mealSugarText, isHighSugar && styles.mealSugarTextHigh]}>
                            🍬 {sugarAmount}g {t.journal.sugarBadgePrefix}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <NutriScoreBadge grade={item.nutriScore} size="small" />
                </View>
              );
            }}
          />

          {/* Bannière publicitaire discrète AdMob en bas du Journal */}
          <AdBannerComponent isPremium={isPremium} />
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
    height: '84%',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  exportBtnText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 11.5,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  periodTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  periodTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  periodTabActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  periodTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  goalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalLabel: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '600',
  },
  profileActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  profileActiveBadgeText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '700',
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileSummaryText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  recalculateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  recalculateBtnText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  calculatePromptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  calculatePromptText: {
    color: '#A7F3D0',
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  goalCalories: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  goalSub: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  flameCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgGradePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avgGradeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 7,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  mealCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  mealThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  mealPlaceholderThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
    marginRight: 10,
  },
  mealName: {
    color: '#F8FAFC',
    fontSize: 14.5,
    fontWeight: '700',
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  mealTime: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginLeft: 4,
  },
  mealPortion: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginLeft: 4,
  },
  mealNutriRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  mealCalories: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  mealSugarTag: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  mealSugarTagHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  mealSugarText: {
    color: '#F472B6',
    fontSize: 11,
    fontWeight: '700',
  },
  mealSugarTextHigh: {
    color: '#F87171',
    fontWeight: '800',
  },
  sugarCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.25)',
    marginBottom: 14,
  },
  sugarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sugarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sugarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(236, 72, 153, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sugarCardTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  sugarCardSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  diabeticBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  diabeticBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  sugarStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sugarStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  sugarStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sugarStatLabel: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  sugarStatValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  sugarStatUnit: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
  sugarProgressBarBg: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  sugarProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sugarStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  sugarStatusText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
  },
  emptyTitle: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 25,
  },
});

