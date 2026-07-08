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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getRequestDetails,
  updateDonationRequest,
  RequestDetails,
} from '@/services/donationService';
import governorates from '@/data/governorates.json';
import cities from '@/data/cities.json';
import { colors, spacing, radius, fonts, type } from '@/constants/theme';
import { friendlyRequestError } from '@/utils/errors';
import { validateNewRequest } from '@/utils/validation';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtTime = (d: Date) => d.toTimeString().slice(0, 5);
const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const parseTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

export default function EditRequest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getRequestDetails(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Edit request' }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Edit request' }} />
        <Text style={type.body}>Request not found.</Text>
      </View>
    );
  }

  return <EditForm id={id!} initial={data} />;
}

function EditForm({ id, initial }: { id: string; initial: RequestDetails }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [recipientName, setRecipientName] = useState(initial.recipient_name);
  const [governorate, setGovernorate] = useState(initial.recipient_governorate);
  const [city, setCity] = useState(initial.recipient_city);
  const [hospitalName, setHospitalName] = useState(initial.hospital_name);
  const [fullAddress, setFullAddress] = useState(initial.full_address);
  const [bloodGroup, setBloodGroup] = useState(initial.blood_group);
  const [date, setDate] = useState(parseDate(initial.donation_date));
  const [time, setTime] = useState(parseTime(initial.donation_time));
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [message, setMessage] = useState(initial.request_message);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedGov = governorates.find((g) => g.name === governorate);
  const filteredCities = cities.filter((c) => c.governorate_id === selectedGov?.id);

  const handleSave = async () => {
    setError(null);
    const validationError = validateNewRequest({
      recipientName,
      governorate,
      city,
      hospitalName,
      fullAddress,
      bloodGroup,
      message,
    });
    if (validationError) return setError(validationError);
    setSaving(true);
    try {
      await updateDonationRequest(id, {
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
      await queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      await queryClient.invalidateQueries({ queryKey: ['request', id] });
      router.back();
    } catch (err) {
      setError(friendlyRequestError((err as Error).message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Edit request' }} />
      <Text style={styles.pageTitle}>Edit request</Text>
      <Text style={styles.pageSubtitle}>Update the details donors will see</Text>

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
          saving && { opacity: 0.6 },
        ]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel="Save changes"
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>Save changes</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
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
