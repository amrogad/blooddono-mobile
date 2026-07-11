import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { spacing, radius, fonts, type, shadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';
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
  const { colors, styles } = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const urgency = getUrgency(item.donation_date, item.donation_time);
  const critical = urgency.level === 'critical' || urgency.level === 'pastdue';
  const variant = critical ? 'solid' : urgency.level === 'urgent' ? 'tint' : 'muted';

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('card.openRequestA11y', { name: item.recipient_name, group: item.blood_group })}
      >
        <View style={styles.topRow}>
          <BloodRoundel group={item.blood_group} variant={variant} />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.recipient_name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {nearHome
                ? t('card.cityNear', { city: item.recipient_city })
                : t('card.cityGov', { city: item.recipient_city, gov: item.recipient_governorate })}
            </Text>
          </View>
          <UrgencyPill level={urgency.level} />
        </View>
        <Text style={[styles.needed, { color: critical ? colors.primary : colors.ink }]}>
          {t('card.needed', { when: formatNeededBy(item.donation_date, item.donation_time) })}
        </Text>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.donate, pressed && styles.pressed]}
          onPress={onDonate ?? onPress}
          accessibilityRole="button"
          accessibilityLabel={t('card.canDonate')}
        >
          <Text style={styles.donateText}>{t('card.canDonate')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.chevron, pressed && styles.pressed]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={t('card.viewDetails')}
        >
          <Feather name="chevron-right" size={18} color={colors.textBody} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
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
    donateText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 13 },
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
