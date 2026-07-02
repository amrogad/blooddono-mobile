import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fonts } from '../constants/theme';

export function GradientHeader({
  title,
  subtitle,
  style,
}: {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.wrap, style]}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg + 4 },
  title: { color: colors.white, fontFamily: fonts.bold, fontSize: 22 },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
});
