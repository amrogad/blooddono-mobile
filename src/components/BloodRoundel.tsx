import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';

type Variant = 'solid' | 'tint' | 'muted';

export function BloodRoundel({
  group,
  size = 46,
  variant = 'solid',
}: {
  group: string;
  size?: number;
  variant?: Variant;
}) {
  const { colors } = useTheme();
  const bg = variant === 'solid' ? colors.primary : variant === 'tint' ? colors.crimsonTint : colors.surface;
  const fg = variant === 'solid' ? colors.onPrimary : variant === 'tint' ? colors.primary : colors.textBody;
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: Math.round(size * 0.28), backgroundColor: bg },
      ]}
    >
      <Text style={[styles.text, { color: fg, fontSize: Math.round(size * 0.36) }]}>{group}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { fontFamily: fonts.displayBold, letterSpacing: -0.3 },
});
