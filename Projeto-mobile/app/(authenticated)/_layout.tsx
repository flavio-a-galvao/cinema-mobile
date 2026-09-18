import { Stack } from 'expo-router';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
export const unstable_settings = { initialRouteName: '(tabs)' };
export default function AuthenticatedLayout() {
 const { authState } = useAuth(); const { theme } = useTheme();
 return <CheckoutProvider key={authState.user?.id_usuario}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
 <Stack.Screen name="(tabs)" />
 <Stack.Protected guard={authState.status === 'authenticated' && authState.user.tipo_usuario === 'admin'}><Stack.Screen name="(admin)" /></Stack.Protected>
 </Stack></CheckoutProvider>;
}
