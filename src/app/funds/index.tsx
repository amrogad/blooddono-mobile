import { memo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const label = (item.name ?? '').trim() || t('funds.anonymous');
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
  const { t } = useTranslation();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['funds'],
    queryFn: getFunds,
  });

  const total = data?.reduce((sum, f) => sum + Number(f.amount), 0) ?? 0;
  const count = data?.length ?? 0;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('funds.back')}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.topTitle}>{t('funds.title')}</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{t('funds.raisedLabel')}</Text>
        <Text style={styles.heroAmount}>EGP {total.toLocaleString()}</Text>
        <Text style={styles.heroCopy}>{t('funds.heroCopy')}</Text>
        <View style={styles.heroButtons}>
          <Pressable
            style={({ pressed }) => [styles.giveBtn, pressed && { opacity: 0.9 }]}
            onPress={() => router.push({ pathname: '/funds/payment', params: { amount: '100' } })}
            accessibilityRole="button"
            accessibilityLabel={t('funds.give100A11y')}
          >
            <Text style={styles.giveBtnText}>{t('funds.give100')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.otherBtn, pressed && { opacity: 0.9 }]}
            onPress={() => router.push('/funds/payment')}
            accessibilityRole="button"
            accessibilityLabel={t('funds.otherA11y')}
          >
            <Text style={styles.otherBtnText}>{t('funds.other')}</Text>
          </Pressable>
        </View>
        <View style={styles.secureRow}>
          <Feather name="lock" size={11} color="#9C938E" />
          <Text style={styles.secureText}>{t('funds.secure')}</Text>
        </View>
      </View>

      <View style={styles.ledgerHead}>
        <Text style={styles.ledgerHeadLabel}>{t('funds.recentLabel')}</Text>
        {count > 0 ? (
          <Text style={styles.ledgerHeadCount}>
            {count} {count === 1 ? t('funds.person') : t('funds.people')}
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
              <Text style={styles.stateText}>{t('funds.errorBody')}</Text>
            ) : (
              <Text style={styles.stateText}>{t('funds.emptyBody')}</Text>
            )}
          </View>
        }
        ListFooterComponent={
          count > 0 ? (
            <Text style={styles.footerNote}>{t('funds.footer')}</Text>
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
