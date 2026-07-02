import { View, Text, Image, Button, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../hooks/useProfile';

export default function Profile() {
  const { session, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile(session?.user.id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {profile?.photo_url ? (
        <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>
            {(profile?.display_name ?? session?.user.email ?? '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.name}>{profile?.display_name ?? 'Unnamed user'}</Text>
      <Text style={styles.meta}>{session?.user.email}</Text>

      <View style={styles.rows}>
        <Row label="Role" value={profile?.role ?? '—'} />
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

      <Button title="Sign out" onPress={signOut} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 24, alignItems: 'center', gap: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { backgroundColor: '#8B0000', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: 'white', fontWeight: 'bold', fontSize: 36 },
  name: { fontSize: 20, fontWeight: '600' },
  meta: { color: '#666', marginBottom: 12 },
  rows: { alignSelf: 'stretch', gap: 6, marginTop: 8, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowLabel: { color: '#666' },
  rowValue: { fontWeight: '600', textTransform: 'capitalize' },
});
