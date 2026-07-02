import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, type, radius, fonts } from '../../../constants/theme';

export default function Assistant() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Coming soon</Text>
      </View>
      <Text style={styles.title}>Eligibility assistant</Text>
      <Text style={styles.body}>
        Ask questions like &quot;I got a tattoo two weeks ago, can I donate?&quot; and get
        instant guidance on eligibility, prep and aftercare.
      </Text>
      <Text style={styles.disclaimer}>
        Informational only, not medical advice. Always confirm with the blood bank.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  badge: {
    backgroundColor: '#FDECEC',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12 },
  title: { ...type.h1, color: colors.text, textAlign: 'center' },
  body: { ...type.body, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },
  disclaimer: { ...type.small, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
});
