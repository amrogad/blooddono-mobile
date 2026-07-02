import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';

import { getPendingRequests, PendingRequest } from '../../../services/donationService';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../hooks/useProfile';
import { colors, spacing, radius, fonts, type } from '../../../constants/theme';
import { Logo } from '../../../components/Logo';

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

  const Header = (
    <View style={styles.pageHeader}>
      <Logo size={26} />
      <Text style={styles.pageTitle}>Open requests</Text>
    </View>
  );

  if (isLoading) {
    return (
      <Centered>
        <ActivityIndicator color={colors.accent} />
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <Text style={type.body}>Couldn&apos;t load requests.</Text>
      </Centered>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {Header}
        <Centered>
          <Text style={styles.emptyText}>No open requests right now.</Text>
        </Centered>
      </View>
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
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      ListHeaderComponent={Header}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.accent}
        />
      }
      renderItem={({ item }) => {
        const nearHome =
          !!profile?.governorate && item.recipient_governorate === profile.governorate;
        return (
          <Link href={`/request/${item.id}`} asChild>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.groupPill}>
                  <Text style={styles.groupPillText}>{item.blood_group}</Text>
                </View>
                {nearHome && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>In your area</Text>
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
            </Pressable>
          </Link>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  pageHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  pageTitle: { ...type.h2, color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: { transform: [{ translateY: -1 }], opacity: 0.98 },
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
