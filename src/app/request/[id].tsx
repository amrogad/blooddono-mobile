import { View, Text, Button, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { acceptRequest, getRequestDetails } from '../../../services/donationService';

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getRequestDetails(id!),
    enabled: !!id,
  });

  const accept = useMutation({
    mutationFn: () => acceptRequest(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      await queryClient.invalidateQueries({ queryKey: ['request', id] });
      Alert.alert('Accepted', 'You accepted this request.');
      router.replace('/');
    },
    onError: (e: Error) => Alert.alert('Could not accept', e.message),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text>Request not found.</Text>
      </View>
    );
  }

  const isOpen = data.donation_status === 'pending';

  return (
    <View style={styles.container}>
      <Text style={styles.group}>{data.blood_group}</Text>
      <Text style={styles.name}>{data.recipient_name}</Text>
      <Text style={styles.meta}>
        {data.recipient_city}, {data.recipient_governorate}
      </Text>
      <Text style={styles.meta}>{data.hospital_name}</Text>
      <Text style={styles.meta}>{data.full_address}</Text>
      <Text style={styles.meta}>
        {data.donation_date} · {data.donation_time.slice(0, 5)}
      </Text>

      <View style={styles.messageBox}>
        <Text style={styles.messageLabel}>Message</Text>
        <Text>{data.request_message}</Text>
      </View>

      <View style={styles.status}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={styles.statusValue}>{data.donation_status}</Text>
      </View>

      {isOpen && (
        <Button
          title={accept.isPending ? 'Accepting…' : 'Accept'}
          onPress={() => accept.mutate()}
          disabled={accept.isPending}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 24, gap: 6 },
  group: { fontSize: 30, fontWeight: 'bold', color: '#8B0000' },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  meta: { color: '#555' },
  messageBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f6f6f6',
    gap: 4,
  },
  messageLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  status: { marginTop: 16 },
  statusLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  statusValue: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
});
