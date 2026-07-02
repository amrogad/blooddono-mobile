import { View, Text, FlatList, ActivityIndicator, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';

import { getPendingRequests, PendingRequest } from '../../../services/donationService';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../hooks/useProfile';

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

function scoreProximity(r: PendingRequest, gov?: string | null, city?: string | null) {
  if (!gov) return 2;
  if (r.recipient_governorate === gov && r.recipient_city === city) return 0;
  if (r.recipient_governorate === gov) return 1;
  return 2;
}

export default function Requests() {
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
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

  const sorted = [...data].sort(
    (a, b) =>
      scoreProximity(a, profile?.governorate, profile?.city) -
      scoreProximity(b, profile?.governorate, profile?.city),
  );

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderItem={({ item }) => {
        const nearHome = !!profile?.governorate && item.recipient_governorate === profile.governorate;
        return (
          <Link href={`/request/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.group}>{item.blood_group}</Text>
                {nearHome && <Text style={styles.badge}>In your area</Text>}
              </View>
              <Text style={styles.name}>{item.recipient_name}</Text>
              <Text style={styles.meta}>
                {item.recipient_city}, {item.recipient_governorate}
              </Text>
              <Text style={styles.meta}>
                {item.donation_date} · {item.donation_time.slice(0, 5)}
              </Text>
            </Pressable>
          </Link>
        );
      }}
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  group: { fontSize: 22, fontWeight: 'bold', color: '#8B0000' },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#666' },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B0000',
    backgroundColor: '#FDECEC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
