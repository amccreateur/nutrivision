import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { NUTRI_SCORE_COLORS } from '../services/nutriscore';
import { generateAndSharePdfReport } from '../services/reportExport';
import { getPreferences, getTodayWaterTotal, getWaterHistory } from '../services/storage';
import { MealHistoryItem, NutriScoreGrade } from '../types/nutrition';
import { NutriScoreBadge } from './NutriScoreBadge';

interface Props {
  visible: boolean;
  history: MealHistoryItem[];
  dailyTarget: number;
  onClose: () => void;
  onClear: () => void;
}

const GRADE_VALUES: Record<NutriScoreGrade, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
const VALUE_TO_GRADE: Record<number, NutriScoreGrade> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };

export const HistoryModal: React.FC<Props> = ({
  visible,
  history,
  dailyTarget,
  onClose,
  onClear,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Calcul du total des calories du jour
  const today = new Date().setHours(0, 0, 0, 0);
  const todayMeals = history.filter((item) => item.timestamp >= today);
  const totalCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const progressPercent = Math.min(Math.round((totalCalories / dailyTarget) * 100), 100);

  // Calcul du Nutri-Score moyen du jour
  let averageGrade: NutriScoreGrade = 'B';
  if (todayMeals.length > 0) {
    const sumPoints = todayMeals.reduce((acc, m) => acc + (GRADE_VALUES[m.nutriScore] || 3), 0);
    const avg = Math.round(sumPoints / todayMeals.length);
    averageGrade = VALUE_TO_GRADE[Math.max(1, Math.min(5, avg))];
  }

  const handleExportPdf = async () => {
    if (history.length === 0) {
      Alert.alert('Aucun repas', 'Enregistrez au moins un repas avant d’exporter votre rapport.');
      return;
    }
    try {
      setIsExporting(true);
      const prefs = await getPreferences();
      const waterLogs = await getWaterHistory();
      const todayWater = getTodayWaterTotal(waterLogs);
      await generateAndSharePdfReport(history, prefs, todayWater);
    } catch (e: any) {
      Alert.alert('Erreur Export', e?.message || 'Impossible de générer le rapport PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Journal Nutritionnel</Text>
            <View style={styles.headerRightRow}>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExportPdf}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={16} color="#10B981" />
                    <Text style={styles.exportBtnText}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Daily Goal & Nutri-Score Summary */}
          <View style={styles.goalCard}>
            <View style={styles.goalRow}>
              <View>
                <Text style={styles.goalLabel}>Total Aujourd'hui</Text>
                <Text style={styles.goalCalories}>
                  {totalCalories} <Text style={styles.goalSub}>/ {dailyTarget} kcal</Text>
                </Text>
              </View>

              {/* Nutri-Score Average Pill */}
              {todayMeals.length > 0 ? (
                <View
                  style={[
                    styles.avgGradePill,
                    { backgroundColor: NUTRI_SCORE_COLORS[averageGrade].bg },
                  ]}
                >
                  <Text style={styles.avgGradeText}>Moyenne {averageGrade}</Text>
                </View>
              ) : (
                <View style={styles.flameCircle}>
                  <Ionicons name="flame" size={24} color="#F59E0B" />
                </View>
              )}
            </View>

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
              {dailyTarget - totalCalories > 0
                ? `Il vous reste ${dailyTarget - totalCalories} kcal pour votre objectif.`
                : 'Objectif calorique du jour atteint !'}
            </Text>
          </View>

          {/* Meals list */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Repas enregistrés ({history.length})</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                <Text style={styles.clearBtnText}>Effacer tout</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="food-apple-outline" size={40} color="#475569" />
                <Text style={styles.emptyTitle}>Aucun repas enregistré</Text>
                <Text style={styles.emptySubtitle}>
                  Scannez votre plat avec la caméra pour le voir apparaître ici !
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

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
                      <Text style={styles.mealTime}>{timeStr}</Text>
                      <Text style={styles.mealPortion}>• ~{item.portionGrams}g</Text>
                    </View>
                    <Text style={styles.mealCalories}>🔥 {item.calories} kcal</Text>
                  </View>

                  <NutriScoreBadge grade={item.nutriScore} size="small" />
                </View>
              );
            }}
          />
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
    height: '82%',
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
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
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  goalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  goalCalories: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  goalSub: {
    fontSize: 14,
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
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 13,
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
    fontSize: 15,
    fontWeight: '700',
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  mealTime: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 4,
  },
  mealPortion: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 4,
  },
  mealCalories: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
});
