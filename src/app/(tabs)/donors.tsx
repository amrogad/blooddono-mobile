import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { searchDonors, DonorMatch } from '@/services/profileService';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/Avatar';
import { BloodRoundel } from '@/components/BloodRoundel';
import { BLOOD_GROUPS, compatibleDonorsFor } from '@/utils/bloodCompat';
import governorates from '@/data/governorates.json';
import cities from '@/data/cities.json';
import { colors, spacing, radius, fonts, type } from '@/constants/theme';

export default function FindDonors() {
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);

  const [bloodGroup, setBloodGroup] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    if (profile?.governorate && !governorate) setGovernorate(profile.governorate);
  }, [profile?.governorate, governorate]);

  const selectedGov = governorates.find((g) => g.name === governorate);
  const filteredCities = cities.filter((c) => c.governorate_id === selectedGov?.id);
  const enabled = !!bloodGroup && !!governorate;

  const { data, isFetching, error } = useQuery({
    queryKey: ['donors', bloodGroup, governorate, city],
    queryFn: () => searchDonors(bloodGroup, governorate, city || null),
    enabled,
    placeholderData: keepPreviousData,
  });

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Find donors</Text>
      <Text style={styles.subtitle}>Pick the patient&apos;s blood group — results update live</Text>

      <View style={styles.roundelRow}>
        {BLOOD_GROUPS.map((g) => {
          const on = bloodGroup === g;
          return (
            <Pressable
              key={g}
              onPress={() => setBloodGroup(on ? '' : g)}
              style={[styles.rTile, on && styles.rTileOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.rTileText, on && styles.rTileTextOn]}>{g}</Text>
            </Pressable>
          );
        })}
      </View>

      {bloodGroup ? (
        <View style={styles.strip}>
          <BloodRoundel group={bloodGroup} size={30} variant="tint" />
          <Text style={styles.stripText}>
            Safe for a {bloodGroup} patient:{' '}
            <Text style={styles.stripBold}>{compatibleDonorsFor(bloodGroup).join(', ')}</Text>
          </Text>
        </View>
      ) : null}

      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={governorate}
          onValueChange={(v) => {
            setGovernorate(v);
            setCity('');
          }}
        >
          <Picker.Item label="Governorate" value="" />
          {governorates.map((g) => (
            <Picker.Item key={g.id} label={g.name} value={g.name} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={city} onValueChange={setCity} enabled={!!selectedGov}>
          <Picker.Item label="Any city" value="" />
          {filteredCities.map((c) => (
            <Picker.Item key={c.id} label={c.name} value={c.name} />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={enabled ? (data ?? []) : []}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.donor}>
            <Avatar uri={item.photo_url} size={44} />
            <View style={styles.donorText}>
              <Text style={styles.donorName} numberOfLines={1}>
                {item.display_name ?? 'Anonymous'}
              </Text>
              <Text style={styles.donorMeta} numberOfLines={1}>
                {item.city}, {item.governorate}
              </Text>
            </View>
            <BloodRoundel group={item.blood_group} size={38} variant="tint" />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.state}>
            {!enabled ? (
              <Text style={styles.stateText}>Pick a blood group and area to see matching donors.</Text>
            ) : isFetching ? (
              <ActivityIndicator color={colors.accent} />
            ) : error ? (
              <Text style={styles.stateText}>{(error as Error).message}</Text>
            ) : (
              <Text style={styles.stateText}>No matching donors in this area yet.</Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: spacing.xl },
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, gap: spacing.sm },
  title: { ...type.h1, color: colors.ink },
  subtitle: { ...type.small, color: colors.textMuted },
  roundelRow: { flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  rTile: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rTileOn: { backgroundColor: colors.primary },
  rTileText: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.textBody },
  rTileTextOn: { color: colors.white },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.crimsonTint,
  },
  stripText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.textBody },
  stripBold: { fontFamily: fonts.semibold, color: colors.ink },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  donor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.white,
  },
  donorText: { flex: 1, minWidth: 0 },
  donorName: { ...type.bodyBold, color: colors.ink },
  donorMeta: { ...type.small, color: colors.textMuted },
  state: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  stateText: { ...type.body, color: colors.textMuted, textAlign: 'center' },
});
