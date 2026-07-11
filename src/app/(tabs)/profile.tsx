import { View, Text, Pressable, ActivityIndicator, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/providers/AuthProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/Avatar';
import { spacing, radius, fonts, type } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles, useTheme } from '@/providers/ThemeProvider';
import { updateProfile, type Profile } from '@/services/profileService';

export default function Profile() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile(session?.user.id);
  const { colors, styles } = useThemedStyles(makeStyles);
  const { scheme, toggle } = useTheme();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const queryClient = useQueryClient();

  const { mutate: toggleSearchable } = useMutation({
    mutationFn: (value: boolean) => updateProfile(session!.user.id, { is_searchable: value }),
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey: ['profile', session?.user.id] });
      const prev = queryClient.getQueryData<Profile>(['profile', session?.user.id]);
      queryClient.setQueryData<Profile>(['profile', session?.user.id], (old) =>
        old ? { ...old, is_searchable: value } : old,
      );
      return { prev };
    },
    onError: (_err, _value, ctx) => {
      queryClient.setQueryData(['profile', session?.user.id], ctx?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', session?.user.id] });
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const location = profile?.governorate
    ? `${profile.city ? `${profile.city}, ` : ''}${profile.governorate}`
    : '—';

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar uri={profile?.photo_url} size={62} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.display_name ?? t('profile.unnamed')}
          </Text>
          <View style={styles.headerMeta}>
            {profile?.blood_group ? (
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText}>{profile.blood_group}</Text>
              </View>
            ) : null}
            {profile?.role ? <Text style={styles.role}>{profile.role}</Text> : null}
          </View>
        </View>
        <Pressable
          style={styles.editIcon}
          onPress={() => router.push('/profile-edit')}
          accessibilityRole="button"
          accessibilityLabel={t('profile.editProfile')}
        >
          <Feather name="edit-2" size={15} color={colors.textBody} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <InfoRow icon="mail" label={t('profile.email')} value={session?.user.email ?? '—'} />
        <InfoRow icon="map-pin" label={t('profile.location')} value={location} divider />
      </View>

      <View style={styles.card}>
        <ActionRow icon="clock" label={t('profile.myRequests')} onPress={() => router.push('/my-requests')} />
        <ActionRow icon="edit-3" label={t('profile.editProfile')} onPress={() => router.push('/profile-edit')} divider />
        <ActionRow icon="heart" label={t('profile.communityFund')} onPress={() => router.push('/funds')} divider />
      </View>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Feather name="search" size={16} color={colors.textBody} />
          <Text style={styles.toggleLabel}>{t('profile.visibleInSearch')}</Text>
          <Switch
            value={profile?.is_searchable ?? false}
            onValueChange={toggleSearchable}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            thumbColor={colors.onPrimary}
            accessibilityLabel={t('profile.toggleSearchA11y')}
          />
        </View>
        <View style={[styles.toggleRow, styles.divider]}>
          <Feather name="moon" size={16} color={colors.textBody} />
          <Text style={styles.toggleLabel}>{t('profile.darkMode')}</Text>
          <Switch
            value={scheme === 'dark'}
            onValueChange={toggle}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            thumbColor={colors.onPrimary}
            accessibilityLabel={t('profile.toggleDarkA11y')}
          />
        </View>
        <View style={[styles.toggleRow, styles.divider]}>
          <Feather name="globe" size={16} color={colors.textBody} />
          <Text style={styles.toggleLabel}>{t('profile.language')}</Text>
          <View style={styles.langSwitch}>
            <Pressable
              onPress={() => setLocale('en')}
              style={[styles.langOption, locale === 'en' && styles.langOptionActive]}
              accessibilityLabel="English"
            >
              <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>EN</Text>
            </Pressable>
            <Pressable
              onPress={() => setLocale('ar')}
              style={[styles.langOption, locale === 'ar' && styles.langOptionActive]}
              accessibilityLabel="العربية"
            >
              <Text style={[styles.langText, locale === 'ar' && styles.langTextActive]}>ع</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.85 }]}
        onPress={signOut}
        accessibilityRole="button"
        accessibilityLabel={t('profile.signOut')}
      >
        <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  divider,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  divider?: boolean;
}) {
  const { colors, styles } = useThemedStyles(makeStyles);
  return (
    <View style={[styles.infoRow, divider && styles.divider]}>
      <Feather name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  divider,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  divider?: boolean;
}) {
  const { colors, styles } = useThemedStyles(makeStyles);
  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, divider && styles.divider, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icon} size={16} color={colors.textBody} />
      <Text style={styles.actionLabel}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingTop: 64, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, letterSpacing: -0.3 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  groupBadge: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 2.5 },
  groupBadgeText: { fontFamily: fonts.displayBold, fontSize: 12, color: colors.onPrimary },
  role: { ...type.small, color: colors.textMuted, textTransform: 'capitalize' },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.control,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14 },
  infoLabel: { ...type.body, color: colors.textBody, flex: 1 },
  infoValue: { ...type.bodyBold, color: colors.ink, maxWidth: '55%' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 15 },
  actionLabel: { ...type.body, color: colors.ink, flex: 1, fontFamily: fonts.medium },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12 },
  toggleLabel: { ...type.body, color: colors.ink, flex: 1, fontFamily: fonts.medium },
  langSwitch: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 2 },
  langOption: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  langOptionActive: { backgroundColor: colors.primary },
  langText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  langTextActive: { color: colors.onPrimary },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  signOut: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.card,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  signOutText: { color: colors.textBody, fontFamily: fonts.semibold, fontSize: 15 },
});
