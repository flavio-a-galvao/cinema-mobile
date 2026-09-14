import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { theme } from '@/constants/theme';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  loading?: boolean;
};

export function Button({ title, loading = false, disabled = false, ...props }: ButtonProps) {
  const unavailable = disabled || loading;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? title}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        unavailable && styles.disabled,
      ]}
    >
      {loading && <ActivityIndicator color={theme.colors.onPrimary} />}
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  pressed: { backgroundColor: theme.colors.primaryPressed },
  disabled: { opacity: theme.opacity.disabled },
  label: { ...theme.typography.label, color: theme.colors.onPrimary, textAlign: 'center', flexShrink: 1 },
});
