import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';

function RootNavigator() {
  const { authState, isLoading } = useAuth();

  if (isLoading) {
    return <Screen><Loading message="Verificando sessão..." /></Screen>;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="(public)" />
      <Stack.Protected guard={authState.status === 'authenticated'}>
        <Stack.Screen name="(authenticated)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
