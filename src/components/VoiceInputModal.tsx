import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getTranslation } from '../i18n';
import { analyzeFoodAudio, analyzeFoodDescription } from '../services/aiVision';
import { AppLanguage, FoodItemAnalysis, UserPreferences } from '../types/nutrition';

interface Props {
  visible: boolean;
  language?: AppLanguage;
  preferences?: UserPreferences;
  onClose: () => void;
  onSuccess: (food: FoodItemAnalysis) => void;
}

export const VoiceInputModal: React.FC<Props> = ({
  visible,
  language = 'fr',
  preferences,
  onClose,
  onSuccess,
}) => {
  const t = getTranslation(language);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  // Animation pulsation microphone pendant l'enregistrement
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (recorderState.isRecording) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();

      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      loop?.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recorderState.isRecording]);

  // Réinitialiser à l'ouverture
  useEffect(() => {
    if (visible) {
      setTextInput('');
      setIsProcessing(false);
      setRecordDuration(0);
    } else {
      if (recorderState.isRecording) {
        audioRecorder.stop().catch(() => {});
      }
    }
  }, [visible]);

  const toggleRecording = async () => {
    if (isProcessing) return;

    if (recorderState.isRecording) {
      // Arrêt de l'enregistrement et analyse
      try {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        if (recordDuration < 1) {
          await audioRecorder.stop();
          Alert.alert(t.voiceInput.modalTitle, t.voiceInput.tooShortError);
          return;
        }

        setIsProcessing(true);
        await audioRecorder.stop();
        const uri = audioRecorder.uri;

        if (!uri) {
          throw new Error('Fichier audio introuvable.');
        }

        // Lecture du fichier en base64
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Envoi à Gemini Vision Multimodal
        const result = await analyzeFoodAudio(
          base64Audio,
          'audio/m4a',
          preferences?.apiKey,
          preferences
        );

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        onClose();
        onSuccess(result);
      } catch (err: any) {
        Alert.alert(
          language === 'en' ? 'Voice Analysis Error' : 'Erreur d’analyse vocale',
          err?.message || (language === 'en' ? 'Could not analyze voice recording.' : 'Impossible d’analyser votre enregistrement vocal.')
        );
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Démarrage de l'enregistrement
      try {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(t.voiceInput.permissionDeniedTitle, t.voiceInput.permissionDeniedDesc);
          return;
        }

        await AudioModule.setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });

        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
      } catch (err: any) {
        Alert.alert(
          language === 'en' ? 'Microphone Error' : 'Erreur Microphone',
          err?.message || (language === 'en' ? 'Could not start recording.' : 'Impossible de démarrer l’enregistrement.')
        );
      }
    }
  };

  const handleAnalyzeText = async (textToAnalyze?: string) => {
    const query = (textToAnalyze || textInput).trim();
    if (!query || isProcessing) return;

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setIsProcessing(true);

      const result = await analyzeFoodDescription(
        query,
        preferences?.apiKey,
        preferences
      );

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      onClose();
      onSuccess(result);
    } catch (err: any) {
      Alert.alert(
        language === 'en' ? 'Analysis Error' : 'Erreur d’analyse',
        err?.message || (language === 'en' ? 'Could not analyze text description.' : 'Impossible d’analyser cette description.')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.sheetContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mic" size={20} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.title}>{t.voiceInput.modalTitle}</Text>
                  <Text style={styles.subtitle}>{t.voiceInput.modalSubtitle}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                disabled={isProcessing}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Grand Bouton Microphone Central Interactif */}
              <View style={styles.micSection}>
                <View style={styles.micWrapper}>
                  {recorderState.isRecording && (
                    <Animated.View
                      style={[
                        styles.pulseRing,
                        {
                          transform: [{ scale: pulseAnim }],
                          opacity: pulseAnim.interpolate({
                            inputRange: [1, 1.25],
                            outputRange: [0.6, 0],
                          }),
                        },
                      ]}
                    />
                  )}

                  <TouchableOpacity
                    style={[
                      styles.micBigButton,
                      recorderState.isRecording && styles.micBigButtonRecording,
                      isProcessing && styles.micBigButtonDisabled,
                    ]}
                    onPress={toggleRecording}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="large" color="#FFFFFF" />
                    ) : (
                      <Ionicons
                        name={recorderState.isRecording ? 'stop' : 'mic'}
                        size={40}
                        color="#FFFFFF"
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Statut & Durée */}
                <Text
                  style={[
                    styles.statusText,
                    recorderState.isRecording && styles.statusTextRecording,
                  ]}
                >
                  {isProcessing
                    ? t.voiceInput.analyzingVoice
                    : recorderState.isRecording
                    ? t.voiceInput.recording.replace('{seconds}', recordDuration.toString())
                    : t.voiceInput.tapToRecord}
                </Text>

                {recorderState.isRecording && (
                  <Text style={styles.tapToStopHint}>{t.voiceInput.tapToStop}</Text>
                )}
              </View>

              {/* Séparateur */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{language === 'en' ? 'OR' : 'OU'}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Saisie ou dictée clavier alternative */}
              <Text style={styles.inputLabel}>{t.voiceInput.orTypeText}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.voiceInput.inputPlaceholder}
                  placeholderTextColor="#64748B"
                  value={textInput}
                  onChangeText={setTextInput}
                  multiline
                  numberOfLines={2}
                  editable={!isProcessing && !recorderState.isRecording}
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!textInput.trim() || isProcessing) && styles.sendBtnDisabled,
                  ]}
                  onPress={() => handleAnalyzeText()}
                  disabled={!textInput.trim() || isProcessing}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Exemples rapides */}
              <Text style={styles.examplesLabel}>{t.voiceInput.examplesTitle}</Text>
              <View style={styles.examplesContainer}>
                {[t.voiceInput.ex1, t.voiceInput.ex2, t.voiceInput.ex3].map((ex, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.exampleChip}
                    onPress={() => {
                      setTextInput(ex);
                      handleAnalyzeText(ex);
                    }}
                    disabled={isProcessing}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={13} color="#10B981" />
                    <Text style={styles.exampleChipText}>{ex}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  micSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  micWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
  micBigButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  micBigButtonRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micBigButtonDisabled: {
    opacity: 0.7,
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  statusTextRecording: {
    color: '#EF4444',
  },
  tapToStopHint: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 46,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  examplesLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  examplesContainer: {
    gap: 6,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  exampleChipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
