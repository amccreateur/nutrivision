import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FoodItemAnalysis } from '../types/nutrition';
import { NutriScoreBadge } from './NutriScoreBadge';

interface Props {
  isAnalyzing: boolean;
  liveDetection?: FoodItemAnalysis | null;
  torchOn: boolean;
  onToggleTorch: () => void;
  onFlipCamera: () => void;
  onManualCapture: () => void;
  isAutoScan: boolean;
  onToggleAutoScan: () => void;
}

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = Math.min(width * 0.8, 300);

export const ScannerOverlay: React.FC<Props> = ({
  isAnalyzing,
  liveDetection,
  torchOn,
  onToggleTorch,
  onFlipCamera,
  onManualCapture,
  isAutoScan,
  onToggleAutoScan,
}) => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation du laser de scan
  useEffect(() => {
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
  }, [scanLineAnim]);

  // Animation de pulsation en mode analyse
  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
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
      {/* Top Controls */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={onToggleTorch}>
          {torchOn ? (
            <Ionicons name="flash" size={22} color="#FACC15" />
          ) : (
            <Ionicons name="flash-off" size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modePill, isAutoScan && styles.modePillActive]}
          onPress={onToggleAutoScan}
        >
          <MaterialCommunityIcons
            name="auto-fix"
            size={18}
            color={isAutoScan ? '#10B981' : '#94A3B8'}
          />
          <Text style={[styles.modeText, isAutoScan && styles.modeTextActive]}>
            {isAutoScan ? 'Scan Direct Actif' : 'Scan au Clic'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={onFlipCamera}>
          <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Target Reticle in Center */}
      <View style={styles.centerContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.scanBox,
            {
              transform: [{ scale: pulseAnim }],
              borderColor: liveDetection ? '#10B981' : isAnalyzing ? '#3B82F6' : 'rgba(255,255,255,0.4)',
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
                backgroundColor: isAnalyzing ? '#3B82F6' : '#10B981',
                shadowColor: isAnalyzing ? '#3B82F6' : '#10B981',
              },
            ]}
          />
        </Animated.View>

        {/* Live Detected Preview Pill */}
        {liveDetection && (
          <View style={styles.liveDetectionCard}>
            <View style={styles.liveDetectionHeader}>
              <Text style={styles.liveDishName} numberOfLines={1}>
                {liveDetection.name}
              </Text>
              <Text style={styles.liveCalories}>🔥 {liveDetection.macros.calories} kcal</Text>
            </View>
            <View style={styles.badgeWrapper}>
              <NutriScoreBadge grade={liveDetection.nutriScore.grade} size="small" />
            </View>
          </View>
        )}
      </View>

      {/* Bottom Shutter & Status */}
      <View style={styles.bottomBar}>
        <Text style={styles.hintText}>
          {isAnalyzing
            ? '🤖 Analyse nutritionnelle du plat...'
            : isAutoScan
            ? 'Visez le plat pour une détection continue'
            : 'Cadrez votre assiette et appuyez sur le déclencheur'}
        </Text>

        <TouchableOpacity
          style={[styles.shutterButton, isAnalyzing && styles.shutterButtonLoading]}
          onPress={onManualCapture}
          disabled={isAnalyzing}
          activeOpacity={0.8}
        >
          <View style={styles.shutterInner}>
            <Feather name="camera" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
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
  topBar: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modePillActive: {
    borderColor: 'rgba(16, 185, 129, 0.6)',
    backgroundColor: 'rgba(6, 78, 59, 0.7)',
  },
  modeText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  modeTextActive: {
    color: '#10B981',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  liveDetectionCard: {
    marginTop: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
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
  bottomBar: {
    paddingBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  hintText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
});
