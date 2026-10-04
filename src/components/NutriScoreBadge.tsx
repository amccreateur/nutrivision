import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NUTRI_SCORE_COLORS } from '../services/nutriscore';
import { AppLanguage, NutriScoreGrade } from '../types/nutrition';

interface Props {
  grade: NutriScoreGrade;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  language?: AppLanguage;
}

const GRADES: NutriScoreGrade[] = ['A', 'B', 'C', 'D', 'E'];

const NUTRI_LABELS: Record<'fr' | 'en', Record<NutriScoreGrade, string>> = {
  fr: {
    A: 'Très bonne qualité nutritionnelle',
    B: 'Bonne qualité nutritionnelle',
    C: 'Qualité nutritionnelle moyenne',
    D: 'Qualité nutritionnelle médiocre',
    E: 'Faible qualité nutritionnelle',
  },
  en: {
    A: 'Very good nutritional quality',
    B: 'Good nutritional quality',
    C: 'Average nutritional quality',
    D: 'Poor nutritional quality',
    E: 'Low nutritional quality',
  },
};

export const NutriScoreBadge: React.FC<Props> = ({
  grade,
  size = 'medium',
  showLabel = false,
  language = 'fr',
}) => {
  const isLarge = size === 'large';
  const isSmall = size === 'small';
  const label = NUTRI_LABELS[language]?.[grade] || NUTRI_LABELS.fr[grade];

  return (
    <View style={styles.container}>
      <View style={[styles.badgeWrapper, isLarge && styles.badgeWrapperLarge, isSmall && styles.badgeWrapperSmall]}>
        {GRADES.map((g) => {
          const isActive = g === grade;
          const colorInfo = NUTRI_SCORE_COLORS[g];

          return (
            <View
              key={g}
              style={[
                styles.letterBlock,
                isLarge && styles.letterBlockLarge,
                isSmall && styles.letterBlockSmall,
                {
                  backgroundColor: isActive ? colorInfo.bg : '#334155',
                  opacity: isActive ? 1 : 0.45,
                  transform: isActive ? [{ scale: isLarge ? 1.2 : 1.1 }] : [{ scale: 1 }],
                  zIndex: isActive ? 2 : 1,
                  shadowColor: isActive ? colorInfo.bg : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.6 : 0,
                  shadowRadius: 4,
                  elevation: isActive ? 4 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.letterText,
                  isLarge && styles.letterTextLarge,
                  isSmall && styles.letterTextSmall,
                  { color: isActive ? colorInfo.text : '#94A3B8' },
                  isActive && styles.activeLetterText,
                ]}
              >
                {g}
              </Text>
            </View>
          );
        })}
      </View>

      {showLabel && (
        <Text style={[styles.labelText, { color: NUTRI_SCORE_COLORS[grade].bg }]}>
          Nutri-Score {grade} • {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badgeWrapper: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeWrapperLarge: {
    borderRadius: 20,
    padding: 5,
  },
  badgeWrapperSmall: {
    borderRadius: 10,
    padding: 2,
  },
  letterBlock: {
    width: 28,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1.5,
  },
  letterBlockLarge: {
    width: 44,
    height: 52,
    borderRadius: 12,
    marginHorizontal: 3,
  },
  letterBlockSmall: {
    width: 20,
    height: 24,
    borderRadius: 6,
    marginHorizontal: 1,
  },
  letterText: {
    fontWeight: '800',
    fontSize: 16,
  },
  letterTextLarge: {
    fontSize: 24,
  },
  letterTextSmall: {
    fontSize: 11,
  },
  activeLetterText: {
    fontWeight: '900',
  },
  labelText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
});
