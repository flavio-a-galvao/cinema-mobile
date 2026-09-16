import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthenticatedLayout() {
  const { authState } = useAuth();

  return (
    <CheckoutProvider key={authState.user?.id_usuario}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="account" />
      <Stack.Protected guard={authState.status === 'authenticated' && authState.user.tipo_usuario === 'admin'}>
        <Stack.Screen name="(admin)" />
      </Stack.Protected>
    </Stack>
    </CheckoutProvider>
  );
}
