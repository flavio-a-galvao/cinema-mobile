import { isAxiosError } from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { MovieSessions } from '@/components/MovieSessions';
import { Screen } from '@/components/Screen';
import { theme } from '@/constants/theme';
import { getMovieById } from '@/services/movieService';
import type { Movie } from '@/types/movie';

type MovieState =
  | { status: 'loading' | 'error' | 'notFound' }
  | { status: 'success'; movie: Movie };

function MovieDetails({ id }: { id: number }) {
  const [state, setState] = useState<MovieState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void getMovieById(id).then(
      (movie) => { if (active) setState({ status: 'success', movie }); },
      (error: unknown) => {
        if (active) {
          setState({ status: isAxiosError(error) && error.response?.status === 404 ? 'notFound' : 'error' });
        }
      },
    );
    return () => { active = false; };
  }, [id, attempt]);

  if (state.status === 'loading') return <Loading message="Carregando filme..." />;
  if (state.status === 'notFound') {
    return <EmptyState title="Filme não encontrado" message="Este filme não está disponível no catálogo." />;
  }
  if (state.status === 'error') {
    return <ErrorState message="Não foi possível carregar o filme. Tente novamente." onRetry={() => {
      setState({ status: 'loading' });
      setAttempt((value) => value + 1);
    }} />;
  }
  if (state.status !== 'success') return null;
  const { movie } = state;
  const releaseDate = movie.data_lancamento ? new Date(movie.data_lancamento) : null;

  return (
    <>
      <Text accessibilityRole="header" style={styles.title}>{movie.titulo}</Text>
      <Text style={styles.text}>Gênero: {movie.genero || 'Não informado'}</Text>
      <Text style={styles.text}>Classificação: {movie.classificacao_etaria || 'Não informada'}</Text>
      <Text style={styles.text}>Duração: {movie.duracao != null ? `${movie.duracao} min` : 'Não informada'}</Text>
      <Text style={styles.text}>Lançamento: {releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não informado'}</Text>
      <Text accessibilityRole="header" style={styles.subtitle}>Sinopse</Text>
      <Text style={styles.text}>{movie.sinopse || 'Sinopse não disponível.'}</Text>
      <MovieSessions key={movie.id_filme} movieId={movie.id_filme} />
    </>
  );
}

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const movieId = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : NaN;
  const validId = Number.isSafeInteger(movieId) && movieId > 0;

  return (
    <Screen>
      <Button title="Voltar ao catálogo" onPress={() => router.replace('../catalog')} />
      {validId ? <MovieDetails key={movieId} id={movieId} /> : (
        <EmptyState title="Filme não encontrado" message="O identificador do filme é inválido." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
  subtitle: { ...theme.typography.label, color: theme.colors.text },
  text: { ...theme.typography.body, color: theme.colors.text },
});
