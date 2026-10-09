import React, { useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { getTranslation } from '../i18n';
import { AppLanguage, FoodItemAnalysis } from '../types/nutrition';
import { NutriScoreBadge } from './NutriScoreBadge';

interface Props {
  isAnalyzing: boolean;
  liveDetection?: FoodItemAnalysis | null;
  isAutoScan: boolean;
  language?: AppLanguage;
}

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = Math.min(width * 0.78, 280);

export const ScannerOverlay: React.FC<Props> = ({
  isAnalyzing,
  liveDetection,
  isAutoScan,
  language = 'fr',
}) => {
  const t = getTranslation(language);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation du laser de scan (actif uniquement en mode visée)
  useEffect(() => {
    if (isAnalyzing) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [isAnalyzing, scanLineAnim]);

  // Animation de pulsation
  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAnalyzing, pulseAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_BOX_SIZE - 4],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Center Display */}
      <View style={styles.centerContainer} pointerEvents="none">
        {/* --- PENDANT L'ANALYSE : La case verte et la barre disparaissent, remplacées par un indicateur central grand format --- */}
        {isAnalyzing ? (
          <Animated.View style={[styles.analyzingCenterBox, { transform: [{ scale: pulseAnim }] }]}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.analyzingCenterTitle}>{t.hud.analyzingDishTitle}</Text>
            <Text style={styles.analyzingCenterSubtitle}>{t.modes.dishSubtitle}</Text>
          </Animated.View>
        ) : (
          /* --- EN MODE VISÉE : Case de cadrage avec laser de scan --- */
          <Animated.View
            style={[
              styles.scanBox,
              {
                transform: [{ scale: pulseAnim }],
                borderColor: liveDetection ? '#10B981' : 'rgba(255,255,255,0.4)',
              },
            ]}
          >
            {/* Corner Brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Animated Laser Line */}
            <Animated.View
              style={[
                styles.scanLaser,
                {
                  transform: [{ translateY }],
                  backgroundColor: '#10B981',
                  shadowColor: '#10B981',
                },
              ]}
            />
          </Animated.View>
        )}

        {/* --- RÉSULTAT EN DIRECT PRÉCÉDENT (Masqué pendant l'analyse) --- */}
        {!isAnalyzing && liveDetection && (
          <View style={styles.liveDetectionCard}>
            <View style={styles.liveDetectionHeader}>
              <Text style={styles.liveDishName} numberOfLines={1}>
                {liveDetection.name}
              </Text>
              <Text style={styles.liveCalories}>🔥 {liveDetection.macros.calories} {t.hud.liveCalories}</Text>
            </View>
            <View style={styles.badgeWrapper}>
              <NutriScoreBadge grade={liveDetection.nutriScore.grade} size="small" />
            </View>
          </View>
        )}
      </View>

      {/* Status Hint above bottom dock */}
      <View style={styles.hintContainer} pointerEvents="none">
        <Text style={[styles.hintText, isAnalyzing && styles.hintTextAnalyzing]}>
          {isAnalyzing
            ? t.hud.hintAnalyzingDish
            : isAutoScan
            ? t.hud.hintAutoScan
            : t.hud.hintAimDish}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderRadius: 24,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
  scanLaser: {
    width: '100%',
    height: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  analyzingCenterBox: {
    width: SCAN_BOX_SIZE,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  analyzingCenterTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  analyzingCenterSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  liveDetectionCard: {
    marginTop: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: SCAN_BOX_SIZE,
  },
  liveDetectionHeader: {
    flex: 1,
    marginRight: 10,
  },
  liveDishName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  liveCalories: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeWrapper: {
    alignItems: 'flex-end',
  },
  hintContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: Platform.OS === 'android' ? 180 : 140,
  },
  hintText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    overflow: 'hidden',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  hintTextAnalyzing: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    color: '#A7F3D0',
  },
});
