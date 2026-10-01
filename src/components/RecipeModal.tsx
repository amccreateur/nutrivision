import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { GeneratedRecipe } from '../types/nutrition';

interface Props {
  visible: boolean;
  recipe: GeneratedRecipe | null;
  onClose: () => void;
}

export const RecipeModal: React.FC<Props> = ({ visible, recipe, onClose }) => {
  if (!recipe) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="restaurant" size={24} color="#10B981" />
              <Text style={styles.headerTitle}>Recette Anti-Gaspillage</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Nom de la recette */}
            <Text style={styles.recipeTitle}>{recipe.title}</Text>

            {/* Badges d'informations rapides */}
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Ionicons name="time-outline" size={16} color="#38BDF8" />
                <Text style={styles.metaText}>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</Text>
              </View>

              <View style={styles.metaBadge}>
                <Ionicons name="people-outline" size={16} color="#A78BFA" />
                <Text style={styles.metaText}>{recipe.servings} pers.</Text>
              </View>

              <View style={styles.metaBadge}>
                <Ionicons name="flame-outline" size={16} color="#F59E0B" />
                <Text style={styles.metaText}>{recipe.estimatedCaloriesPerServing} kcal</Text>
              </View>

              <View style={[styles.metaBadge, { backgroundColor: '#038141' }]}>
                <Text style={[styles.metaText, { color: '#FFFFFF', fontWeight: '900' }]}>
                  Score {recipe.estimatedNutriScore}
                </Text>
              </View>
            </View>

            {/* Ingrédients du frigo utilisés */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🥦 Ingrédients trouvés dans votre frigo</Text>
              <View style={styles.tagsContainer}>
                {recipe.ingredientsUsed.map((ing, idx) => (
                  <View key={idx} style={styles.ingTag}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.ingText}>{ing}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Suggestions de placard */}
            {recipe.missingPantrySuggestions && recipe.missingPantrySuggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧂 Assaisonnements de base suggérés</Text>
                <Text style={styles.pantryText}>
                  {recipe.missingPantrySuggestions.join(', ')}
                </Text>
              </View>
            )}

            {/* Étapes de préparation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👩‍🍳 Étapes de préparation</Text>
              {recipe.steps.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumber}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Astuce du Chef */}
            {recipe.chefTip ? (
              <View style={styles.chefTipCard}>
                <View style={styles.chefTipHeader}>
                  <Ionicons name="bulb" size={18} color="#F59E0B" />
                  <Text style={styles.chefTipTitle}>Astuce Santé du Chef</Text>
                </View>
                <Text style={styles.chefTipText}>{recipe.chefTip}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#131B2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metaText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  ingText: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '600',
  },
  pantryText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },
  chefTipCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginTop: 8,
  },
  chefTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  chefTipTitle: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 13,
  },
  chefTipText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
});

