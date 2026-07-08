import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createFund } from '@/services/fundService';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { colors, spacing, radius, fonts, type } from '@/constants/theme';

export default function Payment() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);

  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [amountError, setAmountError] = useState('');

  const donate = useMutation({
    mutationFn: () => {
      const parsed = parseFloat(amount);
      return createFund({
        user_id: session!.user.id,
        name: profile?.display_name ?? session!.user.email ?? '',
        email: session!.user.email ?? '',
        amount: parsed,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      Alert.alert('Thank you!', 'Your donation was received.', [
        { text: 'OK', onPress: () => router.replace('/funds') },
      ]);
    },
    onError: (e: Error) => Alert.alert('Payment failed', e.message),
  });

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setAmountError('Enter a valid amount');
      return;
    }
    setAmountError('');
    donate.mutate();
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Donation form</Text>
      <Text style={styles.pageSubtitle}>Support the BloodDono community</Text>

      <Field label="Amount (EGP)">
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#aaa"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        {amountError ? <Text style={styles.fieldError}>{amountError}</Text> : null}
      </Field>

      <Field label="Card number">
        <TextInput
          style={styles.input}
          placeholder="4242 4242 4242 4242"
          placeholderTextColor="#aaa"
          keyboardType="number-pad"
          maxLength={19}
          value={cardNumber}
          onChangeText={setCardNumber}
        />
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="Expiry">
            <TextInput
              style={styles.input}
              placeholder="MM / YY"
              placeholderTextColor="#aaa"
              maxLength={7}
              value={expiry}
              onChangeText={setExpiry}
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="CVC">
            <TextInput
              style={styles.input}
              placeholder="123"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              maxLength={3}
              value={cvc}
              onChangeText={setCvc}
              secureTextEntry
            />
          </Field>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.submit,
          pressed && { opacity: 0.9 },
          donate.isPending && { opacity: 0.6 },
        ]}
        onPress={handleSubmit}
        disabled={donate.isPending}
        accessibilityRole="button"
        accessibilityLabel="Submit donation"
      >
        {donate.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>Pay</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md },
  pageTitle: { ...type.h2, color: colors.text },
  pageSubtitle: { ...type.body, color: colors.textMuted, marginBottom: spacing.sm },
  label: { ...type.label, color: colors.textMuted, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    backgroundColor: colors.white,
    color: colors.text,
  },
  fieldError: { color: colors.error, fontFamily: fonts.medium, fontSize: 13 },
  row: { flexDirection: 'row', gap: spacing.md },
  submit: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
});
