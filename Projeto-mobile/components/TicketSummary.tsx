import { useTicketConfirmation } from '@/hooks/useTicketConfirmation';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { theme } from '@/constants/theme';
import type { SessionSeat } from '@/types/seat';
import type { MovieSession } from '@/types/session';

type TicketSummaryProps = {
  sessionId: number;
  onLockChange: (locked: boolean) => void;
  seats: SessionSeat[];
  price: MovieSession['preco'];
};

function money(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function TicketSummary({ sessionId, seats, price, onLockChange }: TicketSummaryProps) {
  const [qtdMeia, setQtdMeia] = useState(0);
  const qtdInteira = seats.length - qtdMeia;
  const numericPrice = price === null || String(price).trim() === '' ? NaN : Number(price);
  const validPrice = Number.isFinite(numericPrice) && numericPrice >= 0;
  const precoInteira = Math.round(numericPrice * 100);
  const precoMeia = Math.round(precoInteira / 2);
  const valorTotal = qtdInteira * precoInteira + qtdMeia * precoMeia;
  const { confirm, pending, error, created, stopped, complete } = useTicketConfirmation({ sessionId, seats, qtdInteira, qtdMeia, validPrice, fullCents: precoInteira, halfCents: precoMeia, onLockChange });
  const locked = pending || stopped || complete;

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>Resumo dos ingressos</Text>
      <Text style={styles.text}>Assentos: {seats.map((seat) => `${seat.fila || ''}${seat.numero || `ID ${seat.id_assento}`}`).join(', ')}</Text>
      <Text style={styles.text}>Inteiras: {qtdInteira}</Text>
      <Text style={styles.text}>Meias: {qtdMeia}</Text>
      <Text style={styles.text}>Total de ingressos: {qtdInteira + qtdMeia}</Text>
      <Button title="Trocar uma inteira por meia" disabled={locked || qtdInteira === 0} onPress={() => setQtdMeia((value) => Math.min(seats.length, value + 1))} />
      <Button title="Trocar uma meia por inteira" disabled={locked || qtdMeia === 0} onPress={() => setQtdMeia((value) => Math.max(0, value - 1))} />
      {validPrice ? (
        <>
          <Text style={styles.text}>Preço da inteira: {money(precoInteira)}</Text>
          <Text style={styles.text}>Preço da meia: {money(precoMeia)}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.title}>Valor total: {money(valorTotal)}</Text>
        </>
      ) : <ErrorState message="Preço da sessão indisponível. Não é possível avançar." />}
      {error && <ErrorState message={error} />}
      {stopped && created.map((ticket) => (
        <Text key={ticket.id_ingresso} style={styles.text}>Ingresso #{ticket.id_ingresso} — assento ID {ticket.id_assento}</Text>
      ))}
      <Button title={pending ? 'Confirmando...' : 'Confirmar ingressos'} loading={pending} disabled={locked || !validPrice || seats.length === 0 || seats.length > 10 || qtdInteira + qtdMeia !== seats.length} onPress={() => { void confirm(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.md },
  title: { ...theme.typography.heading, color: theme.colors.text },
  text: { ...theme.typography.body, color: theme.colors.text },
});
