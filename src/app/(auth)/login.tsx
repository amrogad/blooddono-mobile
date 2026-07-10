import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/providers/AuthProvider';
import { DEMO_ACCOUNTS, DemoAccount } from '@/constants/demoAccounts';
import { spacing, radius, fonts, type } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';
import { isEmail, friendlyAuthError } from '@/utils/errors';
import brandMark from '@/assets/images/brand-mark.png';

const ROLE_INFO: Record<DemoAccount['role'], { desc: string; icon: keyof typeof Feather.glyphMap }> = {
  donor: { desc: 'Browse nearby requests and accept one', icon: 'droplet' },
  volunteer: { desc: 'Post and coordinate requests for patients', icon: 'users' },
  admin: { desc: 'Verify requests, manage users and funds', icon: 'shield' },
};
const DEMO_ORDER: DemoAccount['role'][] = ['donor', 'volunteer', 'admin'];

export default function Login() {
  const { signIn } = useAuth();
  const { colors, styles } = useThemedStyles(makeStyles);
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

  const demoAccounts = DEMO_ORDER.map((r) => DEMO_ACCOUNTS.find((a) => a.role === r)).filter(
    (a): a is DemoAccount => !!a,
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandRow}>
        <Image source={brandMark} style={styles.mark} />
        <Text style={styles.wordmark}>BloodDono</Text>
      </View>
      <Text style={styles.title}>Welcome back.</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }, submitting && { opacity: 0.6 }]}
        onPress={() => handleSignIn(email, password)}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
      >
        {submitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.primaryButtonText}>Sign in</Text>
        )}
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>EXPLORING? TRY A DEMO ROLE</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.roleList}>
        {demoAccounts.map((acc) => {
          const info = ROLE_INFO[acc.role];
          const isDonor = acc.role === 'donor';
          return (
            <Pressable
              key={acc.role}
              style={({ pressed }) => [styles.roleCard, pressed && { opacity: 0.85 }]}
              onPress={() => handleSignIn(acc.email, acc.password, true)}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={`${acc.label} demo account`}
            >
              <View style={[styles.roleIcon, isDonor ? styles.roleIconDonor : styles.roleIconMuted]}>
                <Feather name={info.icon} size={16} color={isDonor ? colors.primary : colors.textBody} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.roleLabel}>{acc.label}</Text>
                <Text style={styles.roleDesc}>{info.desc}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.stayRow}>
        <Feather name="lock" size={12} color={colors.textMuted} />
        <Text style={styles.stayText}>You stay signed in on this device</Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  scroll: { flexGrow: 1, paddingTop: 80, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: { width: 30, height: 30, borderRadius: 9 },
  wordmark: { fontFamily: fonts.display, fontSize: 19, color: colors.ink, letterSpacing: -0.3 },
  title: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.ink, letterSpacing: -0.6, marginTop: spacing.xl },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, marginTop: spacing.lg, marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  error: { color: colors.error, fontFamily: fonts.medium, fontSize: 13, marginTop: spacing.md },
  primaryButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  primaryButtonText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.8, color: colors.textMuted },
  roleList: { gap: spacing.sm },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    padding: 12,
  },
  roleIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roleIconDonor: { backgroundColor: colors.crimsonTint },
  roleIconMuted: { backgroundColor: colors.surface },
  roleLabel: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  roleDesc: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  stayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  stayText: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted },
});
