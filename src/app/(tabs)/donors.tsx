import { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Button,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useMutation } from '@tanstack/react-query';

import { searchDonors, DonorMatch } from '../../../services/profileService';
import governorates from '../../../data/governorates.json';
import cities from '../../../data/cities.json';

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
        Enter the patient&apos;s blood group — we&apos;ll match donors whose blood is safe to
        donate to them.
      </Text>

      <View style={styles.pickerWrap}>
        <Picker selectedValue={bloodGroup} onValueChange={setBloodGroup}>
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
        >
          <Picker.Item label="Governorate" value="" />
          {governorates.map((g) => (
            <Picker.Item key={g.id} label={g.name} value={g.name} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerWrap}>
        <Picker selectedValue={city} onValueChange={setCity} enabled={!!selectedGov}>
          <Picker.Item label="City (optional)" value="" />
          {filteredCities.map((c) => (
            <Picker.Item key={c.id} label={c.name} value={c.name} />
          ))}
        </Picker>
      </View>

      <Button title="Search" onPress={() => search.mutate()} disabled={!canSearch} />

      {search.isPending && (
        <View style={styles.status}>
          <ActivityIndicator />
        </View>
      )}
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
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarLetter}>
                    {(item.display_name ?? '?').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.donorText}>
                <Text style={styles.donorName}>{item.display_name ?? 'Anonymous'}</Text>
                <Text style={styles.donorMeta}>
                  {item.blood_group} · {item.city}, {item.governorate}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: 'bold' },
  help: { color: '#666' },
  pickerWrap: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  status: { marginTop: 8 },
  error: { color: 'red' },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
  results: { paddingTop: 12, gap: 10 },
  donor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { backgroundColor: '#8B0000', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  donorText: { flex: 1 },
  donorName: { fontSize: 16, fontWeight: '600' },
  donorMeta: { color: '#666' },
});
