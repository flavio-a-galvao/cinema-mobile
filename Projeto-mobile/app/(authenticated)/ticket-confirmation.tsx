import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckout } from '@/contexts/CheckoutContext';

export default function TicketConfirmationScreen() {
  const { authState } = useAuth();
  const { checkout } = useCheckout();
  const confirmed = authState.status === 'authenticated' && checkout?.userId === authState.user.id_usuario && checkout.status === 'complete';
  return (
    <Screen>
      {confirmed && checkout ? (
        <>
          <Text accessibilityRole="header" style={styles.title}>Pagamento registrado com sucesso</Text>
          <Text style={styles.text}>O registro foi salvo no sistema. Não houve cobrança por gateway ou transferência Pix.</Text>
          {checkout.tickets.map((ticket) => (
            <Text key={ticket.id_ingresso} style={styles.text}>Ingresso #{ticket.id_ingresso} — sessão {ticket.id_sessao} — assento ID {ticket.id_assento}</Text>
          ))}
          <Text style={styles.text}>Total registrado: {checkout.payments.reduce((total, payment) => total + Number(payment.valor), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        </>
      ) : <EmptyState title="Sem confirmação disponível" message="Consulte seus ingressos para conferir os registros." />}
      <Button title="Meus Ingressos" onPress={() => router.replace('./my-tickets')} />
      <Button title="Voltar ao catálogo" onPress={() => router.replace('./catalog')} />
    </Screen>
  );
}
const styles = StyleSheet.create({ title: { ...theme.typography.heading, color: theme.colors.text }, text: { ...theme.typography.body, color: theme.colors.text } });
