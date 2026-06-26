import { View, Text, StyleSheet } from 'react-native';

export default function Requests() {
  return (
    <View style={styles.center}>
      <Text>Requests (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
