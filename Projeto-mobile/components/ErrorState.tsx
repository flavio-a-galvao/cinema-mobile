import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';

type ErrorStateProps = { message: string; onRetry?: () => void };

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="alert" style={styles.message}>{message}</Text>
      {onRetry && <Button title="Tentar novamente" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.md, paddingVertical: theme.spacing.lg },
  message: { ...theme.typography.body, color: theme.colors.error, textAlign: 'center' },
});
