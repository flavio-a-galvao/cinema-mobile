import { isAxiosError } from 'axios';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/Input';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

function getLoginErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return 'Email ou senha incorretos. Confira os dados e tente novamente.';
    if (!error.response) return 'Não foi possível conectar. Verifique sua conexão e tente novamente.';
  }
  return 'Não foi possível entrar agora. Tente novamente em instantes.';
}

export default function LoginScreen() {
  const { signIn, isLoading, authState } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  async function handleSignIn(): Promise<void> {
    if (isLoading || pending.current) return;
    setSubmitted(true);
    setError(null);
    if (!email.trim() || !senha.trim()) return;

    pending.current = true;
    setIsSubmitting(true);
    Keyboard.dismiss();
    try {
      await signIn(email.trim(), senha);
      setSenha('');
      setSubmitted(false);
    } catch (error: unknown) {
      setError(getLoginErrorMessage(error));
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <Screen><Loading message="Verificando sessão..." /></Screen>;
  }

  if (authState.status === 'authenticated') {
    return <Redirect href="/account" />;
  }

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>Entrar no Cinema App</Text>
      <Input
        label="Email"
        placeholder="seu@email.com"
        value={email}
        onChangeText={(value) => { setEmail(value); setError(null); }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        editable={!isSubmitting}
        error={submitted && !email.trim() ? 'Informe seu email.' : undefined}
      />
      <Input
        label="Senha"
        placeholder="Digite sua senha"
        value={senha}
        onChangeText={(value) => { setSenha(value); setError(null); }}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={() => { void handleSignIn(); }}
        editable={!isSubmitting}
        error={submitted && !senha.trim() ? 'Informe sua senha.' : undefined}
      />
      {error && <ErrorState message={error} />}
      <Button title={isSubmitting ? 'Entrando...' : 'Entrar'} loading={isSubmitting} onPress={() => { void handleSignIn(); }} />
      <Button title="Criar conta" disabled={isSubmitting} onPress={() => router.push('/register')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
});
