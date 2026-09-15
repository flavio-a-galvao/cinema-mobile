import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Screen } from '@/components/Screen';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountScreen() {
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
      <Text accessibilityRole="header" style={styles.title}>Área autenticada</Text>
      <Text style={styles.message}>Olá, {authState.user?.nome}.</Text>
      <Text style={styles.message}>Sua sessão está ativa. Esta é uma tela temporária do Cinema App.</Text>
      <Button title="Ver catálogo de filmes" disabled={isSigningOut} onPress={() => router.push('./catalog')} />
      {authState.user?.tipo_usuario === 'admin' && (
        <Button title="Área administrativa" disabled={isSigningOut} onPress={() => router.push('./admin')} />
      )}
      {error && <ErrorState message={error} />}
      <Button
        title={isSigningOut ? 'Saindo...' : 'Sair da conta'}
        loading={isSigningOut}
        onPress={() => { void handleSignOut(); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
  message: { ...theme.typography.body, color: theme.colors.muted },
});
