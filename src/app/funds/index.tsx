import { memo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { getFunds, Fund } from '@/services/fundService';
import { colors, spacing, radius, fonts, type, shadow } from '@/constants/theme';
import { BrandHeader } from '@/components/BrandHeader';
import { SkeletonCard } from '@/components/SkeletonCard';

const FundCard = memo(function FundCard({ item }: { item: Fund }) {
  const date = new Date(item.paid_at);
  return (
    <View style={styles.card}>
      <View style={styles.accentStripe} />
      <View style={styles.cardBody}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.amount}>{Number(item.amount).toLocaleString()} EGP</Text>
        <Text style={styles.date}>
          {date.toLocaleDateString('en-GB')} · {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
});

export default function Funds() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['funds'],
    queryFn: getFunds,
  });

  const total = data?.reduce((sum, f) => sum + Number(f.amount), 0) ?? 0;

  const listHeader = (
    <>
      <BrandHeader title="Funding" subtitle="community support" />
      <View style={styles.subHeader}>
        <View>
          <Text style={styles.totalLabel}>Total raised</Text>
          <Text style={styles.totalAmount}>{total.toLocaleString()} EGP</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.donateButton, pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/funds/payment')}
          accessibilityRole="button"
          accessibilityLabel="Donate funds"
        >
          <Text style={styles.donateButtonText}>Donate</Text>
        </Pressable>
      </View>
    </>
  );

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {listHeader}
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
        {listHeader}
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Couldn&apos;t load records</Text>
          <Text style={styles.emptyBody}>Check your connection and try again.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry"
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
        {listHeader}
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No donations yet</Text>
          <Text style={styles.emptyBody}>Be the first to support the cause.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        initialNumToRender={10}
        renderItem={({ item }) => <FundCard item={item} />}
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
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  totalLabel: { ...type.label, color: colors.textMuted, textTransform: 'uppercase' },
  totalAmount: { ...type.h3, color: colors.text, marginTop: 2 },
  donateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  donateButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  accentStripe: { width: 5, backgroundColor: colors.primary },
  cardBody: { flex: 1, padding: spacing.lg, gap: 4 },
  name: { ...type.h3, color: colors.text },
  amount: { ...type.bodyBold, color: colors.primary, marginTop: 2 },
  date: { ...type.small, color: colors.textMuted, marginTop: 2 },
});
