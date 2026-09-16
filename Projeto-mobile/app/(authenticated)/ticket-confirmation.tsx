import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import type { Ticket } from '@/types/ticket';

type ReceiptTicket = Pick<Ticket, 'id_ingresso' | 'id_sessao' | 'id_assento'>;

function readTickets(value: unknown): ReceiptTicket[] {
  if (typeof value !== 'string') return [];
  try {
    const data: unknown = JSON.parse(value);
    if (!Array.isArray(data) || data.length > 10) return [];
    return data.filter((ticket): ticket is ReceiptTicket => ticket !== null && typeof ticket === 'object'
      && ['id_ingresso', 'id_sessao', 'id_assento'].every((key) => Number.isSafeInteger(ticket[key]) && ticket[key] > 0));
  } catch {
    return [];
  }
}

export default function TicketConfirmationScreen() {
  const { tickets } = useLocalSearchParams<{ tickets?: string }>();
  const { authState } = useAuth();
  const created = authState.status === 'authenticated' ? readTickets(tickets) : [];
  return (
    <Screen>
      {created.length ? (
        <>
          <Text accessibilityRole="header" style={styles.title}>Ingressos criados</Text>
          <Text style={styles.text}>Nenhum pagamento foi realizado nesta etapa.</Text>
          {created.map((ticket) => (
            <Text key={ticket.id_ingresso} style={styles.text}>Ingresso #{ticket.id_ingresso} — sessão {ticket.id_sessao} — assento ID {ticket.id_assento}</Text>
          ))}
        </>
      ) : <EmptyState title="Sem confirmação disponível" message="Confirme os ingressos a partir de uma sessão." />}
      <Button title="Voltar ao catálogo" onPress={() => router.replace('./catalog')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
  text: { ...theme.typography.body, color: theme.colors.text },
});
