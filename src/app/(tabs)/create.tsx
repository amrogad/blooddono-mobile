import { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { createDonationRequest } from '../../../services/donationService';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../hooks/useProfile';
import governorates from '../../../data/governorates.json';
import cities from '../../../data/cities.json';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtTime = (d: Date) => d.toTimeString().slice(0, 5);

export default function Create() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);

  const [recipientName, setRecipientName] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedGov = governorates.find((g) => g.name === governorate);
  const filteredCities = cities.filter((c) => c.governorate_id === selectedGov?.id);

  const handleCreate = async () => {
    if (!session) return;
    setError(null);
    setSubmitting(true);
    try {
      await createDonationRequest({
        requester_id: session.user.id,
        requester_name: profile?.display_name ?? '',
        requester_email: session.user.email ?? '',
        recipient_name: recipientName,
        recipient_governorate: governorate,
        recipient_city: city,
        hospital_name: hospitalName,
        full_address: fullAddress,
        blood_group: bloodGroup,
        donation_date: fmtDate(date),
        donation_time: fmtTime(time),
        request_message: message,
      });
      await queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Recipient name"
        value={recipientName}
        onChangeText={setRecipientName}
      />

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

      <View style={styles.pickerWrap}>
        <Picker selectedValue={city} onValueChange={setCity} enabled={!!selectedGov}>
          <Picker.Item label="Select city" value="" />
          {filteredCities.map((c) => (
            <Picker.Item key={c.id} label={c.name} value={c.name} />
          ))}
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Hospital name"
        value={hospitalName}
        onChangeText={setHospitalName}
      />
      <TextInput
        style={styles.input}
        placeholder="Full address"
        value={fullAddress}
        onChangeText={setFullAddress}
      />

      <View style={styles.pickerWrap}>
        <Picker selectedValue={bloodGroup} onValueChange={setBloodGroup}>
          <Picker.Item label="Select blood group" value="" />
          {BLOOD_GROUPS.map((g) => (
            <Picker.Item key={g} label={g} value={g} />
          ))}
        </Picker>
      </View>

      <Pressable style={styles.input} onPress={() => setShowDate(true)}>
        <Text>Date: {fmtDate(date)}</Text>
      </Pressable>
      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(_, d) => {
            setShowDate(false);
            if (d) setDate(d);
          }}
        />
      )}

      <Pressable style={styles.input} onPress={() => setShowTime(true)}>
        <Text>Time: {fmtTime(time)}</Text>
      </Pressable>
      {showTime && (
        <DateTimePicker
          value={time}
          mode="time"
          onChange={(_, t) => {
            setShowTime(false);
            if (t) setTime(t);
          }}
        />
      )}

      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        multiline
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title={submitting ? 'Posting…' : 'Post Request'}
        onPress={handleCreate}
        disabled={submitting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  multiline: { height: 80, textAlignVertical: 'top' },
  pickerWrap: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  error: { color: 'red' },
});
