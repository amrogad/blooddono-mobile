import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

import { useAuth } from '../../../providers/AuthProvider';
import { DEMO_ACCOUNTS } from '../../../constants/demoAccounts';
import { Logo } from '../../../components/Logo';
import { GradientHeader } from '../../../components/GradientHeader';
import { colors, spacing, radius, fonts, type } from '../../../constants/theme';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async (e: string, p: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(e, p);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Logo size={40} />
      </View>

      <View style={styles.card}>
        <GradientHeader title="Login" subtitle="Welcome back" />

        <View style={styles.body}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
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
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Demo logins</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={{ gap: spacing.sm }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <Pressable
                key={acc.role}
                style={({ pressed }) => [
                  styles.outlineButton,
                  pressed && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
                onPress={() => handleSignIn(acc.email, acc.password)}
                disabled={submitting}
              >
                {({ pressed }) => (
                  <Text style={[styles.outlineButtonText, pressed && { color: colors.white }]}>
                    {acc.label}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  body: { padding: spacing.xl, gap: spacing.md },
  label: { ...type.label, color: colors.textMuted, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  error: { color: colors.error, fontFamily: fonts.medium, fontSize: 13 },
  primaryButton: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...type.small, color: colors.textMuted },
  outlineButton: {
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineButtonText: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
});
