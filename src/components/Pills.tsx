import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import type { UrgencyLevel } from '@/utils/urgency';
import type { DonationStatus } from '@/services/donationService';

function Pill({
  bg,
  fg,
  label,
  dot,
  strike,
}: {
  bg: string;
  fg: string;
  label: string;
  dot?: boolean;
  strike?: boolean;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: fg }]} /> : null}
      <Text style={[styles.text, { color: fg }, strike && styles.strike]}>{label}</Text>
    </View>
  );
}

export function UrgencyPill({ level }: { level: UrgencyLevel }) {
  if (level === 'critical' || level === 'pastdue') {
    return <Pill bg={colors.primary} fg={colors.white} dot label={level === 'pastdue' ? 'OVERDUE' : 'CRITICAL'} />;
  }
  if (level === 'urgent') return <Pill bg={colors.warningTint} fg={colors.warning} label="URGENT" />;
  return <Pill bg={colors.surface} fg={colors.textMuted} label="PLANNED" />;
}

const STATUS: Record<DonationStatus, { bg: string; fg: string; label: string; strike?: boolean }> = {
  pending: { bg: colors.warningTint, fg: colors.warning, label: 'Searching donors' },
  inprogress: { bg: colors.infoTint, fg: colors.info, label: 'Donor matched' },
  done: { bg: colors.successTint, fg: colors.success, label: 'Completed' },
  canceled: { bg: colors.surface, fg: colors.textMuted, label: 'Cancelled', strike: true },
};

export function StatusPill({ status }: { status: DonationStatus }) {
  const s = STATUS[status];
  return <Pill bg={s.bg} fg={s.fg} label={s.label} strike={s.strike} />;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 0.3 },
  strike: { textDecorationLine: 'line-through' },
});
