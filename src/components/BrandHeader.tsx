import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fonts, type } from '@/constants/theme';

export function BrandHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <View style={styles.mark} />
        <Text style={styles.wordmark}>BloodDono</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 64,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  mark: { width: 22, height: 22, borderRadius: 7, backgroundColor: colors.primary },
  wordmark: { fontFamily: fonts.display, fontSize: 17, color: colors.ink, letterSpacing: -0.3 },
  title: { ...type.h1, color: colors.ink },
  subtitle: { ...type.small, color: colors.textMuted, marginTop: 3 },
});
