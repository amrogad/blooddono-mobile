import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors, fonts } from '../constants/theme';

export function Logo({ size = 32, style }: { size?: number; style?: TextStyle }) {
  return (
    <Text style={[{ fontSize: size }, styles.base, style]}>
      Blood<Text style={styles.accent}>Dono</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { fontFamily: fonts.extrabold, color: colors.text, letterSpacing: -0.5 },
  accent: { color: colors.accent },
});
