import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type LoadingProps = { message?: string };

export function Loading({ message = 'Carregando...' }: LoadingProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <View accessibilityLiveRegion="polite" accessibilityState={{ busy: true }} style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.lg },
  message: { ...theme.typography.body, color: theme.colors.muted, textAlign: 'center' },
});
