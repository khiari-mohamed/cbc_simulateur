import { useLanguage } from '../contexts/LanguageContext';

export const useTranslation = () => {
  const { t, language, setLanguage, dir } = useLanguage();
  return { t, language, setLanguage, dir };
};
