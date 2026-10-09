import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getTranslation } from '../i18n';
import { AppLanguage } from '../types/nutrition';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  language?: AppLanguage;
  onComplete: () => void;
}

interface SlideItem {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  iconName: string;
  iconType: 'material' | 'ionicons' | 'feather';
  iconColor: string;
  highlights: { icon: string; text: string }[];
}

export const OnboardingModal: React.FC<Props> = ({ visible, language = 'fr', onComplete }) => {
  const t = getTranslation(language);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      try {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      } catch (e) {
        // ignore if not ready
      }
    }
  }, [visible, language]);

  const slides: SlideItem[] = useMemo(() => [
    {
      id: '1',
      badge: t.onboarding.slide1Badge,
      badgeColor: '#10B981',
      title: t.onboarding.slide1Title,
      subtitle: t.onboarding.slide1Subtitle,
      iconName: 'food-fork-drink',
      iconType: 'material',
      iconColor: '#10B981',
      highlights: [
        { icon: 'scan-outline', text: t.onboarding.slide1Hl1 },
        { icon: 'flame-outline', text: t.onboarding.slide1Hl2 },
        { icon: 'ribbon-outline', text: t.onboarding.slide1Hl3 },
      ],
    },
    {
      id: '2',
      badge: t.onboarding.slide2Badge,
      badgeColor: '#38BDF8',
      title: t.onboarding.slide2Title,
      subtitle: t.onboarding.slide2Subtitle,
      iconName: 'barcode-scan',
      iconType: 'material',
      iconColor: '#38BDF8',
      highlights: [
        { icon: 'search-outline', text: t.onboarding.slide2Hl1 },
        { icon: 'warning-outline', text: t.onboarding.slide2Hl2 },
        { icon: 'checkmark-circle-outline', text: t.onboarding.slide2Hl3 },
      ],
    },
    {
      id: '3',
      badge: t.onboarding.slide3Badge,
      badgeColor: '#0EA5E9',
      title: t.onboarding.slide3Title,
      subtitle: t.onboarding.slide3Subtitle,
      iconName: 'cup-water',
      iconType: 'material',
      iconColor: '#0EA5E9',
      highlights: [
        { icon: 'flame-outline', text: t.onboarding.slide3Hl1 },
        { icon: 'water-outline', text: t.onboarding.slide3Hl2 },
        { icon: 'journal-outline', text: t.onboarding.slide3Hl3 },
      ],
    },
    {
      id: '4',
      badge: t.onboarding.slide4Badge,
      badgeColor: '#A78BFA',
      title: t.onboarding.slide4Title,
      subtitle: t.onboarding.slide4Subtitle,
      iconName: 'chart-line',
      iconType: 'material',
      iconColor: '#A78BFA',
      highlights: [
        { icon: 'calculator-outline', text: t.onboarding.slide4Hl1 },
        { icon: 'water-outline', text: t.onboarding.slide4Hl2 },
        { icon: 'document-text-outline', text: t.onboarding.slide4Hl3 },
      ],
    },
  ], [t]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Top Header with Skip button */}
        <View style={styles.topHeader}>
          <View style={styles.appNameRow}>
            <View style={styles.appLogoCircle}>
              <Ionicons name="nutrition" size={16} color="#10B981" />
            </View>
            <Text style={styles.appName}>NutriVision</Text>
          </View>

          {currentIndex < slides.length - 1 ? (
            <TouchableOpacity onPress={handleFinish} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>{t.onboarding.skip}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* Slides FlatList */}
        <FlatList
          ref={flatListRef}
          data={slides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              {/* Central Glowing Icon Box */}
              <View style={[styles.iconCard, { borderColor: `${item.iconColor}40` }]}>
                <View style={[styles.iconGlow, { backgroundColor: `${item.iconColor}20` }]} />
                {item.iconType === 'material' && (
                  <MaterialCommunityIcons name={item.iconName as any} size={64} color={item.iconColor} />
                )}
                {item.iconType === 'ionicons' && (
                  <Ionicons name={item.iconName as any} size={64} color={item.iconColor} />
                )}
                {item.iconType === 'feather' && (
                  <Feather name={item.iconName as any} size={64} color={item.iconColor} />
                )}
              </View>

              {/* Badge */}
              <View style={[styles.badgePill, { backgroundColor: `${item.badgeColor}20`, borderColor: `${item.badgeColor}50` }]}>
                <Text style={[styles.badgeText, { color: item.badgeColor }]}>{item.badge}</Text>
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>

              {/* Feature Highlights */}
              <View style={styles.highlightsContainer}>
                {item.highlights.map((hl: { icon: string; text: string }, idx: number) => (
                  <View key={idx} style={styles.highlightRow}>
                    <View style={[styles.highlightIconWrapper, { backgroundColor: `${item.iconColor}15` }]}>
                      <Ionicons name={hl.icon as any} size={16} color={item.iconColor} />
                    </View>
                    <Text style={styles.highlightText}>{hl.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        />

        {/* Bottom Navigation Controls */}
        <View style={styles.bottomBar}>
          {/* Pagination Indicators */}
          <View style={styles.paginationContainer}>
            {slides.map((_, index) => {
              const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity,
                      backgroundColor: currentIndex === index ? '#10B981' : '#64748B',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.mainActionBtn}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.mainActionBtnText}>
              {currentIndex === slides.length - 1 ? t.onboarding.start : t.onboarding.continue}
            </Text>
            {currentIndex < slides.length - 1 && (
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingBottom: 10,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 28,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  iconCard: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#131D31',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  iconGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  highlightsContainer: {
    width: '100%',
    backgroundColor: 'rgba(19, 29, 49, 0.7)',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 52 : 32,
    gap: 18,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  mainActionBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  mainActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

