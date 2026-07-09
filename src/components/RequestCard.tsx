import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, spacing, radius, fonts, type, shadow } from '@/constants/theme';
import { BloodRoundel } from '@/components/BloodRoundel';
import { UrgencyPill } from '@/components/Pills';
import { getUrgency, formatNeededBy } from '@/utils/urgency';
import type { PendingRequest } from '@/services/donationService';

type Props = {
  item: PendingRequest;
  nearHome?: boolean;
  onPress: () => void;
  onDonate?: () => void;
};

export function RequestCard({ item, nearHome, onPress, onDonate }: Props) {
  const urgency = getUrgency(item.donation_date, item.donation_time);
  const critical = urgency.level === 'critical' || urgency.level === 'pastdue';
  const variant = critical ? 'solid' : urgency.level === 'urgent' ? 'tint' : 'muted';

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open request for ${item.recipient_name}, blood group ${item.blood_group}`}
      >
        <View style={styles.topRow}>
          <BloodRoundel group={item.blood_group} variant={variant} />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.recipient_name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.recipient_city}
              {nearHome ? ' · near you' : `, ${item.recipient_governorate}`}
            </Text>
          </View>
          <UrgencyPill level={urgency.level} />
        </View>
        <Text style={[styles.needed, { color: critical ? colors.primary : colors.ink }]}>
          Needed {formatNeededBy(item.donation_date, item.donation_time)}
        </Text>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.donate, pressed && styles.pressed]}
          onPress={onDonate ?? onPress}
          accessibilityRole="button"
          accessibilityLabel="I can donate"
        >
          <Text style={styles.donateText}>I can donate</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.chevron, pressed && styles.pressed]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="View details"
        >
          <Feather name="chevron-right" size={18} color={colors.textBody} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    ...shadow.card,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  info: { flex: 1, minWidth: 0 },
  name: { ...type.title, color: colors.ink },
  meta: { ...type.small, color: colors.textMuted, marginTop: 1 },
  needed: { fontFamily: fonts.semibold, fontSize: 12.5, marginTop: 11 },
  actions: { flexDirection: 'row', gap: 7, marginTop: 11 },
  donate: {
    flex: 1,
    height: 42,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
  chevron: {
    width: 42,
    height: 42,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
