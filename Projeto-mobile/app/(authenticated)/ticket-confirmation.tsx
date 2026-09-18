import Ionicons from '@expo/vector-icons/Ionicons';
import { routes } from '@/constants/routes';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckout } from '@/contexts/CheckoutContext';

export default function TicketConfirmationScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { authState } = useAuth();
  const { checkout } = useCheckout();
  const confirmed = authState.status === 'authenticated' && checkout?.userId === authState.user.id_usuario && checkout.status === 'complete';
  return (
    <Screen>
      {confirmed && checkout ? (
        <>
          <Ionicons name="checkmark-circle" size={theme.sizes.avatar} color={theme.colors.success} /><Text accessibilityRole="header" style={styles.title}>Tudo pronto!</Text>
          <Text style={styles.text}>Seus ingressos e o registro de pagamento estão salvos. Nenhuma cobrança online foi realizada.</Text>
          {checkout.tickets.map((ticket) => (
            <Text key={ticket.id_ingresso} style={styles.text}>Assento {checkout.seatLabels[ticket.id_assento] || 'Código indisponível'}</Text>
          ))}
          <Text style={styles.text}>Total registrado: {checkout.payments.reduce((total, payment) => total + Number(payment.valor), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        </>
      ) : <EmptyState title="Sem confirmação disponível" message="Consulte seus ingressos para conferir os registros." />}
      <Button title="Meus Ingressos" onPress={() => router.replace(routes.tickets)} />
      <Button title="Voltar ao catálogo" onPress={() => router.replace(routes.catalog)} />
    </Screen>
  );
}
const createStyles = (theme: AppTheme) => StyleSheet.create({ title: { ...theme.typography.heading, color: theme.colors.text }, text: { ...theme.typography.body, color: theme.colors.text } });
