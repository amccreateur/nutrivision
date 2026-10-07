import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { getTranslation } from '../i18n';
import {
    fetchOfferings,
    purchasePackage,
    restorePurchases,
} from '../services/purchaseService';
import { AppLanguage } from '../types/nutrition';

interface Props {
  visible: boolean;
  language?: AppLanguage;
  onClose: () => void;
  onSuccess?: () => void;
}

interface DisplayPlan {
  id: string;
  title: string;
  priceString: string;
  periodString: string;
  badge?: string;
  pkg?: PurchasesPackage;
}

export const PaywallModal: React.FC<Props> = ({
  visible,
  language = 'fr',
  onClose,
  onSuccess,
}) => {
  const t = getTranslation(language);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('annual');
  const [isLoadingOffers, setIsLoadingOffers] = useState<boolean>(true);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      loadOffers();
    }
  }, [visible]);

  const loadOffers = async () => {
    setIsLoadingOffers(true);
    try {
      const offering = await fetchOfferings();
      if (offering && offering.availablePackages.length > 0) {
        setPackages(offering.availablePackages);
        // Sélectionner le package annuel ou le premier par défaut
        const annualPkg = offering.availablePackages.find(
          (p) => p.packageType === 'ANNUAL' || p.identifier.includes('year')
        );
        if (annualPkg) {
          setSelectedPlanId(annualPkg.identifier);
        } else {
          setSelectedPlanId(offering.availablePackages[0].identifier);
        }
      }
    } catch (e) {
      console.warn('Erreur chargement offres :', e);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const getDisplayPlans = (): DisplayPlan[] => {
    if (packages.length > 0) {
      return packages.map((pkg) => {
        let period = '';
        let badge: string | undefined;

        if (pkg.packageType === 'ANNUAL' || pkg.identifier.includes('year')) {
          period = t.paywall.perYear;
          badge = t.paywall.bestValue;
        } else if (pkg.packageType === 'MONTHLY' || pkg.identifier.includes('month')) {
          period = t.paywall.perMonth;
        } else if (pkg.packageType === 'LIFETIME' || pkg.identifier.includes('life')) {
          period = t.paywall.oneTime;
          badge = t.paywall.popular;
        }

        return {
          id: pkg.identifier,
          title: pkg.product.title || pkg.identifier,
          priceString: pkg.product.priceString,
          periodString: period,
          badge,
          pkg,
        };
      });
    }

    // Fallback visuel élégant pour le développement / démo
    return [
      {
        id: 'monthly',
        title: t.paywall.monthly,
        priceString: '1,99 €',
        periodString: t.paywall.perMonth,
      },
      {
        id: 'annual',
        title: t.paywall.yearly,
        priceString: '14,99 €',
        periodString: t.paywall.perYear,
        badge: t.paywall.bestValue,
      },
      {
        id: 'lifetime',
        title: t.paywall.lifetime,
        priceString: '29,99 €',
        periodString: t.paywall.oneTime,
        badge: t.paywall.popular,
      },
    ];
  };

  const handlePurchase = async () => {
    const plans = getDisplayPlans();
    const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

    try {
      setIsPurchasing(true);
      if (selectedPlan?.pkg) {
        const result = await purchasePackage(selectedPlan.pkg);
        if (result.success && result.isPro) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(t.paywall.successTitle, t.paywall.successDesc);
          if (onSuccess) onSuccess();
          onClose();
        } else if (result.error && !result.userCancelled) {
          Alert.alert('Erreur', result.error);
        }
      } else {
        // Mode Démo / Test si les stores ne sont pas encore reliés
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t.paywall.successTitle, t.paywall.successDesc);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Achat impossible');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      const result = await restorePurchases();
      if (result.isPro) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t.paywall.successTitle, t.paywall.restoreSuccess);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        Alert.alert('NutriVision Pro', t.paywall.noActiveSub);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Erreur de restauration.');
    } finally {
      setIsRestoring(false);
    }
  };

  const plans = getDisplayPlans();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.badgeContainer}>
              <Ionicons name="sparkles" size={14} color="#F59E0B" />
              <Text style={styles.badgeText}>{t.paywall.badge}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Title & Subtitle */}
            <Text style={styles.title}>{t.paywall.title}</Text>
            <Text style={styles.subtitle}>{t.paywall.subtitle}</Text>

            {/* Feature List */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Feather name="slash" size={18} color="#10B981" />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{t.paywall.featureZeroAdsTitle}</Text>
                  <Text style={styles.featureDesc}>{t.paywall.featureZeroAdsDesc}</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <MaterialCommunityIcons name="fridge-outline" size={20} color="#38BDF8" />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{t.paywall.featureRecipesTitle}</Text>
                  <Text style={styles.featureDesc}>{t.paywall.featureRecipesDesc}</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="document-text-outline" size={18} color="#F59E0B" />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{t.paywall.featurePdfTitle}</Text>
                  <Text style={styles.featureDesc}>{t.paywall.featurePdfDesc}</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                  <Ionicons name="flash-outline" size={18} color="#A78BFA" />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{t.paywall.featureAiVisionTitle}</Text>
                  <Text style={styles.featureDesc}>{t.paywall.featureAiVisionDesc}</Text>
                </View>
              </View>
            </View>

            {/* Plans Selection Cards */}
            {isLoadingOffers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text style={styles.loadingText}>{t.paywall.loadingOffers}</Text>
              </View>
            ) : (
              <View style={styles.plansContainer}>
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[styles.planCard, isSelected && styles.planCardSelected]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPlanId(plan.id);
                      }}
                      activeOpacity={0.85}
                    >
                      {plan.badge && (
                        <View style={styles.planBadge}>
                          <Text style={styles.planBadgeText}>{plan.badge}</Text>
                        </View>
                      )}

                      <View style={styles.planRadioRow}>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.planTitle, isSelected && styles.planTitleSelected]}>
                            {plan.title}
                          </Text>
                          <Text style={styles.planPeriod}>{plan.periodString}</Text>
                        </View>
                        <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                          {plan.priceString}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handlePurchase}
              disabled={isPurchasing}
              activeOpacity={0.88}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#0F172A" />
                  <Text style={styles.ctaButtonText}>{t.paywall.cta}</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.cancelText}>{t.paywall.cancelAnytime}</Text>

            {/* Restore Button */}
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={handleRestore}
              disabled={isRestoring}
              activeOpacity={0.7}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#94A3B8" />
              ) : (
                <Text style={styles.restoreBtnText}>{t.paywall.restoreBtn}</Text>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 19,
  },
  featuresContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    gap: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  featureDesc: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  plansContainer: {
    gap: 10,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  planBadge: {
    position: 'absolute',
    top: -9,
    right: 14,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgeText: {
    color: '#0F172A',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  planRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#F59E0B',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  planTitleSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  planPeriod: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  planPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  planPriceSelected: {
    color: '#F59E0B',
  },
  ctaButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 11,
    marginTop: 10,
  },
  restoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  restoreBtnText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

