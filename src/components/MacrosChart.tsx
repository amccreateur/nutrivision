import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getTranslation } from '../i18n';
import { AppLanguage, Macronutrients } from '../types/nutrition';

interface Props {
  macros: Macronutrients;
  portionGrams?: number;
  language?: AppLanguage;
}

export const MacrosChart: React.FC<Props> = ({ macros, portionGrams, language = 'fr' }) => {
  const t = getTranslation(language);
  const totalGrams = (macros.proteins + macros.carbs + macros.fats) || 1;
  const proteinPercent = Math.round((macros.proteins / totalGrams) * 100);
  const carbsPercent = Math.round((macros.carbs / totalGrams) * 100);
  const fatsPercent = Math.round((macros.fats / totalGrams) * 100);

  return (
    <View style={styles.container}>
      {/* Header with Calories */}
      <View style={styles.calorieRow}>
        <View>
          <Text style={styles.calorieValue}>{macros.calories}</Text>
          <Text style={styles.calorieUnit}>{t.resultSheet.estimatedKcal}</Text>
        </View>
        {portionGrams ? (
          <View style={styles.portionBadge}>
            <Text style={styles.portionText}>Portion ~{portionGrams}g</Text>
          </View>
        ) : null}
      </View>

      {/* Progress Bar Proportion */}
      <View style={styles.barContainer}>
        <View style={[styles.barSegment, { flex: proteinPercent, backgroundColor: '#3B82F6' }]} />
        <View style={[styles.barSegment, { flex: carbsPercent, backgroundColor: '#F59E0B' }]} />
        <View style={[styles.barSegment, { flex: fatsPercent, backgroundColor: '#EF4444' }]} />
      </View>

      {/* Macro details row */}
      <View style={styles.macroGrid}>
        <View style={styles.macroItem}>
          <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.macroLabel}>{t.resultSheet.proteins}</Text>
          <Text style={styles.macroValue}>{macros.proteins}g</Text>
        </View>

        <View style={styles.macroItem}>
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.macroLabel}>{t.resultSheet.carbs}</Text>
          <Text style={styles.macroValue}>{macros.carbs}g</Text>
        </View>

        <View style={styles.macroItem}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.macroLabel}>{t.resultSheet.fats}</Text>
          <Text style={styles.macroValue}>{macros.fats}g</Text>
        </View>

        <View style={styles.macroItem}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.macroLabel}>{t.resultSheet.fibers}</Text>
          <Text style={styles.macroValue}>{macros.fibers}g</Text>
        </View>
      </View>

      {/* Detailed micro breakdown */}
      <View style={styles.microRow}>
        <Text style={styles.microText}>
          {t.resultSheet.ofWhichSugars} <Text style={styles.microBold}>{macros.sugars}g</Text>
        </Text>
        <Text style={styles.microDivider}>•</Text>
        <Text style={styles.microText}>
          {t.resultSheet.saturatedFats} <Text style={styles.microBold}>{macros.saturatedFats}g</Text>
        </Text>
        <Text style={styles.microDivider}>•</Text>
        <Text style={styles.microText}>
          {t.resultSheet.salt} <Text style={styles.microBold}>{(macros.sodiumMg / 1000).toFixed(2)}g</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  calorieUnit: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  portionBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  portionText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  barContainer: {
    height: 8,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#0F172A',
  },
  barSegment: {
    height: '100%',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  microRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  microText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  microBold: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  microDivider: {
    marginHorizontal: 6,
    color: '#64748B',
    fontSize: 10,
  },
});
