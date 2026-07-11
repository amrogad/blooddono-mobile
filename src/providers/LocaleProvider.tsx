import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { I18nManager, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n, { type Locale } from '@/i18n';

type LocaleContextValue = {
  locale: Locale;
  isRTL: boolean;
  setLocale: (l: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);
const STORAGE_KEY = 'app-locale';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(i18n.language === 'ar' ? 'ar' : 'en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(async (stored) => {
      const next: Locale = stored === 'ar' ? 'ar' : 'en';
      if (next !== i18n.language) await i18n.changeLanguage(next);
      setLocaleState(next);
      setReady(true);
    });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    i18n.changeLanguage(next);
    setLocaleState(next);
    const shouldRTL = next === 'ar';
    if (I18nManager.isRTL !== shouldRTL) {
      I18nManager.allowRTL(shouldRTL);
      I18nManager.forceRTL(shouldRTL);
      Alert.alert(
        i18n.t('common.restartTitle', { lng: next }),
        i18n.t('common.restartBody', { lng: next }),
      );
    }
  }, []);

  if (!ready) return null;

  return (
    <LocaleContext.Provider value={{ locale, isRTL: I18nManager.isRTL, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
