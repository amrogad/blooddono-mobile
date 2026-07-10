import { memo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { getFunds, Fund } from '@/services/fundService';
import { spacing, radius, fonts, type } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

const FundRow = memo(function FundRow({ item }: { item: Fund }) {
  const { colors, styles } = useThemedStyles(makeStyles);
  const label = (item.name ?? '').trim() || 'Anonymous';
  const badge = initials(item.name ?? '');
  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        {badge ? (
          <Text style={styles.badgeText}>{badge}</Text>
        ) : (
          <Feather name="heart" size={14} color={colors.textMuted} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowName} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.rowDate}>
          {new Date(item.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <Text style={styles.rowAmount}>EGP {Number(item.amount).toLocaleString()}</Text>
    </View>
  );
});

export default function Funds() {
  const router = useRouter();
  const { colors, styles } = useThemedStyles(makeStyles);
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['funds'],
    queryFn: getFunds,
  });

  const total = data?.reduce((sum, f) => sum + Number(f.amount), 0) ?? 0;
  const count = data?.length ?? 0;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.topTitle}>Community fund</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>RAISED SO FAR</Text>
        <Text style={styles.heroAmount}>EGP {total.toLocaleString()}</Text>
        <Text style={styles.heroCopy}>
          Covers transport for donors who can&apos;t afford the trip, and SMS alerts where push doesn&apos;t reach.
        </Text>
        <View style={styles.heroButtons}>
          <Pressable
            style={({ pressed }) => [styles.giveBtn, pressed && { opacity: 0.9 }]}
            onPress={() => router.push({ pathname: '/funds/payment', params: { amount: '100' } })}
            accessibilityRole="button"
            accessibilityLabel="Give 100 EGP"
          >
            <Text style={styles.giveBtnText}>Give EGP 100</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.otherBtn, pressed && { opacity: 0.9 }]}
            onPress={() => router.push('/funds/payment')}
            accessibilityRole="button"
            accessibilityLabel="Give another amount"
          >
            <Text style={styles.otherBtnText}>Other</Text>
          </Pressable>
        </View>
        <View style={styles.secureRow}>
          <Feather name="lock" size={11} color="#9C938E" />
          <Text style={styles.secureText}>Secure payment · every pound is listed below</Text>
        </View>
      </View>

      <View style={styles.ledgerHead}>
        <Text style={styles.ledgerHeadLabel}>RECENT SUPPORT</Text>
        {count > 0 ? (
          <Text style={styles.ledgerHeadCount}>
            {count} {count === 1 ? 'person' : 'people'}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        renderItem={({ item }) => <FundRow item={item} />}
        ListEmptyComponent={
          <View style={styles.state}>
            {isLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : error ? (
              <Text style={styles.stateText}>Couldn&apos;t load records. Pull to retry.</Text>
            ) : (
              <Text style={styles.stateText}>No support yet — be the first to give.</Text>
            )}
          </View>
        }
        ListFooterComponent={
          count > 0 ? (
            <Text style={styles.footerNote}>
              Money never buys blood — it removes the obstacles around giving it.
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: spacing.xl },
  headerWrap: { paddingHorizontal: spacing.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: 58, paddingBottom: spacing.md },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.control,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { ...type.h3, fontFamily: fonts.display, color: colors.ink },
  hero: { backgroundColor: '#211D1E', borderRadius: radius.lg, padding: spacing.xl },
  heroLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: '#9C938E' },
  heroAmount: { fontFamily: fonts.displayBold, fontSize: 34, color: '#FBF8F4', letterSpacing: -0.6, marginTop: 4 },
  heroCopy: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: '#C9C0BB', marginTop: spacing.sm },
  heroButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  giveBtn: { flex: 1, height: 44, borderRadius: radius.md, backgroundColor: '#FBF8F4', alignItems: 'center', justifyContent: 'center' },
  giveBtnText: { fontFamily: fonts.bold, fontSize: 14, color: '#211D1E' },
  otherBtn: {
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherBtnText: { fontFamily: fonts.bold, fontSize: 14, color: '#FBF8F4' },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  secureText: { fontFamily: fonts.regular, fontSize: 11, color: '#9C938E' },
  ledgerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.sm },
  ledgerHeadLabel: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1, color: colors.textMuted },
  ledgerHeadCount: { ...type.small, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.displayBold, fontSize: 11.5, color: colors.textBody },
  rowName: { ...type.bodyBold, color: colors.ink },
  rowDate: { ...type.small, color: colors.textMuted },
  rowAmount: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink },
  state: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  stateText: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  footerNote: {
    ...type.small,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
});
