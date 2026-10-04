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
import { getTranslation } from '../i18n';
import { AppLanguage } from '../types/nutrition';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentWaterMl: number;
  targetWaterMl: number;
  language?: AppLanguage;
  onAddWater: (amountMl: number) => void;
  onResetWater: () => void;
}

export const WaterTrackerModal: React.FC<Props> = ({
  visible,
  onClose,
  currentWaterMl,
  targetWaterMl,
  language = 'fr',
  onAddWater,
  onResetWater,
}) => {
  const t = getTranslation(language);
  const percentage = Math.min(100, Math.round((currentWaterMl / Math.max(1, targetWaterMl)) * 100));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="water" size={24} color="#0EA5E9" />
              <Text style={styles.title}>{t.waterModal.title}</Text>
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
              <Text style={styles.gaugePercentage}>
                {percentage}% {language === 'en' ? 'of daily goal' : 'de l\'objectif'}
              </Text>
            </View>
          </View>

          {/* Boutons d'ajout rapide */}
          <Text style={styles.sectionTitle}>{t.waterModal.quickAddTitle}</Text>
          <View style={styles.quickAddRow}>
            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => onAddWater(150)}
              activeOpacity={0.7}
            >
              <Ionicons name="water-outline" size={20} color="#0EA5E9" />
              <Text style={styles.quickAddText}>+150 ml</Text>
              <Text style={styles.quickAddSub}>{t.waterModal.glass}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => onAddWater(250)}
              activeOpacity={0.7}
            >
              <Ionicons name="water" size={22} color="#0EA5E9" />
              <Text style={styles.quickAddText}>+250 ml</Text>
              <Text style={styles.quickAddSub}>{t.waterModal.mug}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => onAddWater(500)}
              activeOpacity={0.7}
            >
              <Ionicons name="water" size={22} color="#0EA5E9" />
              <Text style={styles.quickAddText}>+500 ml</Text>
              <Text style={styles.quickAddSub}>{t.waterModal.bottle}</Text>
            </TouchableOpacity>
          </View>

          {/* Pied de page avec réinitialisation */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onResetWater} style={styles.resetBtn}>
              <Ionicons name="refresh-outline" size={16} color="#EF4444" />
              <Text style={styles.resetText}>{t.waterModal.resetBtn}</Text>
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
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  gaugeCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    borderColor: '#0EA5E9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  gaugeAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  gaugeTarget: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  gaugePercentage: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 12,
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAddBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  quickAddSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  footerRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resetText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});

