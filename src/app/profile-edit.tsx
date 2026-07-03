import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Stack, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { updateProfile } from '@/services/profileService';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import governorates from '@/data/governorates.json';
import cities from '@/data/cities.json';
import { colors, spacing, radius, fonts, type } from '@/constants/theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfileEdit() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile, isLoading } = useProfile(session?.user.id);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bloodGroup, setBloodGroup] = useState(profile?.blood_group ?? '');
  const [governorate, setGovernorate] = useState(profile?.governorate ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [searchable, setSearchable] = useState(profile?.is_searchable ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedGov = governorates.find((g) => g.name === governorate);
  const filteredCities = cities.filter((c) => c.governorate_id === selectedGov?.id);

  const handleSave = async () => {
    if (!session) return;
    setError(null);
    setSaving(true);
    try {
      await updateProfile(session.user.id, {
        display_name: displayName.trim(),
        blood_group: bloodGroup || undefined,
        governorate: governorate || undefined,
        city: city || undefined,
        is_searchable: searchable,
      });
      await queryClient.invalidateQueries({ queryKey: ['profile', session.user.id] });
      router.back();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Edit profile' }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Edit profile' }} />

      <Text style={styles.label}>Display name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Blood group</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={bloodGroup} onValueChange={setBloodGroup}>
          <Picker.Item label="Select blood group" value="" />
          {BLOOD_GROUPS.map((g) => (
            <Picker.Item key={g} label={g} value={g} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Governorate</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={governorate}
          onValueChange={(v) => {
            setGovernorate(v);
            setCity('');
          }}
        >
          <Picker.Item label="Select governorate" value="" />
          {governorates.map((g) => (
            <Picker.Item key={g.id} label={g.name} value={g.name} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>City</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={city} onValueChange={setCity} enabled={!!selectedGov}>
          <Picker.Item label="Select city" value="" />
          {filteredCities.map((c) => (
            <Picker.Item key={c.id} label={c.name} value={c.name} />
          ))}
        </Picker>
      </View>

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Searchable by others</Text>
          <Text style={styles.switchHint}>Let people find you in donor search</Text>
        </View>
        <Switch
          value={searchable}
          onValueChange={setSearchable}
          trackColor={{ true: colors.accent }}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={({ pressed }) => [styles.save, pressed && { opacity: 0.9 }, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel="Save profile"
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveText}>Save</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { padding: spacing.xl, gap: spacing.sm },
  label: { ...type.label, color: colors.textMuted, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    backgroundColor: colors.white,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  switchLabel: { ...type.bodyBold, color: colors.text },
  switchHint: { ...type.small, color: colors.textMuted },
  error: { color: colors.error, fontFamily: fonts.medium, fontSize: 13, marginTop: spacing.sm },
  save: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
});
