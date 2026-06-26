import { View, Text, StyleSheet } from 'react-native';

export default function Assistant() {
  return (
    <View style={styles.center}>
      <Text>Assistant (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
