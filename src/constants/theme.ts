import { I18nManager } from 'react-native';

export const lightColors = {
  // Crimson — the one accent. Blood, primary action, critical urgency.
  primary: '#C21E3F',
  primaryDeep: '#8F1230',
  primaryLight: '#E7476A',
  accent: '#C21E3F',
  accentHover: '#8F1230',
  crimsonTint: '#FBEDF0',

  // Warm neutrals.
  ink: '#211D1E',
  black: '#211D1E',
  white: '#ffffff',
  card: '#ffffff',
  text: '#211D1E',
  textBody: '#57504E',
  textMuted: '#8A8184',
  background: '#FAF7F3',
  surface: '#F5F1EC',
  border: 'rgba(33,20,22,0.09)',
  borderStrong: 'rgba(33,20,22,0.14)',

  // Text that sits on top of a filled surface.
  onPrimary: '#ffffff',
  onInk: '#FFF8F4',

  // Semantic — status/urgency only.
  success: '#1E7F5C',
  successTint: '#E8F4EE',
  warning: '#8F5A08',
  warningTint: '#FBF1DD',
  info: '#2456D6',
  infoTint: '#E9EFFC',
  error: '#C21E3F',
};

export type ThemeColors = typeof lightColors;

export const darkColors: ThemeColors = {
  // Crimson lifted slightly for contrast on dark surfaces.
  primary: '#E0344F',
  primaryDeep: '#B81F3B',
  primaryLight: '#F26B83',
  accent: '#E0344F',
  accentHover: '#F26B83',
  crimsonTint: '#3A2028',

  // Warm dark neutrals — not cold gray.
  ink: '#F4EEE9',
  black: '#F4EEE9',
  white: '#211B1D',
  card: '#211B1D',
  text: '#F4EEE9',
  textBody: '#C4BAB6',
  textMuted: '#9A8E8A',
  background: '#161113',
  surface: '#2A2325',
  border: 'rgba(255,248,244,0.10)',
  borderStrong: 'rgba(255,248,244,0.20)',

  onPrimary: '#ffffff',
  onInk: '#171214',

  success: '#57C79B',
  successTint: '#16362B',
  warning: '#E0A94A',
  warningTint: '#372C14',
  info: '#7AA0F5',
  infoTint: '#1E2C4C',
  error: '#E0344F',
};

// Default palette. Screens read the live palette from useTheme(); this static
// export is the light fallback used by theme presets below.
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 12,
  control: 11,
  card: 16,
  lg: 18,
  xl: 24,
  pill: 999,
};

// Arabic (RTL) ships Cairo for everything; Latin locales keep the Instrument +
// Bricolage pairing. isRTL is set natively before JS boots and persists across
// restarts, so this resolves once, correctly, for the whole session.
export const fonts = I18nManager.isRTL
  ? {
      regular: 'Cairo_400Regular',
      medium: 'Cairo_500Medium',
      semibold: 'Cairo_600SemiBold',
      bold: 'Cairo_700Bold',
      extrabold: 'Cairo_800ExtraBold',
      display: 'Cairo_700Bold',
      displayBold: 'Cairo_800ExtraBold',
    }
  : {
      regular: 'InstrumentSans_400Regular',
      medium: 'InstrumentSans_500Medium',
      semibold: 'InstrumentSans_600SemiBold',
      bold: 'InstrumentSans_700Bold',
      extrabold: 'InstrumentSans_700Bold',
      display: 'BricolageGrotesque_600SemiBold',
      displayBold: 'BricolageGrotesque_700Bold',
    };

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 8,
  },
};

export const type = {
  display: { fontFamily: fonts.displayBold, fontSize: 30, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.display, fontSize: 25, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.display, fontSize: 22, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.semibold, fontSize: 18 },
  title: { fontFamily: fonts.semibold, fontSize: 16 },
  body: { fontFamily: fonts.regular, fontSize: 15 },
  bodyBold: { fontFamily: fonts.semibold, fontSize: 15 },
  small: { fontFamily: fonts.regular, fontSize: 13 },
  label: { fontFamily: fonts.semibold, fontSize: 11.5, letterSpacing: 1 },
};
