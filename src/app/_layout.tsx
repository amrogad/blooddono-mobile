import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from '../../providers/AuthProvider';

const queryClient = new QueryClient();

function RootNavigator() {
  const { session, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
