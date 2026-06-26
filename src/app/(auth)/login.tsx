import { View, Text, StyleSheet } from 'react-native';

export default function Login() {
  return (
    <View style={styles.center}>
      <Text>Login (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
