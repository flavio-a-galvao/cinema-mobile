import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
function RootNavigator() {
 const { authState, isLoading } = useAuth(); const { theme, mode } = useTheme();
 if (isLoading) return <Screen><Loading message="Preparando o Cinemax..." /></Screen>;
 return <><StatusBar style={mode === 'dark' ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
 <Stack.Protected guard={authState.status !== 'authenticated'}><Stack.Screen name="(public)" /></Stack.Protected>
 <Stack.Protected guard={authState.status === 'authenticated'}><Stack.Screen name="(authenticated)" /></Stack.Protected>
 </Stack></>;
}
export default function RootLayout() { return <SafeAreaProvider><ThemeProvider><AuthProvider><RootNavigator /></AuthProvider></ThemeProvider></SafeAreaProvider>; }
