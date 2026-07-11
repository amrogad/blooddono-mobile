import { DefaultTheme, ThemeProvider as NavThemeProvider, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';
import { useTranslation } from 'react-i18next';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { fonts } from '@/constants/theme';

const queryClient = new QueryClient();

function RootNavigator() {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  const { session, loading } = useAuth();
  usePushNotifications(session?.user.id);

  const navTheme = {
    ...DefaultTheme,
    dark: scheme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: fonts.semibold, color: colors.text },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="request/[id]" options={{ headerShown: true, title: t('nav.request') }} />
          <Stack.Screen name="map" options={{ headerShown: true, title: t('nav.map') }} />
          <Stack.Screen name="my-requests" options={{ headerShown: true, title: t('nav.myRequests') }} />
          <Stack.Screen name="edit-request/[id]" options={{ headerShown: true, title: t('nav.editRequest') }} />
          <Stack.Screen name="profile-edit" options={{ headerShown: true, title: t('nav.editProfile') }} />
          <Stack.Screen name="funds" options={{ headerShown: false }} />
          <Stack.Screen name="funds/payment" options={{ headerShown: true, title: t('nav.donate') }} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)/login" />
        </Stack.Protected>
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsReady] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
  });

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F3' }}>
        <ActivityIndicator color="#C21E3F" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <LocaleProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
