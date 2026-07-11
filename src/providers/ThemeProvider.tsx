import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { lightColors, darkColors, type ThemeColors } from '@/constants/theme';

type Scheme = 'light' | 'dark';

type ThemeContextValue = {
  scheme: Scheme;
  colors: ThemeColors;
  setScheme: (s: Scheme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'color-scheme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [scheme, setSchemeState] = useState<Scheme>(system === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark') setSchemeState(v);
    });
  }, []);

  const setScheme = useCallback((s: Scheme) => {
    setSchemeState(s);
    AsyncStorage.setItem(STORAGE_KEY, s).catch(() => {});
  }, []);

  const toggle = useCallback(() => setScheme(scheme === 'dark' ? 'light' : 'dark'), [scheme, setScheme]);

  const colors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ scheme, colors, setScheme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

// Build themed StyleSheet from the live palette and return it alongside colors.
export function useThemedStyles<T>(factory: (c: ThemeColors) => T) {
  const { colors } = useTheme();
  const styles = useMemo(() => factory(colors), [colors, factory]);
  return { colors, styles };
}
