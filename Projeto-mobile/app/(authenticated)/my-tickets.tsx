import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import { theme } from '@/constants/theme';
import { listMyPurchases } from '@/services/paymentService';
import type { Purchase } from '@/types/payment';

export default function MyTicketsScreen() {
  const { authState } = useAuth();
  const { checkout } = useCheckout();
  const token = authState.token;
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          <Button title="Voltar à minha conta" onPress={() => router.replace('./account')} />
          {checkout?.status === 'ready' && <Button title="Continuar pagamento pendente" onPress={() => router.push('./payment')} />}
          {loading && <Loading message="Carregando seus ingressos..." />}
          {error && <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />}
        </View>}
        ListEmptyComponent={!loading && !error ? <EmptyState title="Nenhum ingresso encontrado" message="Escolha um filme no catálogo para começar." /> : null}
        renderItem={({ item }) => <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>{item.filme}</Text>
          <Text style={styles.text}>Ingresso #{item.id}</Text>
          <Text style={styles.text}>Sessão — data/hora: {item.sessao}</Text>
          <Text style={styles.text}>Sala: não informada pela API</Text>
          <Text style={styles.text}>Assento: {item.assento}</Text>
          <Text style={styles.text}>Compra: {item.dataCompra}</Text>
          <Text style={styles.text}>{item.metodo === 'Nao informado' ? 'Sem pagamento registrado' : `Pagamento registrado: ${item.metodo}`}</Text>
          <Text style={styles.text}>Valor registrado: {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        </View>}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.sizes.contentMaxWidth, alignSelf: 'center', padding: theme.spacing.lg, gap: theme.spacing.md },
  group: { gap: theme.spacing.md },
  card: { padding: theme.spacing.md, gap: theme.spacing.sm, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface },
  title: { ...theme.typography.heading, color: theme.colors.text },
  text: { ...theme.typography.body, color: theme.colors.text },
});
