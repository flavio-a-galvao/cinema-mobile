import { AccountAction } from '@/components/AccountAction';
import Ionicons from '@expo/vector-icons/Ionicons';
import { routes } from '@/constants/routes';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ErrorState } from '@/components/ErrorState';
import { Screen } from '@/components/Screen';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountScreen() {
  const { theme, mode, toggleTheme } = useTheme();
  const styles = createStyles(theme);
  const { authState, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  async function handleSignOut(): Promise<void> {
    if (pending.current) return;
    pending.current = true;
    setIsSigningOut(true);
    setError(null);

    try {
      await signOut();
    } catch {
      setError('Não foi possível sair da conta. Tente novamente.');
    } finally {
      pending.current = false;
      setIsSigningOut(false);
    }
  }

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>Perfil</Text>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.sm, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }}><Ionicons name="person-circle-outline" size={theme.sizes.avatar} color={theme.colors.primary} /><Text style={styles.title}>{authState.user?.nome}</Text><Text style={styles.message}>{authState.user?.email}</Text></View><Text style={styles.message}>Sua experiência Cinemax</Text>
      <AccountAction icon="film-outline" title="Ver catálogo de filmes" subtitle="Encontre sua próxima história" disabled={isSigningOut} onPress={() => router.push(routes.catalog)} />
      <AccountAction icon="ticket-outline" title="Meus Ingressos" subtitle="Compras e pagamentos pendentes" disabled={isSigningOut} onPress={() => router.push(routes.tickets)} />
      {authState.user?.tipo_usuario === 'admin' && (
        <AccountAction icon="grid-outline" title="Área administrativa" subtitle="Gerencie filmes, salas e sessões" disabled={isSigningOut} onPress={() => router.push(routes.admin)} />
      )}
      <AccountAction icon={mode === 'dark' ? 'sunny-outline' : 'moon-outline'} subtitle="Preferência salva neste aparelho" title={mode === 'dark' ? 'Usar modo claro' : 'Usar modo escuro'} onPress={() => { void toggleTheme().catch(() => setError('Não foi possível salvar o tema.')); }} />
      {error && <ErrorState message={error} />}
      <AccountAction icon="log-out-outline" danger
        title={isSigningOut ? 'Saindo...' : 'Sair da conta'}
        disabled={isSigningOut}
        onPress={() => { void handleSignOut(); }}
      />
    </Screen>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
  message: { ...theme.typography.body, color: theme.colors.muted },
});
