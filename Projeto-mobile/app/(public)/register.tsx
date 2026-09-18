import { formatCpf } from '@/utils/formatCpf';
import { Notice } from '@/components/Notice';
import { Brand } from '@/components/Brand';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { register } from '@/services/authService';
import type { RegisterInput } from '@/types/auth';

type FormErrors = Partial<Record<keyof RegisterInput, string>>;
const emptyForm: RegisterInput = { nome: '', cpf: '', email: '', senha: '' };

function validateForm(form: RegisterInput): FormErrors {
  const errors: FormErrors = {};
  if (!form.nome.trim()) errors.nome = 'Informe seu nome.';
  const cpf = form.cpf.replace(/\D/g, '');
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    errors.cpf = 'Informe um CPF com 11 dígitos válidos.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Informe um email válido.';
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(form.senha)) {
    errors.senha = 'Use pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo.';
  }
  return errors;
}

function getRegistrationErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    if (!error.response) return 'Não foi possível conectar. Verifique sua conexão e tente novamente.';
    if (error.response.status === 400 || error.response.status === 409) {
      const message = error.response.data?.message;
      if (typeof message === 'string' && message.trim()) return message;
      return 'Confira seus dados. O email ou CPF pode já estar cadastrado.';
    }
  }
  return 'Não foi possível criar sua conta agora. Tente novamente em instantes.';
}

export default function RegisterScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [form, setForm] = useState<RegisterInput>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pending = useRef(false);

  function updateField(field: keyof RegisterInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
  }

  async function handleRegister(): Promise<void> {
    if (pending.current || success) return;
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setError(null);
    if (Object.keys(validationErrors).length) return;

    pending.current = true;
    setIsSubmitting(true);
    Keyboard.dismiss();
    try {
      await register(form);
      setForm(emptyForm);
      setSuccess(true);
    } catch (error: unknown) {
      setError(getRegistrationErrorMessage(error));
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <Brand subtitle="Seu lugar nas próximas grandes histórias." /><Text style={styles.title}>Crie sua conta</Text>
      {success ? (
        <Notice message="Conta criada com sucesso. Entre com seu email e senha." />
      ) : (
        <View style={styles.form}>
          <Input label="Nome" placeholder="Como você se chama?" value={form.nome} onChangeText={(value) => updateField('nome', value)}
            autoComplete="name" autoCapitalize="words" editable={!isSubmitting} error={errors.nome} />
          <Input label="CPF" placeholder="000.000.000-00" value={form.cpf} onChangeText={(value) => updateField('cpf', formatCpf(value))}
            keyboardType="number-pad" maxLength={14} editable={!isSubmitting} error={errors.cpf} />
          <Input label="Email" placeholder="seu@email.com" value={form.email} onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address" autoComplete="email" autoCapitalize="none" autoCorrect={false}
            editable={!isSubmitting} error={errors.email} />
          <Input label="Senha" placeholder="Crie uma senha segura" value={form.senha} onChangeText={(value) => updateField('senha', value)}
            secureTextEntry autoComplete="new-password" autoCapitalize="none" autoCorrect={false}
            editable={!isSubmitting} error={errors.senha} returnKeyType="go" onSubmitEditing={() => { void handleRegister(); }} />
          <Text style={styles.hint}>Senha com pelo menos 8 caracteres, maiúscula, minúscula, número e símbolo.</Text>
          {error && <ErrorState message={error} />}
          <Button title={isSubmitting ? 'Criando conta...' : 'Cadastrar'} loading={isSubmitting} onPress={() => { void handleRegister(); }} />
        </View>
      )}
      <Button variant="link" title="Já tenho conta — Entrar" disabled={isSubmitting} onPress={() => router.replace('/login')} />
    </Screen>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  form: { gap: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: theme.sizes.borderWidth, borderColor: theme.colors.border },
  title: { ...theme.typography.heading, color: theme.colors.text },
  message: { ...theme.typography.body, color: theme.colors.text },
  hint: { ...theme.typography.caption, color: theme.colors.muted },
});
