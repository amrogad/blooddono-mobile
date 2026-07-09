import { View, Text, Pressable, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/Avatar';
import { colors, spacing, radius, fonts, type } from '@/constants/theme';

export default function Profile() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile(session?.user.id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const location = profile?.governorate
    ? `${profile.city ? `${profile.city}, ` : ''}${profile.governorate}`
    : '—';

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar uri={profile?.photo_url} size={62} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.display_name ?? 'Unnamed user'}
          </Text>
          <View style={styles.headerMeta}>
            {profile?.blood_group ? (
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText}>{profile.blood_group}</Text>
              </View>
            ) : null}
            {profile?.role ? <Text style={styles.role}>{profile.role}</Text> : null}
          </View>
        </View>
        <Pressable
          style={styles.editIcon}
          onPress={() => router.push('/profile-edit')}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <Feather name="edit-2" size={15} color={colors.textBody} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <InfoRow icon="mail" label="Email" value={session?.user.email ?? '—'} />
        <InfoRow icon="map-pin" label="Location" value={location} divider />
        <InfoRow
          icon="search"
          label="Visible in donor search"
          value={profile?.is_searchable ? 'On' : 'Off'}
          divider
        />
      </View>

      <View style={styles.card}>
        <ActionRow icon="clock" label="My requests" onPress={() => router.push('/my-requests')} />
        <ActionRow icon="edit-3" label="Edit profile" onPress={() => router.push('/profile-edit')} divider />
        <ActionRow icon="heart" label="Community fund" onPress={() => router.push('/funds')} divider />
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.85 }]}
        onPress={signOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  divider,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <View style={[styles.infoRow, divider && styles.divider]}>
      <Feather name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  divider,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  divider?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, divider && styles.divider, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icon} size={16} color={colors.textBody} />
      <Text style={styles.actionLabel}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingTop: 64, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, letterSpacing: -0.3 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  groupBadge: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 2.5 },
  groupBadgeText: { fontFamily: fonts.displayBold, fontSize: 12, color: colors.white },
  role: { ...type.small, color: colors.textMuted, textTransform: 'capitalize' },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.control,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14 },
  infoLabel: { ...type.body, color: colors.textBody, flex: 1 },
  infoValue: { ...type.bodyBold, color: colors.ink, maxWidth: '55%' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 15 },
  actionLabel: { ...type.body, color: colors.ink, flex: 1, fontFamily: fonts.medium },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  signOut: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.card,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  signOutText: { color: colors.textBody, fontFamily: fonts.semibold, fontSize: 15 },
});
