import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { spacing, radius, fonts, type, shadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';
import { BloodRoundel } from '@/components/BloodRoundel';
import { UrgencyPill } from '@/components/Pills';
import { getUrgency, formatNeededBy } from '@/utils/urgency';
import { createDonationRequest, type RequestDraft } from '@/services/donationService';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';

type Props = {
  draft: RequestDraft;
  postedId?: string;
  onPosted: (id: string) => void;
  onDiscard: () => void;
};

// The model proposes; this posts. The insert runs from the app with the user's
// own session, so it lands under the same policy as the form: requester_id must
// be auth.uid(). The edge function never gets write access.
//
// Whether it has been posted lives in the message list rather than here, because
// this renders inside a FlatList row that can be recycled — local state would
// come back offering to post the same request again.
export function RequestDraftCard({ draft, postedId, onPosted, onDiscard }: Props) {
  const { colors, styles } = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const urgency = getUrgency(draft.donation_date, draft.donation_time);
  const critical = urgency.level === 'critical' || urgency.level === 'pastdue';

  // The profile query can still be in flight just after sign-in. Posting then
  // would put an empty requester_name on the row, which is the name donors see,
  // so the button waits rather than falling back to a blank.
  const requesterName = profile?.display_name ?? '';
  const ready = Boolean(session && requesterName);

  const confirm = async () => {
    if (saving || postedId || !ready) return;
    setSaving(true);
    setFailed(false);
    try {
      const row = await createDonationRequest({
        ...draft,
        requester_id: session!.user.id,
        requester_name: requesterName,
        requester_email: session!.user.email ?? '',
      });
      onPosted(row.id);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {postedId ? t('draft.postedLabel') : t('draft.reviewLabel')}
      </Text>

      <View style={styles.topRow}>
        <BloodRoundel group={draft.blood_group} variant={critical ? 'solid' : 'tint'} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {draft.recipient_name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {t('card.cityGov', {
              city: draft.recipient_city,
              gov: draft.recipient_governorate,
            })}
          </Text>
        </View>
        <UrgencyPill level={urgency.level} />
      </View>

      <View style={styles.details}>
        <Text style={styles.detailLabel}>{t('draft.neededBy')}</Text>
        <Text style={styles.detailValue}>
          {formatNeededBy(draft.donation_date, draft.donation_time)}
        </Text>
        <Text style={[styles.detailLabel, styles.detailGap]}>{t('draft.hospital')}</Text>
        <Text style={styles.detailValue} numberOfLines={2}>
          {draft.hospital_name}, {draft.full_address}
        </Text>
      </View>

      <Text style={styles.message} numberOfLines={4}>
        {draft.request_message}
      </Text>

      {postedId ? (
        <View style={styles.postedRow}>
          <Feather name="check-circle" size={15} color={colors.success} />
          <Text style={styles.postedText}>{t('draft.posted')}</Text>
          <Pressable
            onPress={() => router.push(`/request/${postedId}`)}
            accessibilityRole="button"
            accessibilityLabel={t('draft.view')}
          >
            <Text style={styles.viewText}>{t('draft.view')}</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          {failed && <Text style={styles.failed}>{t('draft.failed')}</Text>}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
              onPress={confirm}
              disabled={saving || !ready}
              accessibilityRole="button"
              accessibilityLabel={t('draft.confirm')}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <Feather name="check" size={15} color={colors.onPrimary} />
                  <Text style={styles.confirmText}>{t('draft.confirm')}</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              onPress={() => router.push({ pathname: '/create', params: { ...draft } })}
              accessibilityRole="button"
              accessibilityLabel={t('draft.edit')}
            >
              <Feather name="edit-2" size={15} color={colors.textMuted} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              onPress={onDiscard}
              accessibilityRole="button"
              accessibilityLabel={t('draft.discard')}
            >
              <Feather name="x" size={15} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      alignSelf: 'stretch',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
      ...shadow.card,
    },
    label: {
      ...type.small,
      color: colors.textMuted,
      fontFamily: fonts.bold,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    info: { flex: 1, minWidth: 0 },
    name: { ...type.body, fontFamily: fonts.bold, color: colors.ink },
    meta: { ...type.small, color: colors.textMuted, marginTop: 1 },
    details: {
      backgroundColor: colors.surface,
      borderRadius: radius.control,
      padding: spacing.sm,
    },
    detailLabel: {
      ...type.small,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    detailGap: { marginTop: spacing.sm },
    detailValue: { ...type.body, fontFamily: fonts.bold, color: colors.ink, marginTop: 1 },
    message: { ...type.small, color: colors.textBody, lineHeight: 19 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    confirm: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      height: 40,
      borderRadius: radius.control,
      backgroundColor: colors.primary,
    },
    confirmText: { ...type.body, fontFamily: fonts.bold, color: colors.onPrimary },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.75 },
    failed: { ...type.small, color: colors.error, marginBottom: spacing.xs },
    postedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    postedText: { ...type.small, flex: 1, color: colors.ink, fontFamily: fonts.bold },
    viewText: { ...type.small, color: colors.primary, fontFamily: fonts.bold },
  });
