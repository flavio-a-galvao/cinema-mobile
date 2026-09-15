import { isAxiosError } from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { theme } from '@/constants/theme';
import { getMovieById } from '@/services/movieService';
import { getSessionById } from '@/services/sessionService';
import type { MovieSession } from '@/types/session';

type SessionState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'notFound' }
  | { status: 'success'; session: MovieSession; movieTitle: string };

function SessionDetails({ id }: { id: number }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void getSessionById(id).then(
      async (session) => {
        let movieTitle = 'Filme não informado';
        if (session.id_filme !== null) {
          try {
            const movie = await getMovieById(session.id_filme);
            movieTitle = movie.titulo;
          } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.status === 404) {
              movieTitle = `Filme indisponível (ID: ${session.id_filme})`;
            } else {
              if (active) setState({ status: 'error' });
              return;
            }
          }
        }
        if (active) setState({ status: 'success', session, movieTitle });
      },
      (error: unknown) => {
        if (active) setState({ status: isAxiosError(error) && error.response?.status === 404 ? 'notFound' : 'error' });
      },
    );
    return () => { active = false; };
  }, [id, attempt]);

  if (state.status === 'loading') return <Loading message="Carregando sessão..." />;
  if (state.status === 'notFound') return <EmptyState title="Sessão não encontrada" message="Esta sessão não está disponível." />;
  if (state.status === 'error') {
    return <ErrorState message="Não foi possível carregar os dados da sessão. Tente novamente." onRetry={() => {
      setState({ status: 'loading' });
      setAttempt((value) => value + 1);
    }} />;
  }

  const { session, movieTitle } = state;
  const date = session.horario ? new Date(session.horario) : null;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null;
  const price = session.preco === null || String(session.preco).trim() === '' ? NaN : Number(session.preco);

  return (
    <>
      <Text accessibilityRole="header" style={styles.title}>{movieTitle}</Text>
      <Text style={styles.text}>Data: {validDate?.toLocaleDateString('pt-BR') ?? 'Não informada'}</Text>
      <Text style={styles.text}>Horário: {validDate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? 'Não informado'}</Text>
      <Text style={styles.text}>Sala (ID): {session.id_sala ?? 'Não informada'}</Text>
      <Text style={styles.text}>Preço: {Number.isFinite(price) ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não informado'}</Text>
    </>
  );
}

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const sessionId = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : NaN;
  const validId = Number.isSafeInteger(sessionId) && sessionId > 0;

  return (
    <Screen>
      <Button title="Voltar" onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace('../catalog');
      }} />
      <Text accessibilityRole="header" style={styles.title}>Detalhes da sessão</Text>
      {validId ? <SessionDetails key={sessionId} id={sessionId} /> : (
        <EmptyState title="Sessão não encontrada" message="O identificador da sessão é inválido." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
  text: { ...theme.typography.body, color: theme.colors.text },
});
