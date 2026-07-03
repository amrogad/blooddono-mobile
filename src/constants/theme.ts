export const colors = {
  primary: '#8B0000',
  primaryDeep: '#6B0000',
  primaryLight: '#C41230',
  accent: '#ff4136',
  accentHover: '#d63027',
  black: '#1B1416',
  ink: '#201A1B',
  white: '#ffffff',
  text: '#201A1B',
  textMuted: '#8A7C79',
  background: '#FBF7F5',
  surface: '#F4ECE9',
  border: '#EBE1DD',
  error: '#dc2626',
  success: '#16a34a',
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
  lg: 18,
  xl: 24,
  pill: 999,
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  script: 'PlaywriteAUSA_400Regular',
};

export const shadow = {
  card: {
    shadowColor: '#3A0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  floating: {
    shadowColor: '#3A0000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 34, letterSpacing: -1 },
  h1: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -0.6 },
  h2: { fontFamily: fonts.bold, fontSize: 22, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.semibold, fontSize: 18 },
  body: { fontFamily: fonts.regular, fontSize: 15 },
  bodyBold: { fontFamily: fonts.semibold, fontSize: 15 },
  small: { fontFamily: fonts.regular, fontSize: 13 },
  label: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.8 },
};
