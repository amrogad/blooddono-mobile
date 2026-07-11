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
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { updateProfile, uploadAvatar } from '@/services/profileService';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/Avatar';
import governorates from '@/data/governorates.json';
import cities from '@/data/cities.json';
import { spacing, radius, fonts, type } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfileEdit() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile, isLoading } = useProfile(session?.user.id);
  const { colors, styles } = useThemedStyles(makeStyles);
  const { t } = useTranslation();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bloodGroup, setBloodGroup] = useState(profile?.blood_group ?? '');
  const [governorate, setGovernorate] = useState(profile?.governorate ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [searchable, setSearchable] = useState(profile?.is_searchable ?? false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedGov = governorates.find((g) => g.name === governorate);
  const filteredCities = cities.filter((c) => c.governorate_id === selectedGov?.id);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('profileEdit.permTitle'), t('profileEdit.permBody'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!session) return;
    setError(null);
    setSaving(true);
    try {
      const photo_url = photoUri ? await uploadAvatar(session.user.id, photoUri) : undefined;
      await updateProfile(session.user.id, {
        display_name: displayName.trim(),
        blood_group: bloodGroup || undefined,
        governorate: governorate || undefined,
        city: city || undefined,
        is_searchable: searchable,
        ...(photo_url ? { photo_url } : {}),
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
        <Stack.Screen options={{ title: t('nav.editProfile') }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: t('nav.editProfile') }} />

      <View style={styles.avatarSection}>
        <Avatar uri={photoUri ?? profile?.photo_url} size={96} />
        <Pressable onPress={pickImage} hitSlop={8}>
          <Text style={styles.changePhoto}>{t('profileEdit.changePhoto')}</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>{t('profileEdit.displayName')}</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={t('profileEdit.namePlaceholder')}
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.fieldLabel}>{t('profileEdit.bloodGroup')}</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={bloodGroup}
          onValueChange={setBloodGroup}
          dropdownIconColor={colors.textMuted}
          style={{ color: colors.ink }}
        >
          <Picker.Item label={t('profileEdit.selectBloodGroup')} value="" />
          {BLOOD_GROUPS.map((g) => (
            <Picker.Item key={g} label={g} value={g} />
          ))}
        </Picker>
      </View>

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

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>{t('profileEdit.searchable')}</Text>
          <Text style={styles.switchHint}>{t('profileEdit.searchableHint')}</Text>
        </View>
        <Switch
          value={searchable}
          onValueChange={setSearchable}
          trackColor={{ false: colors.borderStrong, true: colors.primary }}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={({ pressed }) => [styles.save, pressed && { opacity: 0.9 }, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={t('profileEdit.saveA11y')}
      >
        {saving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.saveText}>{t('common.save')}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    screen: { backgroundColor: colors.background },
    container: { padding: spacing.xl, gap: spacing.sm },
    avatarSection: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    changePhoto: { ...type.bodyBold, color: colors.primary },
    fieldLabel: {
      fontFamily: fonts.semibold,
      fontSize: 12.5,
      color: colors.ink,
      marginTop: spacing.md,
      marginBottom: 6,
    },
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
    pickerWrap: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 13,
      overflow: 'hidden',
      backgroundColor: colors.card,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      gap: spacing.md,
    },
    switchLabel: { ...type.bodyBold, color: colors.ink },
    switchHint: { ...type.small, color: colors.textMuted },
    error: { color: colors.error, fontFamily: fonts.medium, fontSize: 13, marginTop: spacing.sm },
    save: {
      height: 52,
      borderRadius: radius.card,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    saveText: { color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 16 },
  });
