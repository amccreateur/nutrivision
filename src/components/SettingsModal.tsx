import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getTranslation } from '../i18n';
import { AllergenType, AppLanguage, DietType, UserPreferences, UserProfile } from '../types/nutrition';
import { CalorieCalculatorModal } from './CalorieCalculatorModal';
import { PaywallModal } from './PaywallModal';

interface Props {
  visible: boolean;
  preferences: UserPreferences;
  onClose: () => void;
  onSave: (updated: Partial<UserPreferences>) => void;
  onOpenOnboarding?: () => void;
}

const ALLERGEN_KEYS: AllergenType[] = [
  'gluten',
  'lactose',
  'nuts',
  'peanuts',
  'eggs',
  'fish',
  'crustaceans',
  'soy',
];

const DIET_KEYS: DietType[] = [
  'none',
  'vegetarian',
  'vegan',
  'halal',
  'kosher',
  'diabetic',
  'low_carb',
];

export const SettingsModal: React.FC<Props> = ({
  visible,
  preferences,
  onClose,
  onSave,
  onOpenOnboarding,
}) => {
  const [language, setLanguage] = useState<AppLanguage>(preferences.language || 'fr');
  const [apiKey, setApiKey] = useState(preferences.apiKey || '');
  const [calorieTarget, setCalorieTarget] = useState(preferences.dailyCalorieTarget.toString());
  const [waterTarget, setWaterTarget] = useState((preferences.dailyWaterTargetMl || 2000).toString());
  const [useHaptics, setUseHaptics] = useState(preferences.useHaptics);
  const [enableBarcodeScanner, setEnableBarcodeScanner] = useState(preferences.enableBarcodeScanner ?? true);
  const [enableVoiceFeedback, setEnableVoiceFeedback] = useState(preferences.enableVoiceFeedback ?? true);
  const [allergens, setAllergens] = useState<AllergenType[]>(preferences.allergens || []);
  const [diet, setDiet] = useState<DietType>(preferences.diet || 'none');
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(preferences.userProfile);
  const [isPremium, setIsPremium] = useState<boolean>(preferences.isPremium || false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (visible) {
      setLanguage(preferences.language || 'fr');
      setApiKey(preferences.apiKey || '');
      setCalorieTarget(preferences.dailyCalorieTarget.toString());
      setWaterTarget((preferences.dailyWaterTargetMl || 2000).toString());
      setUseHaptics(preferences.useHaptics);
      setEnableBarcodeScanner(preferences.enableBarcodeScanner ?? true);
      setEnableVoiceFeedback(preferences.enableVoiceFeedback ?? true);
      setAllergens(preferences.allergens || []);
      setDiet(preferences.diet || 'none');
      setUserProfile(preferences.userProfile);
      setIsPremium(preferences.isPremium || false);
    }
  }, [preferences, visible]);

  const t = getTranslation(language);

  const toggleAllergen = (item: AllergenType) => {
    if (allergens.includes(item)) {
      setAllergens(allergens.filter((a) => a !== item));
    } else {
      setAllergens([...allergens, item]);
    }
  };

  const handleApplyCalculatedNeeds = (cal: number, water: number, profile: UserProfile) => {
    setCalorieTarget(cal.toString());
    setWaterTarget(water.toString());
    setUserProfile(profile);
  };

  const handleSelectLanguage = (newLang: AppLanguage) => {
    setLanguage(newLang);
    onSave({
      language: newLang,
      apiKey: apiKey.trim(),
      dailyCalorieTarget: parseInt(calorieTarget, 10) || 2000,
      dailyWaterTargetMl: parseInt(waterTarget, 10) || 2000,
      useHaptics,
      enableBarcodeScanner,
      enableVoiceFeedback,
      allergens,
      diet,
      userProfile,
    });
  };

  const handleSave = () => {
    onSave({
      language,
      apiKey: apiKey.trim(),
      dailyCalorieTarget: parseInt(calorieTarget, 10) || 2000,
      dailyWaterTargetMl: parseInt(waterTarget, 10) || 2000,
      useHaptics,
      enableBarcodeScanner,
      enableVoiceFeedback,
      allergens,
      diet,
      userProfile,
      isPremium,
    });
    onClose();
  };

  const handleOpenGuide = () => {
    onSave({
      language,
      apiKey: apiKey.trim(),
      dailyCalorieTarget: parseInt(calorieTarget, 10) || 2000,
      dailyWaterTargetMl: parseInt(waterTarget, 10) || 2000,
      useHaptics,
      enableBarcodeScanner,
      enableVoiceFeedback,
      allergens,
      diet,
      userProfile,
    });
    onOpenOnboarding?.();
  };

  const openGoogleAiStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t.settings.title}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Langue de l'application */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="globe-outline" size={18} color="#38BDF8" />
                <Text style={styles.sectionTitle}>{t.settings.languageSection}</Text>
              </View>
              <View style={styles.languageRow}>
                <TouchableOpacity
                  style={[styles.languageBtn, language === 'fr' && styles.languageBtnActive]}
                  onPress={() => handleSelectLanguage('fr')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.languageBtnText, language === 'fr' && styles.languageBtnTextActive]}>
                    {t.settings.languageFr}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.languageBtn, language === 'en' && styles.languageBtnActive]}
                  onPress={() => handleSelectLanguage('en')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.languageBtnText, language === 'en' && styles.languageBtnTextActive]}>
                    {t.settings.languageEn}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Régime Alimentaire */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="leaf-outline" size={18} color="#10B981" />
                <Text style={styles.sectionTitle}>{t.settings.dietSection}</Text>
              </View>
              <Text style={styles.sectionDescription}>{t.settings.dietDesc}</Text>
              <View style={styles.chipsContainer}>
                {DIET_KEYS.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.chip, diet === key && styles.chipActive]}
                    onPress={() => setDiet(key)}
                  >
                    <Text style={[styles.chipText, diet === key && styles.chipTextActive]}>
                      {t.diets[key]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Allergènes à surveiller */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning-outline" size={18} color="#EF4444" />
                <Text style={styles.sectionTitle}>{t.settings.allergensSection}</Text>
              </View>
              <Text style={styles.sectionDescription}>{t.settings.allergensDesc}</Text>
              <View style={styles.chipsContainer}>
                {ALLERGEN_KEYS.map((key) => {
                  const isSelected = allergens.includes(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.chip, isSelected && styles.chipAlertActive]}
                      onPress={() => toggleAllergen(key)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipAlertTextActive]}>
                        {t.allergens[key]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Objectifs Quotidiens */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="track-changes" size={18} color="#F59E0B" />
                <Text style={styles.sectionTitle}>{t.settings.goalsSection}</Text>
              </View>

              {/* Bouton Calculateur Automatique Interactif */}
              <TouchableOpacity
                style={styles.calculatorBanner}
                onPress={() => setShowCalculator(true)}
                activeOpacity={0.8}
              >
                <View style={styles.calculatorBannerLeft}>
                  <View style={styles.calculatorIconBadge}>
                    <Ionicons name="calculator-outline" size={20} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.calculatorBannerTitle}>{t.settings.calcBannerTitle}</Text>
                    <Text style={styles.calculatorBannerSubtitle}>
                      {userProfile
                        ? t.settings.calcBannerDescConfigured
                            .replace('{age}', userProfile.age.toString())
                            .replace('{weight}', userProfile.weightKg.toString())
                            .replace('{height}', userProfile.heightCm.toString())
                        : t.settings.calcBannerDescEmpty}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#10B981" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>{t.settings.caloriesLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder="2000"
                placeholderTextColor="#64748B"
                value={calorieTarget}
                onChangeText={setCalorieTarget}
                keyboardType="numeric"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>{t.settings.waterLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder="2000"
                placeholderTextColor="#64748B"
                value={waterTarget}
                onChangeText={setWaterTarget}
                keyboardType="numeric"
              />
            </View>

            {/* Voice Feedback Switch */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>{t.settings.voiceTitle}</Text>
                <Text style={styles.switchSubtitle}>{t.settings.voiceSubtitle}</Text>
              </View>
              <Switch
                value={enableVoiceFeedback}
                onValueChange={setEnableVoiceFeedback}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Barcode Scanner Switch */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>{t.settings.barcodeTitle}</Text>
                <Text style={styles.switchSubtitle}>{t.settings.barcodeSubtitle}</Text>
              </View>
              <Switch
                value={enableBarcodeScanner}
                onValueChange={setEnableBarcodeScanner}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Haptics Switch */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>{t.settings.hapticsTitle}</Text>
                <Text style={styles.switchSubtitle}>{t.settings.hapticsSubtitle}</Text>
              </View>
              <Switch
                value={useHaptics}
                onValueChange={setUseHaptics}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* NutriVision Pro / Remove Ads */}
            <View style={styles.proSectionCard}>
              <TouchableOpacity
                style={styles.proHeader}
                onPress={() => setShowPaywall(true)}
                activeOpacity={0.8}
              >
                <View style={styles.proIconBadge}>
                  <Ionicons name="sparkles" size={18} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proTitle}>{t.settings.premiumTitle}</Text>
                  <Text style={styles.proSubtitle}>{t.settings.premiumSubtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proPaywallBtn}
                onPress={() => setShowPaywall(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="star" size={16} color="#0F172A" />
                <Text style={styles.proPaywallBtnText}>{t.settings.removeAdsBtn}</Text>
              </TouchableOpacity>

              <View style={styles.proToggleRow}>
                <View style={styles.proBadgeRow}>
                  <View style={[styles.statusDot, { backgroundColor: isPremium ? '#10B981' : '#F59E0B' }]} />
                  <Text style={styles.proStatusText}>
                    {isPremium ? t.settings.proBadge : t.settings.adsActiveBadge}
                  </Text>
                </View>
                <Switch
                  value={isPremium}
                  onValueChange={(val) => {
                    setIsPremium(val);
                    onSave({ isPremium: val });
                  }}
                  trackColor={{ false: '#334155', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Privacy info */}
            <View style={styles.privacyCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.privacyText}>{t.settings.privacyText}</Text>
            </View>

            {/* Guide & Onboarding Button */}
            {onOpenOnboarding && (
              <TouchableOpacity style={styles.guideBtn} onPress={handleOpenGuide} activeOpacity={0.8}>
                <Ionicons name="book-outline" size={18} color="#38BDF8" />
                <Text style={styles.guideBtnText}>{t.settings.guideBtn}</Text>
              </TouchableOpacity>
            )}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{t.settings.saveBtn}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Modal Calculateur Nutritionnel */}
      <CalorieCalculatorModal
        visible={showCalculator}
        initialProfile={userProfile}
        language={language}
        onClose={() => setShowCalculator(false)}
        onApply={handleApplyCalculatedNeeds}
      />

      {/* Modal Paywall NutriVision Pro */}
      <PaywallModal
        visible={showPaywall}
        language={language}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => {
          setIsPremium(true);
          onSave({ isPremium: true });
        }}
      />
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
    height: '86%',
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
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languageBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  languageBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  languageBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  languageBtnTextActive: {
    color: '#38BDF8',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  chipAlertActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  chipAlertTextActive: {
    color: '#EF4444',
    fontWeight: '700',
  },
  calculatorBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  calculatorBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  calculatorIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatorBannerTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  calculatorBannerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  switchRow: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  switchInfo: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  proSectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 16,
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  proIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  proSubtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  proPaywallBtn: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  proPaywallBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  proToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  proBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  proStatusText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 16,
  },
  privacyText: {
    flex: 1,
    color: '#A7F3D0',
    fontSize: 12,
  },
  guideBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 8,
  },
  guideBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

