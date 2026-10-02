import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ActivityLevel, CalorieGoal, UserProfile } from '../types/nutrition';
import { calculateNutritionNeeds } from '../utils/calorieCalculator';

interface Props {
  visible: boolean;
  initialProfile?: UserProfile;
  onClose: () => void;
  onApply: (calorieTarget: number, waterTargetMl: number, profile: UserProfile) => void;
}

const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string; icon: string; desc: string }[] = [
  { id: 'sedentary', label: 'Sédentaire', icon: 'seat-recline-normal', desc: 'Travail de bureau, peu d’exercice' },
  { id: 'light', label: 'Légèrement actif', icon: 'walk', desc: 'Sport 1 à 2 fois par semaine' },
  { id: 'moderate', label: 'Modérément actif', icon: 'run', desc: 'Sport 3 à 5 fois par semaine' },
  { id: 'active', label: 'Très actif', icon: 'lightning-bolt', desc: 'Entraînement intense quotidien' },
];

const GOAL_OPTIONS: { id: CalorieGoal; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'lose_weight', label: 'Perte de poids', icon: 'trending-down', desc: '-400 kcal (déficit modéré)', color: '#10B981' },
  { id: 'maintain', label: 'Maintien du poids', icon: 'scale-balance', desc: 'Équilibre énergétique stable', color: '#38BDF8' },
  { id: 'gain_muscle', label: 'Prise de masse', icon: 'trending-up', desc: '+350 kcal (surplus contrôlé)', color: '#F59E0B' },
];

export const CalorieCalculatorModal: React.FC<Props> = ({
  visible,
  initialProfile,
  onClose,
  onApply,
}) => {
  const [gender, setGender] = useState<'male' | 'female'>(initialProfile?.gender || 'male');
  const [age, setAge] = useState(initialProfile?.age ? initialProfile.age.toString() : '30');
  const [weightKg, setWeightKg] = useState(initialProfile?.weightKg ? initialProfile.weightKg.toString() : '72');
  const [heightCm, setHeightCm] = useState(initialProfile?.heightCm ? initialProfile.heightCm.toString() : '175');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialProfile?.activityLevel || 'moderate');
  const [goal, setGoal] = useState<CalorieGoal>(initialProfile?.goal || 'maintain');

  const currentProfile: UserProfile = useMemo(() => ({
    gender,
    age: Math.max(10, Math.min(120, parseInt(age, 10) || 30)),
    weightKg: Math.max(30, Math.min(250, parseFloat(weightKg) || 70)),
    heightCm: Math.max(100, Math.min(240, parseFloat(heightCm) || 175)),
    activityLevel,
    goal,
  }), [gender, age, weightKg, heightCm, activityLevel, goal]);

  const calculation = useMemo(() => {
    return calculateNutritionNeeds(currentProfile);
  }, [currentProfile]);

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApply(calculation.dailyCalorieTarget, calculation.dailyWaterTargetMl, currentProfile);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrapper}>
                <Ionicons name="calculator-outline" size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Calculateur Métabolique</Text>
                <Text style={styles.headerSubtitle}>Formule scientifique Mifflin-St Jeor</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* 1. Sexe */}
            <Text style={styles.fieldLabel}>Sexe biologique</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
                onPress={() => setGender('male')}
                activeOpacity={0.7}
              >
                <Ionicons name="man" size={20} color={gender === 'male' ? '#10B981' : '#64748B'} />
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Homme</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                onPress={() => setGender('female')}
                activeOpacity={0.7}
              >
                <Ionicons name="woman" size={20} color={gender === 'female' ? '#10B981' : '#64748B'} />
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Femme</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Mensurations : Âge, Poids, Taille */}
            <View style={styles.inputsRow}>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Âge (ans)</Text>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                  placeholder="30"
                  placeholderTextColor="#64748B"
                  maxLength={3}
                />
              </View>

              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Poids (kg)</Text>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholder="70"
                  placeholderTextColor="#64748B"
                  maxLength={5}
                />
              </View>

              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Taille (cm)</Text>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="175"
                  placeholderTextColor="#64748B"
                  maxLength={3}
                />
              </View>
            </View>

            {/* 3. Niveau d'activité */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Niveau d'activité physique</Text>
            <View style={styles.optionsList}>
              {ACTIVITY_OPTIONS.map((item) => {
                const isSelected = activityLevel === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.optionCard, isSelected && styles.optionCardActive]}
                    onPress={() => setActivityLevel(item.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={22}
                      color={isSelected ? '#10B981' : '#64748B'}
                    />
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.optionDesc}>{item.desc}</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Objectif Nutritionnel */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Objectif principal</Text>
            <View style={styles.optionsList}>
              {GOAL_OPTIONS.map((item) => {
                const isSelected = goal === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionCard,
                      isSelected && { borderColor: item.color, backgroundColor: `${item.color}15` },
                    ]}
                    onPress={() => setGoal(item.id)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={item.icon as any}
                      size={20}
                      color={isSelected ? item.color : '#64748B'}
                    />
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionLabel, isSelected && { color: item.color }]}>
                        {item.label}
                      </Text>
                      <Text style={styles.optionDesc}>{item.desc}</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && { borderColor: item.color }]}>
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: item.color }]} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Résumé Live du Calcul */}
            <View style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <Ionicons name="sparkles" size={16} color="#F59E0B" />
                <Text style={styles.resultsTitle}>Résultats de votre analyse</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statMiniBox}>
                  <Text style={styles.statMiniLabel}>Métabolisme (BMR)</Text>
                  <Text style={styles.statMiniValue}>{calculation.bmr} kcal</Text>
                </View>
                <View style={styles.statMiniBox}>
                  <Text style={styles.statMiniLabel}>Dépense (TDEE)</Text>
                  <Text style={styles.statMiniValue}>{calculation.tdee} kcal</Text>
                </View>
                <View style={styles.statMiniBox}>
                  <Text style={styles.statMiniLabel}>Indice IMC</Text>
                  <Text style={styles.statMiniValue}>{calculation.bmi} <Text style={{ fontSize: 10, color: '#94A3B8' }}>({calculation.bmiCategory})</Text></Text>
                </View>
              </View>

              {/* Badges Principaux Recommandés */}
              <View style={styles.mainTargetContainer}>
                <View style={styles.targetBadgeCalories}>
                  <Text style={styles.targetLabel}>🎯 Objectif Quotidien Conseillé</Text>
                  <Text style={styles.targetCalorieNumber}>🔥 {calculation.dailyCalorieTarget} <Text style={styles.targetUnit}>kcal / jour</Text></Text>
                </View>

                <View style={styles.targetBadgeWater}>
                  <Text style={styles.waterLabel}>💧 Hydratation Recommandée</Text>
                  <Text style={styles.waterNumber}>{calculation.dailyWaterTargetMl} <Text style={styles.targetUnit}>ml / jour</Text></Text>
                </View>
              </View>
            </View>

            {/* Bouton Appliquer */}
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.8}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>Appliquer à mes objectifs</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '90%',
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  scrollBody: {
    paddingBottom: 25,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  genderBtnActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  genderTextActive: {
    color: '#10B981',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputCol: {
    flex: 1,
  },
  numericInput: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionsList: {
    gap: 8,
    marginBottom: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  optionCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  optionLabelActive: {
    color: '#10B981',
  },
  optionDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#10B981',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  resultsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statMiniBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statMiniLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statMiniValue: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '800',
    marginTop: 2,
  },
  mainTargetContainer: {
    gap: 8,
  },
  targetBadgeCalories: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  targetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  targetCalorieNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10B981',
    marginTop: 2,
  },
  targetBadgeWater: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  waterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BAE6FD',
  },
  waterNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  targetUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
