import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useMutation } from '@tanstack/react-query';

import { searchDonors, DonorMatch } from '@/services/profileService';
import { Avatar } from '@/components/Avatar';
import governorates from '@/data/governorates.json';
import cities from '@/data/cities.json';
import { colors, spacing, radius, fonts, type } from '@/constants/theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function FindDonors() {
  const [bloodGroup, setBloodGroup] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');

  const selectedGov = governorates.find((g) => g.name === governorate);
  const filteredCities = cities.filter((c) => c.governorate_id === selectedGov?.id);

  const search = useMutation<DonorMatch[], Error>({
    mutationFn: () => searchDonors(bloodGroup, governorate, city || null),
  });

  const canSearch = !!bloodGroup && !!governorate && !search.isPending;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find compatible donors</Text>
      <Text style={styles.help}>
        Enter the patient&apos;s blood group. We&apos;ll match donors whose blood is safe to
        donate to them.
      </Text>

      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={bloodGroup}
          onValueChange={setBloodGroup}
          style={styles.picker}
        >
          <Picker.Item label="Patient blood group" value="" />
          {BLOOD_GROUPS.map((g) => (
            <Picker.Item key={g} label={g} value={g} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={governorate}
          onValueChange={(v) => {
            setGovernorate(v);
            setCity('');
          }}
          style={styles.picker}
        >
          <Picker.Item label="Governorate" value="" />
          {governorates.map((g) => (
            <Picker.Item key={g.id} label={g.name} value={g.name} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={city}
          onValueChange={setCity}
          enabled={!!selectedGov}
          style={styles.picker}
        >
          <Picker.Item label="City (optional)" value="" />
          {filteredCities.map((c) => (
            <Picker.Item key={c.id} label={c.name} value={c.name} />
          ))}
        </Picker>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.searchButton,
          !canSearch && { opacity: 0.5 },
          pressed && { opacity: 0.9 },
        ]}
        onPress={() => search.mutate()}
        disabled={!canSearch}
      >
        {search.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.searchButtonText}>Search</Text>
        )}
      </Pressable>

      {search.error && <Text style={styles.error}>{search.error.message}</Text>}

      {search.data && search.data.length === 0 && (
        <Text style={styles.empty}>No matching donors right now.</Text>
      )}

      {search.data && search.data.length > 0 && (
        <FlatList
          data={search.data}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.results}
          renderItem={({ item }) => (
            <View style={styles.donor}>
              <Avatar uri={item.photo_url} size={44} />
              <View style={styles.donorText}>
                <Text style={styles.donorName}>{item.display_name ?? 'Anonymous'}</Text>
                <Text style={styles.donorMeta}>
                  {item.city}, {item.governorate}
                </Text>
              </View>
              <View style={styles.groupPill}>
                <Text style={styles.groupPillText}>{item.blood_group}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
  title: { ...type.h2, color: colors.text },
  help: { ...type.body, color: colors.textMuted, marginBottom: spacing.sm },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  picker: { fontFamily: fonts.regular },
  searchButton: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  searchButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  error: { color: colors.error, fontFamily: fonts.medium, fontSize: 13, marginTop: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, fontFamily: fonts.regular, marginTop: spacing.xl },
  results: { paddingTop: spacing.md, gap: spacing.sm },
  donor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  donorText: { flex: 1 },
  donorName: { ...type.bodyBold, color: colors.text },
  donorMeta: { ...type.small, color: colors.textMuted },
  groupPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  groupPillText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12 },
});
