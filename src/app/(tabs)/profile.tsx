import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';

import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../hooks/useProfile';
import { colors, spacing, radius, fonts, type } from '../../../constants/theme';

export default function Profile() {
  const { session, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile(session?.user.id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const initial = (profile?.display_name ?? session?.user.email ?? '?').slice(0, 1).toUpperCase();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {profile?.photo_url ? (
        <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>
      )}

      <Text style={styles.name}>{profile?.display_name ?? 'Unnamed user'}</Text>
      <Text style={styles.email}>{session?.user.email}</Text>

      <View style={styles.rows}>
        <Row label="Role" value={profile?.role ?? '—'} accent />
        <Row label="Blood group" value={profile?.blood_group ?? '—'} />
        <Row
          label="Location"
          value={
            profile?.governorate
              ? `${profile.city ?? ''}${profile.city ? ', ' : ''}${profile.governorate}`
              : '—'
          }
        />
        <Row label="Searchable" value={profile?.is_searchable ? 'Yes' : 'No'} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.85 }]}
        onPress={signOut}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && { color: colors.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.xl, alignItems: 'center' },
  avatar: { width: 104, height: 104, borderRadius: 52, marginBottom: spacing.lg },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.white, fontFamily: fonts.extrabold, fontSize: 40 },
  name: { ...type.h2, color: colors.text },
  email: { ...type.body, color: colors.textMuted, marginBottom: spacing.lg },
  rows: { alignSelf: 'stretch', marginBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...type.body, color: colors.textMuted },
  rowValue: { ...type.bodyBold, color: colors.text, textTransform: 'capitalize' },
  signOut: {
    alignSelf: 'stretch',
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15 },
});
