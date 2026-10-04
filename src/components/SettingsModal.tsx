import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { AllergenType, DietType, UserPreferences, UserProfile } from '../types/nutrition';
import { CalorieCalculatorModal } from './CalorieCalculatorModal';

interface Props {
  visible: boolean;
  preferences: UserPreferences;
  onClose: () => void;
  onSave: (updated: Partial<UserPreferences>) => void;
  onOpenOnboarding?: () => void;
}

const ALLERGEN_OPTIONS: { id: AllergenType; label: string }[] = [
  { id: 'gluten', label: '🌾 Gluten' },
  { id: 'lactose', label: '🥛 Lactose' },
  { id: 'nuts', label: '🌰 Fruits à coque' },
  { id: 'peanuts', label: '🥜 Arachides' },
  { id: 'eggs', label: '🥚 Œufs' },
  { id: 'fish', label: '🐟 Poisson' },
  { id: 'crustaceans', label: '🦐 Crustacés' },
  { id: 'soy', label: '🌱 Soja' },
];

const DIET_OPTIONS: { id: DietType; label: string }[] = [
  { id: 'none', label: 'Sans restriction' },
  { id: 'vegetarian', label: '🥗 Végétarien' },
  { id: 'vegan', label: '🌱 Végan' },
  { id: 'halal', label: '🌙 Halal' },
  { id: 'diabetic', label: '🩸 Diabétique' },
  { id: 'low_carb', label: '🥑 Low-Carb' },
];

export const SettingsModal: React.FC<Props> = ({
  visible,
  preferences,
  onClose,
  onSave,
  onOpenOnboarding,
}) => {
  const [apiKey, setApiKey] = useState(preferences.apiKey || '');
  const [calorieTarget, setCalorieTarget] = useState(preferences.dailyCalorieTarget.toString());
  const [waterTarget, setWaterTarget] = useState((preferences.dailyWaterTargetMl || 2000).toString());
  const [useHaptics, setUseHaptics] = useState(preferences.useHaptics);
  const [enableBarcodeScanner, setEnableBarcodeScanner] = useState(preferences.enableBarcodeScanner ?? true);
  const [enableVoiceFeedback, setEnableVoiceFeedback] = useState(preferences.enableVoiceFeedback ?? true);
  const [allergens, setAllergens] = useState<AllergenType[]>(preferences.allergens || []);
  const [diet, setDiet] = useState<DietType>(preferences.diet || 'none');
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(preferences.userProfile);
  const [showCalculator, setShowCalculator] = useState(false);

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

  const handleSave = () => {
    onSave({
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
    onClose();
  };

  const openGoogleAiStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Paramètres & Profil Santé</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Régime Alimentaire */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="leaf-outline" size={18} color="#10B981" />
                <Text style={styles.sectionTitle}>Régime Alimentaire</Text>
              </View>
              <Text style={styles.sectionDescription}>
                L'IA vérifiera automatiquement la conformité de vos plats lors de chaque scan.
              </Text>
              <View style={styles.chipsContainer}>
                {DIET_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.chip, diet === opt.id && styles.chipActive]}
                    onPress={() => setDiet(opt.id)}
                  >
                    <Text style={[styles.chipText, diet === opt.id && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Allergènes à surveiller */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning-outline" size={18} color="#EF4444" />
                <Text style={styles.sectionTitle}>Allergènes & Intolérances</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Une alerte clignotante s'affichera si l'un de ces allergènes est détecté dans votre assiette.
              </Text>
              <View style={styles.chipsContainer}>
                {ALLERGEN_OPTIONS.map((opt) => {
                  const isSelected = allergens.includes(opt.id);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.chip, isSelected && styles.chipAlertActive]}
                      onPress={() => toggleAllergen(opt.id)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipAlertTextActive]}>
                        {opt.label}
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
                <Text style={styles.sectionTitle}>Objectifs Quotidiens</Text>
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
                    <Text style={styles.calculatorBannerTitle}>Calculer selon mon profil</Text>
                    <Text style={styles.calculatorBannerSubtitle}>
                      {userProfile
                        ? `Âge: ${userProfile.age} ans • Poids: ${userProfile.weightKg} kg • ${userProfile.heightCm} cm`
                        : 'Estimez vos besoins selon âge, taille, poids & sport'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#10B981" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Calories quotidiennes (kcal)</Text>
              <TextInput
                style={styles.input}
                placeholder="2000"
                placeholderTextColor="#64748B"
                value={calorieTarget}
                onChangeText={setCalorieTarget}
                keyboardType="numeric"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Hydratation quotidienne (ml)</Text>
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
                <Text style={styles.switchTitle}>Annonce Vocale des Résultats</Text>
                <Text style={styles.switchSubtitle}>Lit à haute voix le nom du plat, les calories et le Nutri-Score</Text>
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
                <Text style={styles.switchTitle}>Scanner Hybride Code-Barres</Text>
                <Text style={styles.switchSubtitle}>Reconnaît les produits emballés via Open Food Facts</Text>
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
                <Text style={styles.switchTitle}>Vibrations haptiques</Text>
                <Text style={styles.switchSubtitle}>Retour tactile lors de la détection de nourriture</Text>
              </View>
              <Switch
                value={useHaptics}
                onValueChange={setUseHaptics}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Gemini API Key Config */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="key-outline" size={18} color="#38BDF8" />
                <Text style={styles.sectionTitle}>Clé API Google Gemini (Facultatif)</Text>
              </View>
              <Text style={styles.sectionDescription}>
                La clé par défaut intégrée est prête à l'emploi. Vous pouvez également renseigner votre clé personnelle.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex: AIzaSy..."
                placeholderTextColor="#64748B"
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />

              <TouchableOpacity style={styles.linkButton} onPress={openGoogleAiStudio}>
                <Text style={styles.linkText}>Obtenir une clé gratuite sur Google AI Studio</Text>
                <Feather name="external-link" size={14} color="#38BDF8" />
              </TouchableOpacity>
            </View>

            {/* Privacy info */}
            <View style={styles.privacyCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.privacyText}>
                Vos données de santé, allergènes et photos restent stockées localement sur votre téléphone.
              </Text>
            </View>

            {/* Guide & Onboarding Button */}
            {onOpenOnboarding && (
              <TouchableOpacity style={styles.guideBtn} onPress={onOpenOnboarding} activeOpacity={0.8}>
                <Ionicons name="book-outline" size={18} color="#38BDF8" />
                <Text style={styles.guideBtnText}>Revoir le guide d’utilisation</Text>
              </TouchableOpacity>
            )}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Enregistrer mes préférences</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Modal Calculateur Nutritionnel */}
      <CalorieCalculatorModal
        visible={showCalculator}
        initialProfile={userProfile}
        onClose={() => setShowCalculator(false)}
        onApply={handleApplyCalculatedNeeds}
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
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 20,
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
