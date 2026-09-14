import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { theme } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <Screen>
      <Text style={styles.caption}>CINEMA • FASE 1</Text>
      <Text accessibilityRole="header" style={styles.title}>Cinema App</Text>
      <Text style={styles.description}>Projeto mobile configurado. Uma nova experiência de cinema começa aqui.</Text>
      <Button title="Testar componentes" onPress={() => router.push('/components')} />
      <Button title="Entrar" onPress={() => router.push('/login')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  caption: { ...theme.typography.label, color: theme.colors.primary },
  title: { ...theme.typography.title, color: theme.colors.text },
  description: { ...theme.typography.body, color: theme.colors.muted },
});
