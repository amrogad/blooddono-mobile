import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { getMyRequests, MyRequest } from '@/services/donationService';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing, radius, fonts, type } from '@/constants/theme';

const STATUS_STYLE: Record<MyRequest['donation_status'], { bg: string; fg: string }> = {
  pending: { bg: '#FDECEC', fg: colors.primary },
  inprogress: { bg: '#FFF4E5', fg: '#B26A00' },
  done: { bg: '#E7F6EC', fg: colors.success },
  canceled: { bg: colors.surface, fg: colors.textMuted },
};

export default function MyRequests() {
  const { session } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['myRequests', session?.user.id],
    queryFn: () => getMyRequests(session!.user.id),
    enabled: !!session,
  });

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

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
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
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm, backgroundColor: colors.background },
  emptyTitle: { ...type.h3, color: colors.text },
  emptyBody: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 4,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  groupPill: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  groupPillText: { color: colors.white, fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.5 },
  statusPill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontFamily: fonts.semibold, fontSize: 12, textTransform: 'capitalize' },
  name: { ...type.h3, color: colors.text, marginTop: 4 },
  meta: { ...type.body, color: colors.textMuted },
  metaMuted: { ...type.small, color: colors.textMuted },
});
