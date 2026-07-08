import { DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { PlaywriteAUSA_400Regular } from '@expo-google-fonts/playwrite-au-sa';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { colors, fonts } from '@/constants/theme';

const queryClient = new QueryClient();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

function RootNavigator() {
  const { session, loading } = useAuth();
  usePushNotifications(session?.user.id);
  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleStyle: { fontFamily: fonts.semibold },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="request/[id]" options={{ headerShown: true, title: 'Request' }} />
        <Stack.Screen name="map" options={{ headerShown: true, title: 'Map' }} />
        <Stack.Screen name="my-requests" options={{ headerShown: true, title: 'My requests' }} />
        <Stack.Screen name="edit-request/[id]" options={{ headerShown: true, title: 'Edit request' }} />
        <Stack.Screen name="profile-edit" options={{ headerShown: true, title: 'Edit profile' }} />
        <Stack.Screen name="funds" options={{ headerShown: false }} />
        <Stack.Screen name="funds/payment" options={{ headerShown: true, title: 'Donate' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsReady] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    PlaywriteAUSA_400Regular,
  });

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={navTheme}>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
