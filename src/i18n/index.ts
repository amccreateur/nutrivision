import { AppLanguage } from '../types/nutrition';
import { TRANSLATIONS } from './translations';

export const getTranslation = (lang: AppLanguage = 'fr') => {
  return TRANSLATIONS[lang] || TRANSLATIONS.fr;
};

export { TRANSLATIONS };

