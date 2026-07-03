import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { acceptRequest, getRequestDetails } from '../../../services/donationService';
import { geocodeHospital } from '../../../services/geocodeService';
import { useLocation } from '../../../hooks/useLocation';
import { distanceKm } from '../../../utils/distance';
import { colors, spacing, radius, fonts, type } from '../../../constants/theme';

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { coords: me } = useLocation();
  const mapRef = useRef<MapView>(null);

  const fitBoth = (h: { latitude: number; longitude: number }) => {
    const points = me ? [h, me] : [h];
    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
      animated: false,
    });
  };

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
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={type.body}>Request not found.</Text>
      </View>
    );
  }

  const isOpen = data.donation_status === 'pending';
  const distance =
    hospital && me
      ? distanceKm(me.latitude, me.longitude, hospital.latitude, hospital.longitude)
      : null;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.groupPill}>
          <Text style={styles.groupPillText}>{data.blood_group}</Text>
        </View>
        <Text style={styles.name}>{data.recipient_name}</Text>
        <Text style={styles.meta}>
          {data.recipient_city}, {data.recipient_governorate}
        </Text>
      </View>

      <View style={styles.mapWrap}>
        {hospital ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/map',
                params: {
                  lat: String(hospital.latitude),
                  lng: String(hospital.longitude),
                  label: data.hospital_name,
                },
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Expand map to full screen"
          >
            <View pointerEvents="none">
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: hospital.latitude,
                  longitude: hospital.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                onMapReady={() => fitBoth(hospital)}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={hospital} pinColor={colors.primary} />
                {me && <Marker coordinate={me} pinColor="#1e90ff" />}
                {me && (
                  <Polyline
                    coordinates={[me, hospital]}
                    strokeColor={colors.primary}
                    strokeWidth={3}
                  />
                )}
              </MapView>
            </View>
            <View style={styles.expandHint}>
              <Text style={styles.expandHintText}>Tap to expand</Text>
            </View>
          </Pressable>
        ) : geocoding ? (
          <View style={[styles.map, styles.mapPlaceholder]}>
            <ActivityIndicator color={colors.accent} />
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

      <Section label="Hospital">
        <Text style={styles.sectionValue}>{data.hospital_name}</Text>
        <Text style={styles.sectionMeta}>{data.full_address}</Text>
      </Section>

      <Section label="When">
        <Text style={styles.sectionValue}>
          {data.donation_date} · {data.donation_time.slice(0, 5)}
        </Text>
      </Section>

      <Section label="Message">
        <Text style={type.body}>{data.request_message}</Text>
      </Section>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status</Text>
        <View style={[styles.statusPill, isOpen ? styles.statusOpen : styles.statusClosed]}>
          <Text style={styles.statusPillText}>{data.donation_status}</Text>
        </View>
      </View>

      {isOpen && (
        <Pressable
          style={({ pressed }) => [
            styles.acceptButton,
            pressed && { opacity: 0.9 },
            accept.isPending && { opacity: 0.6 },
          ]}
          onPress={() => accept.mutate()}
          disabled={accept.isPending}
        >
          {accept.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.acceptButtonText}>Accept request</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.xl, gap: spacing.md },
  hero: { alignItems: 'flex-start', gap: 4, marginBottom: spacing.sm },
  groupPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  groupPillText: { color: colors.white, fontFamily: fonts.extrabold, fontSize: 18, letterSpacing: 0.5 },
  name: { ...type.h1, color: colors.text },
  meta: { ...type.body, color: colors.textMuted },
  mapWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { width: '100%', height: 220 },
  expandHint: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  expandHintText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 11 },
  mapPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: { ...type.body, color: colors.textMuted },
  distance: {
    ...type.bodyBold,
    color: colors.primary,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  section: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  sectionLabel: { ...type.label, color: colors.textMuted, textTransform: 'uppercase' },
  sectionValue: { ...type.bodyBold, color: colors.text },
  sectionMeta: { ...type.small, color: colors.textMuted },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  statusLabel: { ...type.label, color: colors.textMuted, textTransform: 'uppercase' },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusOpen: { backgroundColor: '#FDECEC' },
  statusClosed: { backgroundColor: colors.surface },
  statusPillText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  acceptButton: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  acceptButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
});
