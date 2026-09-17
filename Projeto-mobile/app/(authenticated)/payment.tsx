import { routes } from '@/constants/routes';
import { router } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { createPayment, listMyPurchases } from '@/services/paymentService';
import type { Payment, PaymentMethod } from '@/types/payment';

const methods: { value: PaymentMethod; label: string }[] = [
  { value: 'cartao', label: 'Cartão' }, { value: 'pix', label: 'Pix' }, { value: 'dinheiro', label: 'Dinheiro' },
];
const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PaymentScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { authState } = useAuth();
  const { checkout, setCheckout } = useCheckout();
  const [method, setMethod] = useState<PaymentMethod>('cartao');
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const pending = checkout?.status === 'processing';
  const owned = authState.status === 'authenticated' && checkout?.userId === authState.user.id_usuario;
  usePreventRemove(pending, () => Alert.alert('Aguarde', 'O registro de pagamento está em andamento.'));
  useEffect(() => {
    if (owned && checkout?.status === 'complete') router.replace(routes.confirmation);
  }, [owned, checkout?.status]);

  async function pay(): Promise<void> {
    if (busy.current || !owned || !checkout || checkout.status !== 'ready' || authState.status !== 'authenticated') return;
    if (checkout.tickets.length < 1 || checkout.tickets.length > 10
      || checkout.qtdInteira + checkout.qtdMeia !== checkout.tickets.length
      || !Number.isSafeInteger(checkout.fullCents) || !Number.isSafeInteger(checkout.halfCents)
      || checkout.fullCents < 0 || checkout.halfCents < 0) {
      setError('Resumo inválido. Confira seus ingressos.');
      return;
    }
    busy.current = true;
    setError(null);
    setCheckout({ ...checkout, status: 'processing' });
    const payments: Payment[] = [];
    try {
      // Reconcilia tentativas anteriores no servidor antes de enviar qualquer pagamento.
      const purchases = await listMyPurchases(authState.token);
      for (const ticket of checkout.tickets) {
        const own = purchases.find(item => item.id === ticket.id_ingresso);
        if (!own || own.status === 'cancelado') throw new Error('Ingresso indisponível.');
        if (own.pago && own.pagamento) { payments.push(own.pagamento); continue; }
        if (!own.podePagar) throw new Error('Pagamento indisponível.');
        const payment = await createPayment({ id_ingresso: ticket.id_ingresso, metodo_pagamento: method }, authState.token);
        payments.push(payment);
      }
      setCheckout({ ...checkout, payments, status: 'complete' });
    } catch {
      setCheckout({ ...checkout, payments, status: 'uncertain' });
      setError(`Não foi possível concluir. ${payments.length} pagamento(s) confirmado(s). A última solicitação pode ter sido registrada. Atualize Meus Ingressos antes de qualquer nova tentativa.`);
    } finally {
      busy.current = false;
    }
  }

  if (!owned || !checkout) return <Screen><EmptyState title="Sem pagamento pendente" message="Consulte Meus Ingressos para continuar pagamentos pendentes." /><Button title="Meus Ingressos" onPress={() => router.replace(routes.tickets)} /></Screen>;
  const total = checkout.tickets.reduce((sum, ticket) => sum + Math.round(Number(ticket.valor_unitario) * 100), 0);
  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>Finalize sua experiência</Text>
      <Text style={styles.text}>Inteiras: {checkout.qtdInteira} × {money(checkout.fullCents)}</Text>
      <Text style={styles.text}>Meias: {checkout.qtdMeia} × {money(checkout.halfCents)}</Text>
      {checkout.tickets.map((ticket) => <Text key={ticket.id_ingresso} style={styles.text}>Assento {checkout.seatLabels[ticket.id_assento] || 'Código indisponível'}</Text>)}
      <Text style={styles.title}>Total: {money(total)}</Text>
      <Text style={styles.text}>Registro de pagamento no cinema. Nenhuma cobrança online será realizada.</Text>
      {methods.map((item) => <Button variant={method === item.value ? 'primary' : 'secondary'} key={item.value} title={`${method === item.value ? '✓ ' : ''}${item.label}`} accessibilityState={{ selected: method === item.value }} disabled={checkout.status !== 'ready'} onPress={() => setMethod(item.value)} />)}
      {error && <ErrorState message={error} />}
      {checkout.status === 'uncertain' && !error && <ErrorState message="O resultado anterior precisa ser conferido em Meus Ingressos. O reenvio está bloqueado." />}
      <Button title={pending ? 'Registrando...' : 'Confirmar registro de pagamento'} loading={pending} disabled={checkout.status !== 'ready'} onPress={() => { void pay(); }} />
      <Button title="Meus Ingressos" disabled={pending} onPress={() => router.replace(routes.tickets)} />
    </Screen>
  );
}
const createStyles = (theme: AppTheme) => StyleSheet.create({ title: { ...theme.typography.heading, color: theme.colors.text }, text: { ...theme.typography.body, color: theme.colors.text } });
