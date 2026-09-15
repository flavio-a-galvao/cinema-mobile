import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { theme } from '@/constants/theme';

export default function AdminScreen() {
  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>Área administrativa</Text>
      <Text style={styles.message}>Esta tela temporária está disponível para o perfil administrador.</Text>
      <Button title="Voltar à minha conta" onPress={() => router.replace('/account')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
  message: { ...theme.typography.body, color: theme.colors.muted },
});
