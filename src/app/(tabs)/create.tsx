import { View, Text, StyleSheet } from 'react-native';

export default function Create() {
  return (
    <View style={styles.center}>
      <Text>Create Request (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
