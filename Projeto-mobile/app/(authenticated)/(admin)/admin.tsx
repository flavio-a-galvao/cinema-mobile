import { routes } from '@/constants/routes';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>Área administrativa</Text>
      <Text style={styles.message}>Gerencie o Cinemax com seu perfil de administrador.</Text>
      <Button title="Voltar à minha conta" onPress={() => router.replace(routes.profile)} />
    </Screen>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
  message: { ...theme.typography.body, color: theme.colors.muted },
});
