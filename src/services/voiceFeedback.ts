import * as Speech from 'expo-speech';
import { FoodItemAnalysis } from '../types/nutrition';

export async function speakDishResult(analysis: FoodItemAnalysis): Promise<void> {
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }

    const gradeText = analysis.nutriScore.grade;
    const textToSpeak = `${analysis.name}. ${analysis.macros.calories} calories. Nutri-Score ${gradeText}.`;

    Speech.speak(textToSpeak, {
      language: 'fr-FR',
      pitch: 1.0,
      rate: 1.05,
    });
  } catch (error) {
    console.warn('Synthèse vocale indisponible :', error);
  }
}

export async function stopSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {}
}

