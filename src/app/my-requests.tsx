import { useState } from 'react';
import { View, Text, FlatList, ScrollView, ActivityIndicator, StyleSheet, Pressable, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import {
  getMyRequests,
  updateDonationRequest,
  deleteDonationRequest,
  MyRequest,
  DonationStatus,
} from '@/services/donationService';
import { useAuth } from '@/providers/AuthProvider';
import { BloodRoundel } from '@/components/BloodRoundel';
import { StatusPill } from '@/components/Pills';
import { formatNeededBy } from '@/utils/urgency';
import { spacing, radius, fonts, type } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';

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
  const { colors, styles } = useThemedStyles(makeStyles);
  const [filter, setFilter] = useState<'all' | DonationStatus>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['myRequests', session?.user.id],
    queryFn: () => getMyRequests(session!.user.id),
    enabled: !!session,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['myRequests', session?.user.id] });

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

  const confirmCancel = (item: MyRequest) =>
    Alert.alert('Cancel request?', `Stop looking for donors for ${item.recipient_name}?`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel request', style: 'destructive', onPress: () => setStatus.mutate({ id: item.id, status: 'canceled' }) },
    ]);

  const confirmDelete = (item: MyRequest) =>
    Alert.alert('Delete request?', 'This request will be permanently removed.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(item.id) },
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
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
        ListEmptyComponent={<Text style={styles.filterEmpty}>No requests with this status.</Text>}
        renderItem={({ item }) => (
          <MyRequestCard
            item={item}
            busy={busy}
            onView={() => router.push(`/request/${item.id}`)}
            onEdit={() => router.push(`/edit-request/${item.id}`)}
            onFulfill={() => setStatus.mutate({ id: item.id, status: 'done' })}
            onCancel={() => confirmCancel(item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />
    </View>
  );
}

function MyRequestCard({
  item,
  busy,
  onView,
  onEdit,
  onFulfill,
  onCancel,
  onDelete,
}: {
  item: MyRequest;
  busy: boolean;
  onView: () => void;
  onEdit: () => void;
  onFulfill: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const { colors, styles } = useThemedStyles(makeStyles);
  const active = item.donation_status === 'pending' || item.donation_status === 'inprogress';
  return (
    <View style={styles.card}>
      <Pressable onPress={onView} accessibilityRole="button" accessibilityLabel={`View request for ${item.recipient_name}`}>
        <View style={styles.topRow}>
          <BloodRoundel group={item.blood_group} size={46} variant="tint" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>
              {item.recipient_name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.recipient_city}, {item.recipient_governorate} · {formatNeededBy(item.donation_date, item.donation_time)}
            </Text>
          </View>
          <StatusPill status={item.donation_status} />
        </View>
      </Pressable>

      {active ? (
        <>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.9 }]}
              onPress={onEdit}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Edit details"
            >
              <Feather name="edit-3" size={14} color={colors.ink} />
              <Text style={styles.outlineText}>Edit details</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.fulfill, pressed && { opacity: 0.9 }, busy && { opacity: 0.5 }]}
              onPress={onFulfill}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Mark fulfilled"
            >
              <Feather name="check" size={15} color={colors.onInk} />
              <Text style={styles.fulfillText}>Mark fulfilled</Text>
            </Pressable>
          </View>
          <Pressable style={styles.link} onPress={onCancel} disabled={busy} accessibilityRole="button" accessibilityLabel="Cancel request">
            <Text style={styles.cancelLink}>Cancel request</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable
            style={({ pressed }) => [styles.outlineBtn, styles.viewFull, pressed && { opacity: 0.9 }]}
            onPress={onView}
            accessibilityRole="button"
            accessibilityLabel="View details"
          >
            <Text style={styles.outlineText}>View details</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={onDelete} disabled={busy} accessibilityRole="button" accessibilityLabel="Delete request">
            <Text style={styles.deleteLink}>Delete</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  filterBar: { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background },
  filterRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textBody },
  chipTextActive: { color: colors.onInk },
  filterEmpty: { ...type.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  name: { ...type.title, color: colors.ink },
  meta: { ...type.small, color: colors.textMuted, marginTop: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  outlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  outlineText: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 13 },
  viewFull: { marginTop: spacing.md },
  fulfill: {
    flex: 1,
    height: 44,
    borderRadius: radius.control,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  fulfillText: { color: colors.onInk, fontFamily: fonts.bold, fontSize: 13 },
  link: { alignItems: 'center', paddingVertical: spacing.md, marginTop: 2 },
  cancelLink: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 12.5 },
  deleteLink: { color: colors.error, fontFamily: fonts.semibold, fontSize: 12.5 },
});
