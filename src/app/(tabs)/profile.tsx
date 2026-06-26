import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '../../../providers/AuthProvider';

export default function Profile() {
  const { session, signOut } = useAuth();
  return (
    <View style={styles.center}>
      <Text>Profile (placeholder)</Text>
      <Text>{session?.user.email}</Text>
      <Button title="Sign out" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
