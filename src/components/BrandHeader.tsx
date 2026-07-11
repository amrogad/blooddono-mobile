import { View, Text, StyleSheet, Image } from 'react-native';
import { spacing, fonts, type } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';
import brandMark from '@/assets/images/brand-mark.png';

export function BrandHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { styles } = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <Image source={brandMark} style={styles.mark} />
        <Text style={styles.wordmark}>BloodDono</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      paddingTop: 64,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.background,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: spacing.md },
    mark: { width: 30, height: 30, borderRadius: 9 },
    wordmark: { fontFamily: fonts.display, fontSize: 19, color: colors.ink, letterSpacing: -0.3 },
    title: { ...type.h1, color: colors.ink },
    subtitle: { ...type.small, color: colors.textMuted, marginTop: 3 },
  });
