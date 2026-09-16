import { StyleSheet, Text, View } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type EmptyStateProps = { title: string; message: string };

export function EmptyState({ title, message }: EmptyStateProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { gap: theme.spacing.sm, paddingVertical: theme.spacing.lg },
  title: { ...theme.typography.heading, color: theme.colors.text, textAlign: 'center' },
  message: { ...theme.typography.body, color: theme.colors.muted, textAlign: 'center' },
});
