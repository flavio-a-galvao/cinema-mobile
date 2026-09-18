import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type EmptyStateProps = { title: string; message: string };

export function EmptyState({ title, message }: EmptyStateProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}><Ionicons name="film-outline" size={theme.sizes.iconLarge} color={theme.colors.primary} />
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm, paddingVertical: theme.spacing.lg },
  title: { ...theme.typography.heading, color: theme.colors.text, textAlign: 'center' },
  message: { ...theme.typography.body, color: theme.colors.muted, textAlign: 'center' },
});
