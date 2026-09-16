import { router } from 'expo-router';
import { sessionRoute } from '@/constants/routes';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { listSessionsByMovie } from '@/services/sessionService';
import type { MovieSession } from '@/types/session';

type SessionsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; sessions: MovieSession[] };

function formatSchedule(value: string | null): string {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : 'Não informado';
}

function formatPrice(value: MovieSession['preco']): string {
  if (value === null || (typeof value === 'string' && !value.trim())) return 'Não informado';
  const price = Number(value);
  return Number.isFinite(price)
    ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'Não informado';
}

export function MovieSessions({ movieId }: { movieId: number }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [state, setState] = useState<SessionsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void listSessionsByMovie(movieId).then(
      (sessions) => { if (active) setState({ status: 'success', sessions }); },
      () => { if (active) setState({ status: 'error' }); },
    );
    return () => { active = false; };
  }, [movieId, attempt]);

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>Sessões</Text>
      {state.status === 'loading' && <Loading message="Carregando sessões..." />}
      {state.status === 'error' && <ErrorState message="Não foi possível carregar as sessões. Tente novamente." onRetry={() => {
        setState({ status: 'loading' });
        setAttempt((value) => value + 1);
      }} />}
      {state.status === 'success' && (state.sessions.length === 0 ? (
        <EmptyState title="Nenhuma sessão disponível" message="Este filme ainda não possui sessões cadastradas." />
      ) : state.sessions.map((session) => (
        <Pressable key={session.id_sessao} accessibilityRole="button" accessibilityLabel={formatSchedule(session.horario)} onPress={() => router.push(sessionRoute(session.id_sessao))} style={styles.session}>
          <Text style={styles.text}>{formatSchedule(session.horario)}</Text>
          <Text style={styles.text}>Sala {session.id_sala ?? 'Não informada'}</Text>
          <Text style={styles.text}>{formatPrice(session.preco)}</Text>
          <Text style={styles.action}>Escolher assentos →</Text>
        </Pressable>
      )))}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { gap: theme.spacing.md },
  title: { ...theme.typography.heading, color: theme.colors.text },
  session: { padding: theme.spacing.md, gap: theme.spacing.sm, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface },
  action: { ...theme.typography.label, color: theme.colors.primary },
  text: { ...theme.typography.body, color: theme.colors.text },
});
