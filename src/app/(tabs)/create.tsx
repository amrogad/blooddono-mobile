import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { createDonationRequest } from '@/services/donationService';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import governorates from '@/data/governorates.json';
import cities from '@/data/cities.json';
import { spacing, radius, fonts, type } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';
import { friendlyRequestError } from '@/utils/errors';
import { validateNewRequest } from '@/utils/validation';
import { BLOOD_GROUPS, compatibleDonorsFor } from '@/utils/bloodCompat';
import { formatNeededBy } from '@/utils/urgency';

const WHO_FOR = ['me', 'family', 'other'] as const;
const STEPS = 3;

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtTime = (d: Date) => d.toTimeString().slice(0, 5);

export default function Create() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, styles } = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);

  const [step, setStep] = useState(1);
  const [whoFor, setWhoFor] = useState<string | null>(null);
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

  const selectWhoFor = (w: string) => {
    setWhoFor(w);
    if (w === 'me') setRecipientName(profile?.display_name ?? '');
  };

  const canNext =
    step === 1
      ? !!recipientName.trim() && !!bloodGroup
      : step === 2
        ? !!governorate && !!city && !!hospitalName.trim() && !!fullAddress.trim()
        : true;

  const goBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const goNext = () => {
    setError(null);
    if (step < STEPS) return setStep(step + 1);
    handleCreate();
  };

  const handleCreate = async () => {
    if (!session) return;
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
    <View style={styles.screen}>
      <View style={styles.header}>
        {step > 1 ? (
          <Pressable style={styles.iconBtn} onPress={goBack} accessibilityRole="button" accessibilityLabel={t('create.back')}>
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <Text style={styles.headerTitle}>{t('create.headerTitle')}</Text>
        <Text style={styles.headerStep}>{t('create.stepOf', { step, total: STEPS })}</Text>
      </View>
      <View style={styles.progress}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.progressSeg, i <= step && styles.progressSegOn]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>{t('create.step1Title')}</Text>
            <Text style={styles.stepSub}>{t('create.step1Sub')}</Text>

            <Text style={styles.fieldLabel}>{t('create.whoForLabel')}</Text>
            <View style={styles.chipRow}>
              {WHO_FOR.map((w) => (
                <Pressable
                  key={w}
                  onPress={() => selectWhoFor(w)}
                  style={[styles.whoChip, whoFor === w && styles.whoChipOn]}
                >
                  <Text style={[styles.whoChipText, whoFor === w && styles.whoChipTextOn]}>{t(`create.whoFor.${w}`)}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t('create.patientName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('create.fullNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={recipientName}
              onChangeText={setRecipientName}
            />

            <Text style={styles.fieldLabel}>{t('create.bloodTypeLabel')}</Text>
            <View style={styles.grid}>
              {BLOOD_GROUPS.map((g) => {
                const on = bloodGroup === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => setBloodGroup(g)}
                    style={[styles.tile, on && styles.tileOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.tileText, on && styles.tileTextOn]}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>
            {bloodGroup ? (
              <View style={styles.hint}>
                <Feather name="info" size={14} color={colors.primary} style={{ marginTop: 1 }} />
                <Text style={styles.hintText}>
                  {t('create.compatHint', { group: bloodGroup, donors: compatibleDonorsFor(bloodGroup).join(', ') })}
                </Text>
              </View>
            ) : null}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>{t('create.step2Title')}</Text>
            <Text style={styles.stepSub}>{t('create.step2Sub')}</Text>

            <Text style={styles.fieldLabel}>{t('create.governorate')}</Text>
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

            <Text style={styles.fieldLabel}>{t('create.city')}</Text>
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

            <Text style={styles.fieldLabel}>{t('create.hospital')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('create.hospitalPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={hospitalName}
              onChangeText={setHospitalName}
            />

            <Text style={styles.fieldLabel}>{t('create.fullAddress')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('create.addressPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={fullAddress}
              onChangeText={setFullAddress}
            />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>{t('create.step3Title')}</Text>
            <Text style={styles.stepSub}>{t('create.step3Sub')}</Text>

            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{t('create.date')}</Text>
                <Pressable style={styles.input} onPress={() => setShowDate(true)}>
                  <Text style={styles.inputText}>{formatNeededBy(fmtDate(date), fmtTime(time)).split(',')[0]}</Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{t('create.time')}</Text>
                <Pressable style={styles.input} onPress={() => setShowTime(true)}>
                  <Text style={styles.inputText}>{fmtTime(time)}</Text>
                </Pressable>
              </View>
            </View>
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

            <Text style={styles.fieldLabel}>{t('create.message')}</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder={t('create.messagePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
            />
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.continue,
            (!canNext || submitting) && { opacity: 0.5 },
            pressed && { opacity: 0.9 },
          ]}
          onPress={goNext}
          disabled={!canNext || submitting}
          accessibilityRole="button"
          accessibilityLabel={step < STEPS ? t('create.continue') : t('create.post')}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Text style={styles.continueText}>{step < STEPS ? t('create.continue') : t('create.post')}</Text>
              {step < STEPS ? <Feather name="arrow-right" size={16} color={colors.onPrimary} /> : null}
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: 58,
      paddingBottom: spacing.sm,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.control,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { ...type.title, color: colors.ink },
    headerStep: { ...type.small, color: colors.textMuted, fontFamily: fonts.medium, width: 36, textAlign: 'right' },
    progress: { flexDirection: 'row', gap: 5, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
    progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surface },
    progressSegOn: { backgroundColor: colors.primary },
    body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
    stepTitle: { ...type.h2, color: colors.ink },
    stepSub: { ...type.small, color: colors.textMuted, marginBottom: spacing.md },
    fieldLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink, marginTop: spacing.md, marginBottom: 6 },
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
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    whoChip: {
      height: 38,
      paddingHorizontal: 15,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      justifyContent: 'center',
    },
    whoChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
    whoChipText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textBody },
    whoChipTextOn: { color: colors.onInk },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tile: {
      flexGrow: 1,
      flexBasis: '22%',
      minHeight: 58,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    tileText: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.textBody },
    tileTextOn: { color: colors.onPrimary },
    hint: {
      flexDirection: 'row',
      gap: 8,
      padding: 12,
      marginTop: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.crimsonTint,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    hintText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textBody },
    hintBold: { fontFamily: fonts.semibold, color: colors.ink },
    dateRow: { flexDirection: 'row', gap: spacing.md },
    error: { color: colors.error, fontFamily: fonts.medium, fontSize: 13, marginTop: spacing.md },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    continue: {
      height: 50,
      borderRadius: radius.card,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    continueText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 15 },
  });
