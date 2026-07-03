import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fonts, type } from '../constants/theme';

export function BrandHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <LinearGradient
      colors={[colors.primaryDeep, colors.primary, colors.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      <View style={styles.drop} />
      <Text style={styles.wordmark}>
        Blood<Text style={styles.accent}>Dono</Text>
      </Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 64,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  drop: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  wordmark: { fontFamily: fonts.extrabold, fontSize: 18, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.4 },
  accent: { color: '#FFD9D2' },
  title: { ...type.h1, color: colors.white, marginTop: spacing.sm },
  subtitle: { fontFamily: fonts.script, fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
});
