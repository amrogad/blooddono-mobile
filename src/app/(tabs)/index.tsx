import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { listRequests } from '../../../services/donationService';
import { useLocation } from '../../../hooks/useLocation';
import { distanceKm } from '../../../utils/distance';

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

export default function Requests() {
  const { coords } = useLocation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['requests'],
    queryFn: listRequests,
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

  const withDistance = (data ?? []).map((r) => ({
    ...r,
    distance:
      coords && r.latitude != null && r.longitude != null
        ? distanceKm(coords.latitude, coords.longitude, r.latitude, r.longitude)
        : null,
  }));

  withDistance.sort((a, b) => {
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance;
  });

  if (withDistance.length === 0) {
    return (
      <Centered>
        <Text>No open requests yet.</Text>
      </Centered>
    );
  }

  return (
    <FlatList
      data={withDistance}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.group}>{item.blood_group}</Text>
          <Text>{item.hospital_name}</Text>
          <Text style={styles.meta}>
            {item.urgency === 'urgent' ? '🔴 Urgent' : 'Normal'} · {item.units} unit(s)
            {item.distance != null ? ` · ${item.distance.toFixed(1)} km away` : ''}
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
  meta: { color: '#666' },
});
