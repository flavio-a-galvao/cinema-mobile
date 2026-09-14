import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountScreen() {
  const { authState } = useAuth();

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>Área autenticada</Text>
      <Text style={styles.message}>Olá, {authState.user?.nome}.</Text>
      <Text style={styles.message}>Sua sessão está ativa. Esta é uma tela temporária do Cinema App.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
  message: { ...theme.typography.body, color: theme.colors.muted },
});
