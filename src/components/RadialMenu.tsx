import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

import { getTranslation } from '../i18n';
import { AppLanguage } from '../types/nutrition';

const { width } = Dimensions.get('window');
const RADIUS = 120; // Rayon de dispersion circulaire

export interface RadialMenuItem {
  id: string;
  iconName: string;
  iconType: 'ionicons' | 'feather' | 'material';
  label: string;
  color: string;
  badge?: string;
  isActive?: boolean;
  onPress: () => void;
}

interface Props {
  items: RadialMenuItem[];
  currentModeLabel: string;
  currentModeIcon: string;
  todayCalories: number;
  todayWaterMl: number;
  language?: AppLanguage;
}

export const RadialMenu: React.FC<Props> = ({
  items,
  currentModeLabel,
  currentModeIcon,
  todayCalories,
  todayWaterMl,
  language = 'fr',
}) => {
  const t = getTranslation(language);
  const [isOpen, setIsOpen] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOpen(!isOpen);
  };

  const handleItemPress = (item: RadialMenuItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(false);
    setTimeout(() => {
      item.onPress();
    }, 150);
  };

  const spin = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.75],
  });

  return (
    <>
      {/* Bouton Déclencheur Clair & Évident à Cliquer */}
      <View style={styles.floatingTriggerContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.triggerButton}
          onPress={toggleMenu}
          activeOpacity={0.75}
        >
          {/* Badge du mode actuel avec flèche déroulante pour inciter au clic */}
          <View style={styles.modeBadge}>
            <MaterialCommunityIcons
              name={currentModeIcon as any || 'silverware-fork-knife'}
              size={18}
              color="#10B981"
            />
            <Text style={styles.triggerLabel}>{currentModeLabel}</Text>
            <View style={styles.dropdownPill}>
              <Text style={styles.dropdownHint}>{t.radial.menu}</Text>
              <Ionicons name="chevron-down" size={14} color="#10B981" />
            </View>
          </View>

          {/* Compteurs calories & eau */}
          <View style={styles.triggerStatsPill}>
            <Text style={styles.miniStatText}>🔥 {todayCalories} {t.radial.calories}</Text>
            <Text style={[styles.miniStatText, { color: '#38BDF8' }]}>💧 {todayWaterMl} {t.radial.water}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal Camembert / Menu Radial */}
      <Modal visible={isOpen} transparent animationType="none" onRequestClose={() => setIsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <Animated.View style={[styles.modalBackdrop, { opacity: backdropOpacity }]}>
            <View style={styles.wheelCenterContainer}>
              {/* Titre informatif */}
              <View style={styles.wheelHeader}>
                <Text style={styles.wheelTitle}>{t.radial.menuTitle}</Text>
                <Text style={styles.wheelSubtitle}>{t.radial.menuSubtitle}</Text>
              </View>

              {/* Conteneur Circulaire */}
              <View style={styles.circleArea}>
                {/* Anneau décoratif */}
                <View style={styles.ringGuide} />

                {/* Items disposés en camembert / cercle */}
                {items.map((item, index) => {
                  const angle = (index * (360 / items.length) - 90) * (Math.PI / 180);
                  const targetX = Math.cos(angle) * RADIUS;
                  const targetY = Math.sin(angle) * RADIUS;

                  const itemTranslateX = animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, targetX],
                  });

                  const itemTranslateY = animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, targetY],
                  });

                  const itemScale = animValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.6, 1],
                  });

                  return (
                    <Animated.View
                      key={item.id}
                      style={[
                        styles.radialItemWrapper,
                        {
                          transform: [
                            { translateX: itemTranslateX },
                            { translateY: itemTranslateY },
                            { scale: itemScale },
                          ],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.radialCircleButton,
                          { borderColor: item.isActive ? item.color : 'rgba(255, 255, 255, 0.2)' },
                          item.isActive && { backgroundColor: 'rgba(16, 185, 129, 0.25)' },
                        ]}
                        onPress={() => handleItemPress(item)}
                        activeOpacity={0.7}
                      >
                        {item.iconType === 'ionicons' && (
                          <Ionicons name={item.iconName as any} size={22} color={item.color} />
                        )}
                        {item.iconType === 'material' && (
                          <MaterialCommunityIcons name={item.iconName as any} size={22} color={item.color} />
                        )}
                        {item.iconType === 'feather' && (
                          <Feather name={item.iconName as any} size={22} color={item.color} />
                        )}
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.radialItemLabel,
                          item.isActive && { color: item.color, fontWeight: '800' },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Animated.View>
                  );
                })}

                {/* Bouton Central de fermeture */}
                <TouchableOpacity
                  style={styles.centralHubButton}
                  onPress={() => setIsOpen(false)}
                  activeOpacity={0.8}
                >
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="close" size={28} color="#FFFFFF" />
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingTriggerContainer: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 20,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#10B981',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '96%',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
  },
  triggerLabel: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
    gap: 2,
  },
  dropdownHint: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
  },
  triggerStatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingRight: 2,
  },
  miniStatText: {
    color: '#F59E0B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelHeader: {
    alignItems: 'center',
    marginBottom: 45,
  },
  wheelTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  wheelSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  circleArea: {
    width: RADIUS * 2 + 80,
    height: RADIUS * 2 + 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringGuide: {
    position: 'absolute',
    width: RADIUS * 2,
    height: RADIUS * 2,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  radialItemWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  radialCircleButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  radialItemLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    width: 90,
  },
  centralHubButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
