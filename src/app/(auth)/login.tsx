import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

import { useAuth } from '../../../providers/AuthProvider';
import { DEMO_ACCOUNTS } from '../../../constants/demoAccounts';

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
    <View style={styles.container}>
      <Text style={styles.title}>BloodDono</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title={submitting ? 'Signing in…' : 'Sign In'}
        onPress={() => handleSignIn(email, password)}
        disabled={submitting}
      />

      <Text style={styles.demoLabel}>Demo logins</Text>
      {DEMO_ACCOUNTS.map((acc) => (
        <Button
          key={acc.role}
          title={acc.label}
          onPress={() => handleSignIn(acc.email, acc.password)}
          disabled={submitting}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  error: { color: 'red' },
  demoLabel: { textAlign: 'center', marginTop: 16, color: '#666' },
});
