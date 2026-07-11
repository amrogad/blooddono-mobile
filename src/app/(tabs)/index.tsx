import { useMemo, useState } from 'react';
import { View, Text, SectionList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { getPendingRequests, PendingRequest } from '@/services/donationService';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { sortByProximity } from '@/utils/proximity';
import { getUrgency, requestDateTime, type SectionKey } from '@/utils/urgency';
import { canDonate } from '@/utils/bloodCompat';
import { spacing, radius, fonts, type } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';
import { BrandHeader } from '@/components/BrandHeader';
import { RequestCard } from '@/components/RequestCard';
import { SkeletonCard } from '@/components/SkeletonCard';

const isCritical = (r: PendingRequest) => {
  const l = getUrgency(r.donation_date, r.donation_time).level;
  return l === 'critical' || l === 'pastdue';
};

export default function Requests() {
  const router = useRouter();
  const { colors, styles } = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: getPendingRequests,
  });

  const [onlyMatches, setOnlyMatches] = useState(false);
  const myGroup = profile?.blood_group as string | undefined;

  const sections = useMemo(() => {
    if (!data) return [];
    let list = sortByProximity(data, profile?.governorate, profile?.city);
    if (onlyMatches && myGroup) list = list.filter((r) => canDonate(myGroup, r.blood_group));

    const buckets: Record<SectionKey, PendingRequest[]> = { today: [], week: [], later: [] };
    for (const r of list) buckets[getUrgency(r.donation_date, r.donation_time).sectionKey].push(r);
    (Object.keys(buckets) as SectionKey[]).forEach((k) =>
      buckets[k].sort(
        (a, b) =>
          requestDateTime(a.donation_date, a.donation_time).getTime() -
          requestDateTime(b.donation_date, b.donation_time).getTime(),
      ),
    );

    const critical = buckets.today.filter(isCritical).length;
    return [
      { key: 'today' as SectionKey, accent: true, criticalCount: critical, data: buckets.today },
      { key: 'week' as SectionKey, accent: false, criticalCount: 0, data: buckets.week },
      { key: 'later' as SectionKey, accent: false, criticalCount: 0, data: buckets.later },
    ].filter((s) => s.data.length > 0);
  }, [data, profile?.governorate, profile?.city, onlyMatches, myGroup]);

  const total = data?.length ?? 0;
  const nearCount = profile?.governorate
    ? (data ?? []).filter((r) => r.recipient_governorate === profile.governorate).length
    : 0;

  const header = (
    <View>
      <BrandHeader
        title={t('requests.title')}
        subtitle={
          total
            ? `${t('requests.subtitleWaiting', { count: total })}${nearCount ? t('requests.subtitleNear', { count: nearCount }) : ''}`
            : t('requests.subtitleEmpty')
        }
      />
      {myGroup ? (
        <View style={styles.filters}>
          <Pressable
            onPress={() => setOnlyMatches((v) => !v)}
            style={[styles.chip, onlyMatches && styles.chipActive]}
            accessibilityRole="switch"
            accessibilityState={{ checked: onlyMatches }}
          >
            <Text style={[styles.chipText, onlyMatches && styles.chipTextActive]}>{t('requests.myMatches', { group: myGroup })}</Text>
          </Pressable>
          {profile?.city ? (
            <View style={styles.cityChip}>
              <Feather name="map-pin" size={12} color={colors.textBody} />
              <Text style={styles.cityChipText}>{profile.city}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

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
          <Text style={styles.emptyTitle}>{t('requests.errorTitle')}</Text>
          <Text style={styles.emptyBody}>{t('requests.errorBody')}</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            {section.accent ? <View style={styles.sectionDot} /> : null}
            <Text style={[styles.sectionTitle, section.accent && styles.sectionTitleAccent]}>
              {t(`urgency.section.${section.key}`)}
            </Text>
            {section.criticalCount ? (
              <Text style={[styles.sectionTitle, styles.sectionMeta]}>· {t('requests.criticalCount', { count: section.criticalCount })}</Text>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <RequestCard
              item={item}
              nearHome={!!profile?.governorate && item.recipient_governorate === profile.governorate}
              onPress={() => router.push({ pathname: '/request/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>{onlyMatches ? t('requests.emptyMatchesTitle') : t('requests.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>
              {onlyMatches ? t('requests.emptyMatchesBody') : t('requests.emptyBody')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, paddingTop: spacing.xxl, gap: spacing.sm },
    emptyTitle: { ...type.h3, color: colors.text },
    emptyBody: { ...type.body, color: colors.textMuted, textAlign: 'center' },
    retryButton: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: radius.control,
    },
    retryText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 14 },
    skeletonList: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
    listContent: { paddingBottom: spacing.xl },
    filters: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    chip: {
      height: 34,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      justifyContent: 'center',
    },
    chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
    chipText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
    chipTextActive: { color: colors.onInk },
    cityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 34,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
    },
    cityChipText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
    sectionTitle: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1, color: colors.textMuted, textTransform: 'uppercase' },
    sectionTitleAccent: { color: colors.primary },
    sectionMeta: { color: colors.primary },
    itemWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  });
