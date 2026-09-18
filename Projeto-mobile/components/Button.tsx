import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'link' | 'danger';
};

export function Button({ title, icon, loading = false, disabled = false, variant = 'primary', ...props }: ButtonProps) {
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
        variant === 'danger' && styles.danger,
        pressed && variant === 'primary' && styles.pressed,
        unavailable && styles.disabled,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? theme.colors.onPrimary : theme.colors.primary} /> : icon ? <Ionicons name={icon} size={theme.sizes.icon} color={variant === 'danger' ? theme.colors.error : variant === 'primary' ? theme.colors.onPrimary : theme.colors.primary} /> : null}
      <Text style={[styles.label, variant !== 'primary' && styles.secondaryLabel, variant === 'danger' && styles.dangerLabel]}>{title}</Text>
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
  danger: { backgroundColor: theme.colors.errorSoft, borderColor: theme.colors.errorSoft },
  dangerLabel: { color: theme.colors.error },
  link: { backgroundColor: 'transparent', borderWidth: 0 },
  secondaryLabel: { color: theme.colors.primary },
  pressed: { backgroundColor: theme.colors.primaryPressed },
  disabled: { opacity: theme.opacity.disabled },
  label: { ...theme.typography.label, color: theme.colors.onPrimary, textAlign: 'center', flexShrink: 1 },
});
