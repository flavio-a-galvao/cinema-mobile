import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'link';
};

export function Button({ title, loading = false, disabled = false, variant = 'primary', ...props }: ButtonProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const unavailable = disabled || loading;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? title}
      accessibilityState={{ ...props.accessibilityState, disabled: unavailable, busy: loading }}
      disabled={unavailable}
      style={({ pressed }) => [
        styles.button,
        variant !== 'primary' && styles.secondary,
        variant === 'link' && styles.link,
        pressed && variant === 'primary' && styles.pressed,
        unavailable && styles.disabled,
      ]}
    >
      {loading && <ActivityIndicator color={theme.colors.onPrimary} />}
      <Text style={[styles.label, variant !== 'primary' && styles.secondaryLabel]}>{title}</Text>
    </Pressable>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  button: {
    minHeight: theme.sizes.controlMinHeight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  secondary: { backgroundColor: theme.colors.surface, borderWidth: theme.sizes.borderWidth, borderColor: theme.colors.border },
  link: { backgroundColor: theme.colors.background, borderWidth: 0 },
  secondaryLabel: { color: theme.colors.primary },
  pressed: { backgroundColor: theme.colors.primaryPressed },
  disabled: { opacity: theme.opacity.disabled },
  label: { ...theme.typography.label, color: theme.colors.onPrimary, textAlign: 'center', flexShrink: 1 },
});
