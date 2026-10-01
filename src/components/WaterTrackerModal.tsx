import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentWaterMl: number;
  targetWaterMl: number;
  onAddWater: (amountMl: number) => void;
  onResetWater: () => void;
}

export const WaterTrackerModal: React.FC<Props> = ({
  visible,
  onClose,
  currentWaterMl,
  targetWaterMl,
  onAddWater,
  onResetWater,
}) => {
  const percentage = Math.min(100, Math.round((currentWaterMl / Math.max(1, targetWaterMl)) * 100));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="water" size={24} color="#0EA5E9" />
              <Text style={styles.title}>Suivi d'Hydratation</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Jauge centrale d'eau */}
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeCircle}>
              <Text style={styles.gaugeAmount}>{currentWaterMl}</Text>
              <Text style={styles.gaugeTarget}>/ {targetWaterMl} ml</Text>
              <Text style={styles.gaugePercentage}>{percentage}% de l'objectif</Text>
            </View>
          </View>

          {/* Boutons d'ajout rapide */}
          <Text style={styles.sectionTitle}>Ajout rapide</Text>
          <View style={styles.quickAddRow}>
            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => onAddWater(150)}
              activeOpacity={0.7}
            >
              <Ionicons name="water-outline" size={20} color="#0EA5E9" />
              <Text style={styles.quickAddText}>+150 ml</Text>
              <Text style={styles.quickAddSub}>Petit verre</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => onAddWater(250)}
              activeOpacity={0.7}
            >
              <Ionicons name="water" size={22} color="#0EA5E9" />
              <Text style={styles.quickAddText}>+250 ml</Text>
              <Text style={styles.quickAddSub}>Grand verre</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => onAddWater(500)}
              activeOpacity={0.7}
            >
              <Ionicons name="water" size={22} color="#0EA5E9" />
              <Text style={styles.quickAddText}>+500 ml</Text>
              <Text style={styles.quickAddSub}>Gourde</Text>
            </TouchableOpacity>
          </View>

          {/* Pied de page avec réinitialisation */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onResetWater} style={styles.resetBtn}>
              <Ionicons name="refresh-outline" size={16} color="#EF4444" />
              <Text style={styles.resetText}>Remettre à zéro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#131B2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 20,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  gaugeCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: '#0EA5E9',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#38BDF8',
  },
  gaugeTarget: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  gaugePercentage: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 6,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 10,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAddBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  quickAddText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginTop: 6,
  },
  quickAddSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  footerRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  resetText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});

