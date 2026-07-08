import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';

import {
  getMyRequests,
  updateDonationRequest,
  deleteDonationRequest,
  MyRequest,
  DonationStatus,
} from '@/services/donationService';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing, radius, fonts, type } from '@/constants/theme';

const STATUS_STYLE: Record<DonationStatus, { bg: string; fg: string }> = {
  pending: { bg: '#FDECEC', fg: colors.primary },
  inprogress: { bg: '#FFF4E5', fg: '#B26A00' },
  done: { bg: '#E7F6EC', fg: colors.success },
  canceled: { bg: colors.surface, fg: colors.textMuted },
};

const FILTERS: { label: string; value: 'all' | DonationStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In progress', value: 'inprogress' },
  { label: 'Done', value: 'done' },
  { label: 'Canceled', value: 'canceled' },
];

export default function MyRequests() {
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | DonationStatus>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['myRequests', session?.user.id],
    queryFn: () => getMyRequests(session!.user.id),
    enabled: !!session,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['myRequests', session?.user.id] });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DonationStatus }) =>
      updateDonationRequest(id, { donation_status: status }),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert('Update failed', e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDonationRequest(id),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert('Delete failed', e.message),
  });

  const confirmDelete = (id: string) =>
    Alert.alert('Delete request?', 'This request will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(id) },
    ]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'My requests' }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'My requests' }} />
        <Text style={type.body}>Couldn&apos;t load your requests.</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'My requests' }} />
        <Text style={styles.emptyTitle}>No requests yet</Text>
        <Text style={styles.emptyBody}>Requests you post will show up here with their status.</Text>
      </View>
    );
  }

  const filtered = filter === 'all' ? data : data.filter((r) => r.donation_status === filter);
  const busy = setStatus.isPending || remove.isPending;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'My requests' }} />

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.filterEmpty}>No requests with this status.</Text>
        }
        renderItem={({ item }) => (
          <RequestCard
            item={item}
            busy={busy}
            onView={() => router.push(`/request/${item.id}`)}
            onEdit={() => router.push(`/edit-request/${item.id}`)}
            onDelete={() => confirmDelete(item.id)}
            onDone={() => setStatus.mutate({ id: item.id, status: 'done' })}
            onCancel={() => setStatus.mutate({ id: item.id, status: 'canceled' })}
          />
        )}
      />
    </View>
  );
}

function RequestCard({
  item,
  busy,
  onView,
  onEdit,
  onDelete,
  onDone,
  onCancel,
}: {
  item: MyRequest;
  busy: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const s = STATUS_STYLE[item.donation_status];
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.groupPill}>
          <Text style={styles.groupPillText}>{item.blood_group}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.fg }]}>{item.donation_status}</Text>
        </View>
      </View>
      <Text style={styles.name}>{item.recipient_name}</Text>
      <Text style={styles.meta}>
        {item.recipient_city}, {item.recipient_governorate}
      </Text>
      <Text style={styles.metaMuted}>
        {item.donation_date} · {item.donation_time.slice(0, 5)}
      </Text>

      <View style={styles.actions}>
        {item.donation_status === 'inprogress' && (
          <>
            <Action label="Mark done" tone="success" onPress={onDone} disabled={busy} />
            <Action label="Cancel" tone="warning" onPress={onCancel} disabled={busy} />
          </>
        )}
        <Action label="View" tone="neutral" onPress={onView} disabled={busy} />
        <Action label="Edit" tone="neutral" onPress={onEdit} disabled={busy} />
        <Action label="Delete" tone="danger" onPress={onDelete} disabled={busy} />
      </View>
    </View>
  );
}

const TONE: Record<string, { border: string; fg: string }> = {
  neutral: { border: colors.border, fg: colors.text },
  success: { border: '#BEE7CC', fg: colors.success },
  warning: { border: '#F3D9B0', fg: '#B26A00' },
  danger: { border: '#F3C4C4', fg: colors.error },
};

function Action({
  label,
  tone,
  onPress,
  disabled,
}: {
  label: string;
  tone: keyof typeof TONE;
  onPress: () => void;
  disabled: boolean;
}) {
  const t = TONE[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        { borderColor: t.border },
        pressed && { opacity: 0.6 },
        disabled && { opacity: 0.5 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.actionText, { color: t.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  emptyTitle: { ...type.h3, color: colors.text },
  emptyBody: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  filterBar: { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  filterRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.white },
  filterEmpty: { ...type.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  groupPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  groupPillText: { color: colors.white, fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.5 },
  statusPill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontFamily: fonts.semibold, fontSize: 12, textTransform: 'capitalize' },
  name: { ...type.h3, color: colors.text, marginTop: 4 },
  meta: { ...type.body, color: colors.textMuted },
  metaMuted: { ...type.small, color: colors.textMuted },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  action: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionText: { fontFamily: fonts.semibold, fontSize: 13 },
});
