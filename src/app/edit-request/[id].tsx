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
import { useTranslation } from 'react-i18next';

import {
  getRequestDetails,
  updateDonationRequest,
  RequestDetails,
} from '@/services/donationService';
import governorates from '@/data/governorates.json';
import cities from '@/data/cities.json';
import { spacing, radius, fonts, type } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';
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
  const { colors, styles } = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getRequestDetails(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t('nav.editRequest') }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t('nav.editRequest') }} />
        <Text style={styles.bodyText}>{t('editRequest.notFound')}</Text>
      </View>
    );
  }

  return <EditForm id={id!} initial={data} />;
}

function EditForm({ id, initial }: { id: string; initial: RequestDetails }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, styles } = useThemedStyles(makeStyles);
  const { t } = useTranslation();

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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: t('nav.editRequest') }} />
      <Text style={styles.pageTitle}>{t('editRequest.title')}</Text>
      <Text style={styles.pageSubtitle}>{t('editRequest.subtitle')}</Text>

      <Field label={t('editRequest.recipientName')}>
        <TextInput
          style={styles.input}
          placeholder={t('create.fullNamePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={recipientName}
          onChangeText={setRecipientName}
        />
      </Field>

      <Field label={t('create.governorate')}>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={governorate}
            onValueChange={(v) => {
              setGovernorate(v);
              setCity('');
            }}
            dropdownIconColor={colors.textMuted}
            style={{ color: colors.ink }}
          >
            <Picker.Item label={t('create.selectGovernorate')} value="" />
            {governorates.map((g) => (
              <Picker.Item key={g.id} label={g.name} value={g.name} />
            ))}
          </Picker>
        </View>
      </Field>

      <Field label={t('create.city')}>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={city}
            onValueChange={setCity}
            enabled={!!selectedGov}
            dropdownIconColor={colors.textMuted}
            style={{ color: colors.ink }}
          >
            <Picker.Item label={t('create.selectCity')} value="" />
            {filteredCities.map((c) => (
              <Picker.Item key={c.id} label={c.name} value={c.name} />
            ))}
          </Picker>
        </View>
      </Field>

      <Field label={t('create.hospital')}>
        <TextInput
          style={styles.input}
          placeholder={t('editRequest.hospitalPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={hospitalName}
          onChangeText={setHospitalName}
        />
      </Field>

      <Field label={t('create.fullAddress')}>
        <TextInput
          style={styles.input}
          placeholder={t('editRequest.addressPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={fullAddress}
          onChangeText={setFullAddress}
        />
      </Field>

      <Field label={t('editRequest.bloodGroup')}>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={bloodGroup}
            onValueChange={setBloodGroup}
            dropdownIconColor={colors.textMuted}
            style={{ color: colors.ink }}
          >
            <Picker.Item label={t('editRequest.selectBloodGroup')} value="" />
            {BLOOD_GROUPS.map((g) => (
              <Picker.Item key={g} label={g} value={g} />
            ))}
          </Picker>
        </View>
      </Field>

      <Field label={t('create.date')}>
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

      <Field label={t('create.time')}>
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

      <Field label={t('create.message')}>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder={t('create.messagePlaceholder')}
          placeholderTextColor={colors.textMuted}
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
        accessibilityLabel={t('editRequest.save')}
      >
        {saving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.submitText}>{t('editRequest.save')}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { styles } = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    bodyText: { ...type.body, color: colors.ink },
    screen: { backgroundColor: colors.background },
    container: { padding: spacing.xl, gap: spacing.md },
    pageTitle: { ...type.h2, color: colors.ink },
    pageSubtitle: { ...type.small, color: colors.textMuted, marginBottom: spacing.sm },
    field: { gap: 6 },
    fieldLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },
    input: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 13,
      paddingHorizontal: 15,
      height: 48,
      justifyContent: 'center',
      fontFamily: fonts.regular,
      fontSize: 15,
      backgroundColor: colors.card,
      color: colors.ink,
    },
    inputText: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
    multiline: { height: 96, paddingVertical: 12, textAlignVertical: 'top' },
    pickerWrap: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 13,
      overflow: 'hidden',
      backgroundColor: colors.card,
    },
    error: { color: colors.error, fontFamily: fonts.medium, fontSize: 13 },
    submit: {
      height: 52,
      borderRadius: radius.card,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
    },
    submitText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 16 },
  });
