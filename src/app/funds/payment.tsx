import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { createFund } from '@/services/fundService';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { spacing, radius, fonts, type } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';

const PRESETS = [50, 100, 250, 500];

export default function Payment() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const { amount: preset } = useLocalSearchParams<{ amount?: string }>();
  const { colors, styles } = useThemedStyles(makeStyles);
  const { t } = useTranslation();

  const [amount, setAmount] = useState(preset ?? '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [amountError, setAmountError] = useState('');

  const donate = useMutation({
    mutationFn: () =>
      createFund({
        user_id: session!.user.id,
        name: profile?.display_name ?? session!.user.email ?? '',
        email: session!.user.email ?? '',
        amount: parseFloat(amount),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      Alert.alert(t('payment.thankTitle'), t('payment.thankBody'), [
        { text: t('payment.ok'), onPress: () => router.replace('/funds') },
      ]);
    },
    onError: (e: Error) => Alert.alert(t('payment.failed'), e.message),
  });

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setAmountError(t('payment.invalidAmount'));
      return;
    }
    setAmountError('');
    donate.mutate();
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>{t('payment.title')}</Text>
      <Text style={styles.pageSubtitle}>{t('payment.subtitle')}</Text>

      <Text style={styles.label}>{t('payment.amount')}</Text>
      <View style={styles.presetRow}>
        {PRESETS.map((p) => {
          const on = amount === String(p);
          return (
            <Pressable
              key={p}
              onPress={() => {
                setAmount(String(p));
                setAmountError('');
              }}
              style={[styles.preset, on && styles.presetOn]}
            >
              <Text style={[styles.presetText, on && styles.presetTextOn]}>EGP {p}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        style={styles.input}
        placeholder={t('payment.otherPlaceholder')}
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={(t) => {
          setAmount(t);
          setAmountError('');
        }}
      />
      {amountError ? <Text style={styles.fieldError}>{amountError}</Text> : null}

      <Text style={styles.label}>{t('payment.cardNumber')}</Text>
      <TextInput
        style={styles.input}
        placeholder="4242 4242 4242 4242"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={19}
        value={cardNumber}
        onChangeText={setCardNumber}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('payment.expiry')}</Text>
          <TextInput
            style={styles.input}
            placeholder="MM / YY"
            placeholderTextColor={colors.textMuted}
            maxLength={7}
            value={expiry}
            onChangeText={setExpiry}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('payment.cvc')}</Text>
          <TextInput
            style={styles.input}
            placeholder="123"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={3}
            value={cvc}
            onChangeText={setCvc}
            secureTextEntry
          />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.submit, pressed && { opacity: 0.9 }, donate.isPending && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={donate.isPending}
        accessibilityRole="button"
        accessibilityLabel={t('payment.submitA11y')}
      >
        {donate.isPending ? (
          <ActivityIndicator color={colors.onInk} />
        ) : (
          <Text style={styles.submitText}>{amount ? t('payment.giveAmount', { amount }) : t('payment.give')}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
  pageTitle: { ...type.h2, color: colors.ink },
  pageSubtitle: { ...type.small, color: colors.textMuted, marginBottom: spacing.sm },
  label: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink, marginTop: spacing.md, marginBottom: 6 },
  presetRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  preset: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  presetText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textBody },
  presetTextOn: { color: colors.onInk },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 13,
    paddingHorizontal: 15,
    height: 48,
    justifyContent: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    backgroundColor: colors.white,
    color: colors.ink,
  },
  fieldError: { color: colors.error, fontFamily: fonts.medium, fontSize: 13, marginTop: 4 },
  row: { flexDirection: 'row', gap: spacing.md },
  submit: {
    backgroundColor: colors.ink,
    borderRadius: radius.card,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  submitText: { color: colors.onInk, fontFamily: fonts.bold, fontSize: 16 },
});
