import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';

import { acceptRequest, getRequestDetails } from '@/services/donationService';
import { geocodeHospital } from '@/services/geocodeService';
import { useLocation } from '@/hooks/useLocation';
import { distanceKm } from '@/utils/distance';
import { mapHtml } from '@/utils/mapHtml';
import { getUrgency, formatNeededBy } from '@/utils/urgency';
import { colors, spacing, radius, fonts, type } from '@/constants/theme';
import { BloodRoundel } from '@/components/BloodRoundel';
import { UrgencyPill, StatusPill } from '@/components/Pills';

const CLOSED_LABEL: Record<string, string> = {
  inprogress: 'has a donor matched',
  done: 'has been completed',
  canceled: 'was cancelled',
};

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
      Alert.alert('Thank you', 'The family has been notified that you can donate.');
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
  const urgency = getUrgency(data.donation_date, data.donation_time);
  const critical = urgency.level === 'critical' || urgency.level === 'pastdue';
  const distance =
    hospital && me ? distanceKm(me.latitude, me.longitude, hospital.latitude, hospital.longitude) : null;

  const confirmAccept = () =>
    Alert.alert('Confirm donation', `Let ${data.recipient_name}'s family know you can donate?`, [
      { text: 'Not now', style: 'cancel' },
      { text: 'I can donate', onPress: () => accept.mutate() },
    ]);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <BloodRoundel group={data.blood_group} size={52} variant={critical ? 'solid' : 'tint'} />
        <View style={styles.heroInfo}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {data.recipient_name}
            </Text>
            {isOpen ? <UrgencyPill level={urgency.level} /> : <StatusPill status={data.donation_status} />}
          </View>
          <Text style={styles.heroSub}>
            Needs {data.blood_group} · {formatNeededBy(data.donation_date, data.donation_time)}
          </Text>
        </View>
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
              <WebView
                key={me ? 'route' : 'hospital'}
                style={styles.map}
                originWhitelist={['*']}
                scrollEnabled={false}
                source={{ html: mapHtml(hospital, me, data.hospital_name, false) }}
              />
            </View>
            {distance != null ? (
              <View style={styles.distanceChip}>
                <Feather name="map-pin" size={11} color={colors.primary} />
                <Text style={styles.distanceChipText}>{distance.toFixed(1)} km from you</Text>
              </View>
            ) : null}
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
      </View>

      <View style={styles.card}>
        <Row icon="home">
          <Text style={styles.rowValue}>{data.hospital_name}</Text>
          <Text style={styles.rowMeta}>{data.full_address}</Text>
        </Row>
        <Row icon="clock" divider>
          <Text style={[styles.rowValue, critical && { color: colors.primary }]}>
            {formatNeededBy(data.donation_date, data.donation_time)}
          </Text>
          <Text style={styles.rowMeta}>{data.recipient_city}, {data.recipient_governorate}</Text>
        </Row>
        {data.request_message ? (
          <Row icon="message-circle" divider>
            <Text style={styles.message}>“{data.request_message}”</Text>
          </Row>
        ) : null}
      </View>

      {isOpen ? (
        <View style={styles.ctaRow}>
          <Pressable
            style={({ pressed }) => [styles.donate, pressed && { opacity: 0.9 }, accept.isPending && { opacity: 0.6 }]}
            onPress={confirmAccept}
            disabled={accept.isPending}
            accessibilityRole="button"
            accessibilityLabel="I can donate"
          >
            {accept.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.donateText}>I can donate</Text>
            )}
          </Pressable>
          {hospital ? (
            <Pressable
              style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.9 }]}
              onPress={() =>
                router.push({
                  pathname: '/map',
                  params: { lat: String(hospital.latitude), lng: String(hospital.longitude), label: data.hospital_name },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Directions"
            >
              <Feather name="corner-up-right" size={16} color={colors.ink} />
              <Text style={styles.secondaryText}>Directions</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.closedNote}>
          <Text style={styles.closedNoteText}>
            This request {CLOSED_LABEL[data.donation_status] ?? 'is closed'}.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Row({
  icon,
  children,
  divider,
}: {
  icon: keyof typeof Feather.glyphMap;
  children: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <View style={[styles.row, divider && styles.rowDivider]}>
      <Feather name={icon} size={16} color={colors.textMuted} style={styles.rowIcon} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroInfo: { flex: 1, minWidth: 0 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, letterSpacing: -0.4, flexShrink: 1 },
  heroSub: { ...type.small, color: colors.textMuted, marginTop: 3 },
  mapWrap: { borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  map: { width: '100%', height: 200 },
  distanceChip: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    shadowColor: '#211416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  distanceChipText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.ink },
  expandHint: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(33,20,22,0.72)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  expandHintText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 11 },
  mapPlaceholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapPlaceholderText: { ...type.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowIcon: { marginTop: 1 },
  rowValue: { ...type.bodyBold, color: colors.ink },
  rowMeta: { ...type.small, color: colors.textMuted, marginTop: 2 },
  message: { ...type.body, color: colors.textBody, lineHeight: 22 },
  ctaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  donate: {
    flex: 1.6,
    height: 52,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  secondary: {
    flex: 1,
    height: 52,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryText: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 14 },
  closedNote: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  closedNoteText: { ...type.body, color: colors.textBody },
});
