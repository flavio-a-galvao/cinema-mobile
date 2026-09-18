import { pendingCheckout } from '@/utils/pendingCheckout';
import { routes } from '@/constants/routes';
import { router, useFocusEffect } from 'expo-router';
import { isAxiosError } from 'axios';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { listMyPurchases } from '@/services/paymentService';
import { cancelTicket } from '@/services/ticketService';
import type { Purchase } from '@/types/payment';

export default function MyTicketsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { authState } = useAuth();
  const { setCheckout } = useCheckout();
  const token = authState.token;
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const cancellingRef = useRef(false);
  const request = useRef(0);
  const load = useCallback(async () => {
    if (!token) return;
    const current = ++request.current;
    await listMyPurchases(token).then(
      (data) => { if (current === request.current) { setPurchases(data); setError(null); } },
      () => { if (current === request.current) setError('Não foi possível carregar seus ingressos. Tente novamente.'); },
    ).finally(() => { if (current === request.current) { setLoading(false); setRefreshing(false); } });
  }, [token]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current += 1; };
  }, [load]));

  async function performCancel(item: Purchase): Promise<void> {
    if (!token || cancellingRef.current) return;
    cancellingRef.current = true;
    setCancelling(item.id);
    setNotice(null);
    try {
      await cancelTicket(item.id, token);
      setPurchases(current => current.map(ticket => ticket.id === item.id ? { ...ticket, status: 'cancelado', podeCancelar: false } : ticket));
      setCheckout(current => current?.tickets.some(ticket => ticket.id_ingresso === item.id) ? { ...current, status: 'uncertain' } : current);
      await load();
      setNotice('Ingresso cancelado. O assento está livre para outra compra. Nenhum estorno financeiro foi realizado.');
    } catch (cause: unknown) {
      setNotice(isAxiosError(cause) && cause.response?.status === 409 ? 'Este ingresso já foi cancelado ou a sessão já começou. Atualize a lista.' : 'Não foi possível confirmar o cancelamento. Atualize seus ingressos antes de tentar novamente.');
    } finally { cancellingRef.current = false; setCancelling(null); }
  }
  function askCancel(item: Purchase) {
    const message = 'Cancelar o ingresso de ' + item.filme + ', assento ' + item.assento + '? O pagamento é simulado; não haverá estorno financeiro real.';
    if (Platform.OS === 'web') { if (window.confirm(message)) void performCancel(item); }
    else Alert.alert('Cancelar ingresso?', message, [{ text: 'Manter ingresso', style: 'cancel' }, { text: 'Cancelar ingresso', style: 'destructive', onPress: () => { void performCancel(item); } }]);
  }
  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={purchases}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); void load(); }}
        ListHeaderComponent={<View style={styles.group}>
          <Text accessibilityRole="header" style={styles.title}>Meus Ingressos</Text>
          {notice && <Text accessibilityLiveRegion="polite" style={styles.text}>{notice}</Text>}
          {loading && <Loading message="Carregando seus ingressos..." />}
          {error && <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />}
        </View>}
        ListEmptyComponent={!loading && !error ? <EmptyState title="Nenhum ingresso encontrado" message="Escolha um filme no catálogo para começar." /> : null}
        renderItem={({ item }) => <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>{item.filme}</Text>
          <Text style={styles.text}>{item.horario ? new Date(item.horario).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Horário indisponível'}</Text>
          <Text style={styles.text}>{item.sala}</Text>
          <Text style={styles.status}>{item.status === 'cancelado' ? 'CANCELADO' : 'ATIVO'}</Text>
          <Text style={styles.text}>Assento: {item.assento}</Text>
          {item.tipo_ingresso && <Text style={styles.text}>{item.tipo_ingresso === 'meia' ? 'Meia-entrada' : 'Inteira'}</Text>}
          <Text style={styles.text}>Compra: {item.dataCompra ? new Date(item.dataCompra).toLocaleString('pt-BR') : 'Data indisponível'}</Text>
          <Text style={styles.text}>{!item.pago ? 'Pagamento pendente' : `Pagamento registrado: ${item.metodo}`}</Text>
          <Text style={styles.text}>Total: {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
          {!item.pago && item.status === 'ativo' && !item.podePagar && <Text style={styles.text}>Ingresso antigo sem preço registrado. Cancele e selecione novamente para pagar.</Text>}
          {item.podePagar && <Button title="Continuar pagamento" disabled={cancelling !== null || refreshing} onPress={() => {
            if (authState.status !== 'authenticated') return;
            setCheckout(pendingCheckout(item, authState.user.id_usuario));
            router.push(routes.payment);
          }} />}
          {item.podeCancelar && item.status === 'ativo' && <Button variant="secondary" title="Cancelar ingresso" loading={cancelling === item.id} disabled={cancelling !== null} onPress={() => askCancel(item)} />}
        </View>}
      />
    </SafeAreaView>
  );
}
const createStyles = (theme: AppTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.sizes.contentMaxWidth, alignSelf: 'center', padding: theme.spacing.lg, gap: theme.spacing.md },
  group: { gap: theme.spacing.md },
  status: { ...theme.typography.label, color: theme.colors.primary, borderTopWidth: theme.sizes.borderWidth, borderStyle: 'dashed', borderColor: theme.colors.border, paddingTop: theme.spacing.md },
  card: { padding: theme.spacing.md, gap: theme.spacing.sm, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, borderWidth: theme.sizes.borderWidth, borderColor: theme.colors.border },
  title: { ...theme.typography.heading, color: theme.colors.text },
  text: { ...theme.typography.body, color: theme.colors.text },
});
