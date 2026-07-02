import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getPendingRequests } from '../../../services/donationService';

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

export default function Requests() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: getPendingRequests,
  });

  if (isLoading) {
    return (
      <Centered>
        <ActivityIndicator />
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <Text>Couldn&apos;t load requests.</Text>
      </Centered>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Centered>
        <Text>No open requests right now.</Text>
      </Centered>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.group}>{item.blood_group}</Text>
          <Text style={styles.name}>{item.recipient_name}</Text>
          <Text style={styles.meta}>
            {item.recipient_city}, {item.recipient_governorate}
          </Text>
          <Text style={styles.meta}>
            {item.donation_date} · {item.donation_time.slice(0, 5)}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 16,
    gap: 4,
  },
  group: { fontSize: 22, fontWeight: 'bold', color: '#8B0000' },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#666' },
});
