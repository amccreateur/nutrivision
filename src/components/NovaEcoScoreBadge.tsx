import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EcoScoreGrade, NovaGrade } from '../types/nutrition';

interface Props {
  novaGrade?: NovaGrade;
  ecoScoreGrade?: EcoScoreGrade;
}

export const NovaEcoScoreBadge: React.FC<Props> = ({ novaGrade, ecoScoreGrade }) => {
  if (!novaGrade && !ecoScoreGrade) return null;

  const getNovaColor = (grade: NovaGrade) => {
    switch (grade) {
      case 1:
        return '#00853F';
      case 2:
        return '#85BB2F';
      case 3:
        return '#EE8100';
      case 4:
        return '#E63E11';
      default:
        return '#64748B';
    }
  };

  const getEcoScoreColor = (grade: EcoScoreGrade) => {
    switch (grade) {
      case 'A':
        return '#00853F';
      case 'B':
        return '#85BB2F';
      case 'C':
        return '#FFC000';
      case 'D':
        return '#EE8100';
      case 'E':
        return '#E63E11';
      default:
        return '#64748B';
    }
  };

  return (
    <View style={styles.container}>
      {novaGrade ? (
        <View style={styles.badgeWrapper}>
          <View style={[styles.badge, { backgroundColor: getNovaColor(novaGrade) }]}>
            <Text style={styles.badgeLabel}>NOVA</Text>
            <Text style={styles.badgeValue}>{novaGrade}</Text>
          </View>
          <Text style={styles.subtext}>
            {novaGrade === 1
              ? 'Non transformé'
              : novaGrade === 2
              ? 'Ingrédient culinaire'
              : novaGrade === 3
              ? 'Aliment transformé'
              : 'Ultra-transformé'}
          </Text>
        </View>
      ) : null}

      {ecoScoreGrade ? (
        <View style={styles.badgeWrapper}>
          <View style={[styles.badge, { backgroundColor: getEcoScoreColor(ecoScoreGrade) }]}>
            <Text style={styles.badgeLabel}>ÉCO</Text>
            <Text style={styles.badgeValue}>{ecoScoreGrade}</Text>
          </View>
          <Text style={styles.subtext}>
            {ecoScoreGrade === 'A'
              ? 'Très faible impact'
              : ecoScoreGrade === 'B'
              ? 'Faible impact'
              : ecoScoreGrade === 'C'
              ? 'Impact modéré'
              : ecoScoreGrade === 'D'
              ? 'Impact élevé'
              : 'Impact très élevé'}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 8,
  },
  badgeWrapper: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  badgeLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  subtext: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
  },
});

