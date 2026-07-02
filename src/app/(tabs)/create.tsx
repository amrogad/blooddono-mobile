import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { createDonationRequest } from '../../../services/donationService';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../hooks/useProfile';
import governorates from '../../../data/governorates.json';
import cities from '../../../data/cities.json';
import { colors, spacing, radius, fonts, type } from '../../../constants/theme';
import { friendlyRequestError } from '../../../utils/errors';

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
    if (!recipientName.trim()) return setError('Recipient name is required.');
    if (!governorate) return setError('Please pick a governorate.');
    if (!city) return setError('Please pick a city.');
    if (!hospitalName.trim()) return setError('Hospital name is required.');
    if (!fullAddress.trim()) return setError('Full address is required.');
    if (!bloodGroup) return setError('Please pick a blood group.');
    if (!message.trim()) return setError('Please add a short message.');
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
      setError(friendlyRequestError((err as Error).message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Post a request</Text>
      <Text style={styles.pageSubtitle}>Reach donors near your hospital</Text>

      <Field label="Recipient name">
        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#aaa"
          value={recipientName}
          onChangeText={setRecipientName}
        />
      </Field>

      <Field label="Governorate">
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
      </Field>

      <Field label="City">
        <View style={styles.pickerWrap}>
          <Picker selectedValue={city} onValueChange={setCity} enabled={!!selectedGov}>
            <Picker.Item label="Select city" value="" />
            {filteredCities.map((c) => (
              <Picker.Item key={c.id} label={c.name} value={c.name} />
            ))}
          </Picker>
        </View>
      </Field>

      <Field label="Hospital">
        <TextInput
          style={styles.input}
          placeholder="Hospital name"
          placeholderTextColor="#aaa"
          value={hospitalName}
          onChangeText={setHospitalName}
        />
      </Field>

      <Field label="Full address">
        <TextInput
          style={styles.input}
          placeholder="Street, area"
          placeholderTextColor="#aaa"
          value={fullAddress}
          onChangeText={setFullAddress}
        />
      </Field>

      <Field label="Blood group">
        <View style={styles.pickerWrap}>
          <Picker selectedValue={bloodGroup} onValueChange={setBloodGroup}>
            <Picker.Item label="Select blood group" value="" />
            {BLOOD_GROUPS.map((g) => (
              <Picker.Item key={g} label={g} value={g} />
            ))}
          </Picker>
        </View>
      </Field>

      <Field label="Date">
        <Pressable style={styles.input} onPress={() => setShowDate(true)}>
          <Text style={styles.inputText}>{fmtDate(date)}</Text>
        </Pressable>
      </Field>
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

      <Field label="Time">
        <Pressable style={styles.input} onPress={() => setShowTime(true)}>
          <Text style={styles.inputText}>{fmtTime(time)}</Text>
        </Pressable>
      </Field>
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

      <Field label="Message">
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Anything donors should know…"
          placeholderTextColor="#aaa"
          value={message}
          onChangeText={setMessage}
          multiline
        />
      </Field>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={({ pressed }) => [
          styles.submit,
          pressed && { opacity: 0.9 },
          submitting && { opacity: 0.6 },
        ]}
        onPress={handleCreate}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Post donation request"
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>Post Request</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md },
  pageTitle: { ...type.h2, color: colors.text },
  pageSubtitle: { ...type.body, color: colors.textMuted, marginBottom: spacing.sm },
  label: { ...type.label, color: colors.textMuted, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    backgroundColor: colors.white,
    color: colors.text,
  },
  inputText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  multiline: { height: 90, textAlignVertical: 'top' },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  error: { color: colors.error, fontFamily: fonts.medium, fontSize: 13 },
  submit: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
});
