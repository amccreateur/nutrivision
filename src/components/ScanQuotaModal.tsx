import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { getTranslation } from '../i18n';
import { showRewardedAdWithCallback } from '../services/adsService';
import { addBonusScans, DAILY_FREE_SCANS, ScanQuota } from '../services/quotaService';
import { AppLanguage } from '../types/nutrition';

interface Props {
  visible: boolean;
  quota: ScanQuota;
  language?: AppLanguage;
  onClose: () => void;
  onOpenPaywall: () => void;
  onQuotaUpdated: (newQuota: ScanQuota) => void;
}

export const ScanQuotaModal: React.FC<Props> = ({
  visible,
  quota,
  language = 'fr',
  onClose,
  onOpenPaywall,
  onQuotaUpdated,
}) => {
  const t = getTranslation(language);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const handleWatchVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsWatchingAd(true);

    showRewardedAdWithCallback(
      async () => {
        setIsWatchingAd(false);
        const updated = await addBonusScans(2);
        onQuotaUpdated(updated);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          t.quotaModal.bonusSuccessTitle,
          t.quotaModal.bonusSuccessDesc
        );
        onClose();
      },
      false
    );

    // Sécurité au cas où la pub ne se ferme pas / timeout
    setTimeout(() => {
      setIsWatchingAd(false);
    }, 15000);
  };

  const handleProPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onOpenPaywall();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>

              {/* Glowing Icon Header */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="lightning-bolt" size={32} color="#F59E0B" />
                </View>
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.title}>{t.quotaModal.title}</Text>
              <Text style={styles.subtitle}>
                {t.quotaModal.subtitle.replace('{count}', (quota.totalAvailable || DAILY_FREE_SCANS).toString())}
              </Text>

              {/* Quota Usage Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, (quota.usedToday / quota.totalAvailable) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {quota.usedToday} / {quota.totalAvailable} scans utilisés
                </Text>
              </View>

              {/* Action 1 : Option Pro (Gold) */}
              <TouchableOpacity
                style={styles.proButton}
                onPress={handleProPress}
                activeOpacity={0.85}
              >
                <View style={styles.proButtonContent}>
                  <Ionicons name="sparkles" size={20} color="#0F172A" />
                  <View style={styles.proTextCol}>
                    <Text style={styles.proButtonTitle}>{t.quotaModal.proOfferBtn}</Text>
                    <Text style={styles.proButtonSubtitle}>{t.quotaModal.proOfferDesc}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Action 2 : Regarder une vidéo (Rewarded Video) */}
              <TouchableOpacity
                style={styles.videoButton}
                onPress={handleWatchVideo}
                disabled={isWatchingAd}
                activeOpacity={0.8}
              >
                {isWatchingAd ? (
                  <View style={styles.videoLoadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.videoButtonText}>{t.quotaModal.videoLoading}</Text>
                  </View>
                ) : (
                  <View style={styles.videoButtonContent}>
                    <Ionicons name="play-circle" size={22} color="#38BDF8" />
                    <View style={styles.videoTextCol}>
                      <Text style={styles.videoButtonText}>{t.quotaModal.videoOfferBtn}</Text>
                      <Text style={styles.videoButtonSubtext}>{t.quotaModal.videoOfferDesc}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Barcode Free Reminder */}
              <TouchableOpacity
                style={styles.barcodeHintContainer}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.barcodeHintText}>{t.quotaModal.barcodeHint}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 14,
    marginTop: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  progressText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  proButton: {
    width: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  proButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proTextCol: {
    flex: 1,
  },
  proButtonTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  proButtonSubtitle: {
    color: '#451A03',
    fontSize: 11,
    fontWeight: '600',
  },
  videoButton: {
    width: '100%',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  videoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  videoTextCol: {
    flex: 1,
  },
  videoButtonText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  videoButtonSubtext: {
    color: '#7DD3FC',
    fontSize: 11,
    fontWeight: '500',
  },
  barcodeHintContainer: {
    paddingVertical: 4,
  },
  barcodeHintText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

