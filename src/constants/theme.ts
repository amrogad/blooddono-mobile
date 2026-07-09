export const colors = {
  // Crimson — the one accent. Blood, primary action, critical urgency.
  primary: '#C21E3F',
  primaryDeep: '#8F1230',
  primaryLight: '#E7476A',
  accent: '#C21E3F',
  accentHover: '#8F1230',
  crimsonTint: '#FBEDF0',

  // Warm neutrals — never clinical white.
  ink: '#211D1E',
  black: '#211D1E',
  white: '#ffffff',
  text: '#211D1E',
  textBody: '#57504E',
  textMuted: '#8A8184',
  background: '#FAF7F3',
  surface: '#F5F1EC',
  border: 'rgba(33,20,22,0.09)',
  borderStrong: 'rgba(33,20,22,0.14)',

  // Semantic — status/urgency only, never decoration.
  success: '#1E7F5C',
  successTint: '#E8F4EE',
  warning: '#8F5A08',
  warningTint: '#FBF1DD',
  info: '#2456D6',
  infoTint: '#E9EFFC',
  error: '#C21E3F',
};

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

export const fonts = {
  // Instrument Sans — the workhorse.
  regular: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semibold: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
  extrabold: 'InstrumentSans_700Bold',
  // Bricolage Grotesque — the voice: headings and blood-type letters.
  display: 'BricolageGrotesque_600SemiBold',
  displayBold: 'BricolageGrotesque_700Bold',
};

export const shadow = {
  card: {
    shadowColor: '#211416',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  floating: {
    shadowColor: '#211416',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 8,
  },
  crimson: {
    shadowColor: '#9C0E2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
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
