import { routes } from '@/constants/routes';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
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
      <Text style={styles.message}>Olá, {authState.user?.nome}.</Text>
      <Text style={styles.message}>{authState.user?.email}</Text>
      <Button variant="secondary" title="Ver catálogo de filmes" disabled={isSigningOut} onPress={() => router.push(routes.catalog)} />
      <Button title="Meus Ingressos" disabled={isSigningOut} onPress={() => router.push(routes.tickets)} />
      {authState.user?.tipo_usuario === 'admin' && (
        <Button title="Área administrativa" disabled={isSigningOut} onPress={() => router.push(routes.admin)} />
      )}
      <Button variant="secondary" title={mode === 'dark' ? 'Usar modo claro' : 'Usar modo escuro'} onPress={() => { void toggleTheme().catch(() => setError('Não foi possível salvar o tema.')); }} />
      {error && <ErrorState message={error} />}
      <Button
        title={isSigningOut ? 'Saindo...' : 'Sair da conta'}
        loading={isSigningOut}
        onPress={() => { void handleSignOut(); }}
      />
    </Screen>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
  message: { ...theme.typography.body, color: theme.colors.muted },
});
