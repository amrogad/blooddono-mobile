import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { acceptRequest, getRequestDetails } from '../../../services/donationService';
import { geocodeHospital } from '../../../services/geocodeService';
import { useLocation } from '../../../hooks/useLocation';
import { distanceKm } from '../../../utils/distance';

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { coords: me } = useLocation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getRequestDetails(id!),
    enabled: !!id,
  });

  const hospitalKey = data
    ? [data.hospital_name, data.full_address, data.recipient_city, data.recipient_governorate].join('|')
    : '';
  const {
    data: hospital,
    isFetching: geocoding,
    error: geoError,
  } = useQuery({
    queryKey: ['geocode', hospitalKey],
    queryFn: () =>
      geocodeHospital({
        hospitalName: data!.hospital_name,
        fullAddress: data!.full_address,
        city: data!.recipient_city,
        governorate: data!.recipient_governorate,
      }),
    enabled: !!data,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
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
  const distance =
    hospital && me
      ? distanceKm(me.latitude, me.longitude, hospital.latitude, hospital.longitude)
      : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <View style={styles.mapWrap}>
        {hospital ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: hospital.latitude,
              longitude: hospital.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker
              coordinate={hospital}
              title={data.hospital_name}
              description={data.full_address}
              pinColor="#8B0000"
            />
            {me && (
              <Marker coordinate={me} title="You" pinColor="#1e90ff" />
            )}
          </MapView>
        ) : geocoding ? (
          <View style={[styles.map, styles.mapPlaceholder]}>
            <ActivityIndicator />
            <Text style={styles.mapPlaceholderText}>Locating hospital…</Text>
          </View>
        ) : (
          <View style={[styles.map, styles.mapPlaceholder]}>
            <Text style={styles.mapPlaceholderText}>
              {geoError ? "Couldn't reach the map service." : "Couldn't locate this hospital."}
            </Text>
          </View>
        )}
        {distance != null && (
          <Text style={styles.distance}>{distance.toFixed(1)} km from you</Text>
        )}
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 24, gap: 6 },
  group: { fontSize: 30, fontWeight: 'bold', color: '#8B0000' },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  meta: { color: '#555' },
  mapWrap: { marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  map: { width: '100%', height: 220 },
  mapPlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: { color: '#666' },
  distance: {
    marginTop: 8,
    color: '#8B0000',
    fontWeight: '600',
  },
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
