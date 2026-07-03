import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../../providers/AuthProvider';
import { DEMO_ACCOUNTS } from '../../../constants/demoAccounts';
import { colors, spacing, radius, fonts, type, shadow } from '../../../constants/theme';
import { isEmail, friendlyAuthError } from '../../../utils/errors';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async (e: string, p: string, skipValidate = false) => {
    setError(null);
    if (!skipValidate) {
      if (!isEmail(e)) return setError('Please enter a valid email.');
      if (p.length < 6) return setError('Password must be at least 6 characters.');
    }
    setSubmitting(true);
    try {
      await signIn(e, p);
    } catch (err) {
      setError(friendlyAuthError((err as Error).message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient
        colors={[colors.primaryDeep, colors.primary, colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.drop} />
        <Text style={styles.wordmark}>
          Blood<Text style={styles.wordmarkAccent}>Dono</Text>
        </Text>
        <Text style={styles.tagline}>Every drop counts</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome back</Text>
        <Text style={styles.cardSubtitle}>Sign in to keep saving lives</Text>

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#B8ADA9"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#B8ADA9"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { opacity: 0.9 },
            submitting && { opacity: 0.6 },
          ]}
          onPress={() => handleSignIn(email, password)}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Sign in</Text>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or try a demo</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.demoRow}>
          {DEMO_ACCOUNTS.map((acc) => (
            <Pressable
              key={acc.role}
              style={({ pressed }) => [
                styles.demoChip,
                pressed && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => handleSignIn(acc.email, acc.password, true)}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={`Sign in as ${acc.label} demo account`}
            >
              {({ pressed }) => (
                <Text style={[styles.demoChipText, pressed && { color: colors.white }]}>
                  {acc.label}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: colors.background },
  hero: {
    paddingTop: 96,
    paddingBottom: 72,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  drop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  wordmark: { fontFamily: fonts.extrabold, fontSize: 40, color: colors.white, letterSpacing: -1 },
  wordmarkAccent: { color: '#FFD9D2' },
  tagline: {
    fontFamily: fonts.script,
    fontSize: 20,
    color: 'rgba(255,255,255,0.92)',
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginTop: -44,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.floating,
  },
  cardTitle: { ...type.h2, color: colors.text },
  cardSubtitle: { ...type.small, color: colors.textMuted, marginBottom: spacing.md },
  label: { ...type.label, color: colors.textMuted, marginTop: spacing.md, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#FCFAF9',
  },
  error: { color: colors.error, fontFamily: fonts.medium, fontSize: 13, marginTop: spacing.md },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  primaryButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, letterSpacing: 0.3 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...type.small, color: colors.textMuted },
  demoRow: { flexDirection: 'row', gap: spacing.sm },
  demoChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 11,
    alignItems: 'center',
  },
  demoChipText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },
});
