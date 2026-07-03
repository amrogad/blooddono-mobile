import { memo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';

import { getPendingRequests, PendingRequest } from '../../../services/donationService';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../hooks/useProfile';
import { colors, spacing, radius, fonts, type, shadow } from '../../../constants/theme';
import { BrandHeader } from '../../../components/BrandHeader';
import { SkeletonCard } from '../../../components/SkeletonCard';

function scoreProximity(r: PendingRequest, gov?: string | null, city?: string | null) {
  if (!gov) return 2;
  if (r.recipient_governorate === gov && r.recipient_city === city) return 0;
  if (r.recipient_governorate === gov) return 1;
  return 2;
}

const RequestCard = memo(function RequestCard({
  item,
  nearHome,
}: {
  item: PendingRequest;
  nearHome: boolean;
}) {
  return (
    <Link href={`/request/${item.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Open request for ${item.recipient_name}, blood group ${item.blood_group}`}
      >
        <View style={styles.accentStripe} />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={styles.groupPill}>
              <Text style={styles.groupPillText}>{item.blood_group}</Text>
            </View>
            {nearHome && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>◍ In your area</Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{item.recipient_name}</Text>
          <Text style={styles.meta}>
            {item.recipient_city}, {item.recipient_governorate}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.metaMuted}>
            {item.donation_date} · {item.donation_time.slice(0, 5)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
});

export default function Requests() {
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: getPendingRequests,
  });

  const header = <BrandHeader title="Open requests" subtitle="Someone nearby needs you" />;

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.skeletonList}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Couldn&apos;t load requests</Text>
          <Text style={styles.emptyBody}>Check your connection and try again.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading requests"
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No open requests</Text>
          <Text style={styles.emptyBody}>New requests will appear here as they&apos;re posted.</Text>
        </View>
      </View>
    );
  }

  const sorted = [...data].sort(
    (a, b) =>
      scoreProximity(a, profile?.governorate, profile?.city) -
      scoreProximity(b, profile?.governorate, profile?.city),
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item }) => (
          <RequestCard
            item={item}
            nearHome={!!profile?.governorate && item.recipient_governorate === profile.governorate}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { ...type.h3, color: colors.text },
  emptyBody: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
  skeletonList: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardPressed: { transform: [{ translateY: -2 }] },
  accentStripe: { width: 5, backgroundColor: colors.primary },
  cardBody: { flex: 1, padding: spacing.lg, gap: 4 },
  cardTopRow: {
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
  badge: {
    backgroundColor: '#FDECEC',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11 },
  name: { ...type.h3, color: colors.text, marginTop: 4 },
  meta: { ...type.body, color: colors.textMuted },
  metaMuted: { ...type.small, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
});
