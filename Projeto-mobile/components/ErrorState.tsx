import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type ErrorStateProps = { message: string; onRetry?: () => void };

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <Text accessibilityRole="alert" style={styles.message}>{message}</Text>
      {onRetry && <Button title="Tentar novamente" onPress={onRetry} />}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { gap: theme.spacing.md, paddingVertical: theme.spacing.lg },
  message: { ...theme.typography.body, color: theme.colors.error, textAlign: 'center' },
});
