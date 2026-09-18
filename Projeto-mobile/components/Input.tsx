import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type InputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
};

export function Input({ label, error, onFocus, onBlur, editable = true, secureTextEntry = false, ...props }: InputProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        editable={editable}
        secureTextEntry={secureTextEntry && !showPassword}
        accessibilityLabel={props.accessibilityLabel ?? label}
        accessibilityHint={error ?? props.accessibilityHint}
        placeholderTextColor={theme.colors.muted}
        selectionColor={theme.colors.primary}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        style={[styles.input, focused && styles.focused, !!error && styles.invalid, !editable && styles.disabled]}
      />
      {secureTextEntry && <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} disabled={!editable} onPress={() => setShowPassword(value => !value)} style={styles.toggle}><Text style={styles.toggleLabel}>{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</Text></Pressable>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { gap: theme.spacing.sm },
  label: { ...theme.typography.label, color: theme.colors.text },
  input: {
    ...theme.typography.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    minHeight: theme.sizes.controlMinHeight,
    borderWidth: theme.sizes.borderWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  toggle: { minHeight: theme.sizes.controlMinHeight, justifyContent: 'center', alignSelf: 'flex-end' },
  toggleLabel: { ...theme.typography.caption, color: theme.colors.primary },
  focused: { borderColor: theme.colors.primary },
  invalid: { borderColor: theme.colors.error },
  disabled: { opacity: theme.opacity.disabled },
  error: { ...theme.typography.caption, color: theme.colors.error },
});
