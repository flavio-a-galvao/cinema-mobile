import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { isAxiosError } from 'axios';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { MoviePoster } from '@/components/MoviePoster';
import { Loading } from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { adminMovieRoute, movieRoute, routes } from '@/constants/routes';
import type { AppTheme } from '@/constants/theme';
import type { Movie } from '@/types/movie';
import { deleteMovie, listAdminMovies } from '@/services/movieService';

export default function AdminScreen() {
  const { theme } = useTheme(); const styles = createStyles(theme); const { authState } = useAuth();
  const token = authState.token;
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [pending, setPending] = useState<number | null>(null); const busy = useRef(false);
  const request = useRef(0);
  const load = useCallback(async () => {
    if (!token) return;
    const current = ++request.current;
    try { const data = await listAdminMovies(token); if (current === request.current) { setMovies(data); setError(''); } }
    catch { if (current === request.current) setError('Não foi possível carregar os filmes.'); }
  }, [token]);
  useFocusEffect(useCallback(() => { void load(); return () => { request.current++; }; }, [load]));
  async function remove(movie: Movie) {
    if (!token || busy.current) return;
    busy.current = true; setPending(movie.id_filme); setError(''); setMessage('');
    try {
      await deleteMovie(movie.id_filme, token);
      setMovies(current => current?.filter(item => item.id_filme !== movie.id_filme) ?? []);
      setMessage('Filme excluído com sucesso.');
    } catch (cause) {
      setError(isAxiosError(cause) && cause.response?.status === 409
        ? 'Este filme possui sessões cadastradas e não pode ser excluído.' : 'Não foi possível excluir o filme. Tente novamente.');
    } finally { busy.current = false; setPending(null); }
  }
  function confirmDelete(movie: Movie) {
    const message = 'Excluir “' + movie.titulo + '”? Esta ação não pode ser desfeita.';
    if (Platform.OS === 'web') { if (window.confirm(message)) void remove(movie); return; }
    Alert.alert('Excluir filme', message, [{ text: 'Voltar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => { void remove(movie); } }]);
  }
  return <Screen>
    <Text style={styles.title}>Gerenciar filmes</Text>
    <Button title="Novo filme" disabled={pending !== null} onPress={() => router.push(adminMovieRoute())} />
    {!!message && <Text accessibilityRole="alert" style={styles.text}>{message}</Text>}
    {!!error && <ErrorState message={error} onRetry={() => { void load(); }} />}
    {movies === null && !error && <Loading />}
    {movies?.length === 0 && <EmptyState title="Nenhum filme cadastrado" message="Adicione o primeiro filme ao catálogo Cinemax." />}
    {movies?.map(movie => <View key={movie.id_filme} style={styles.card}>
      <View style={styles.row}><MoviePoster url={movie.poster_url} title={movie.titulo} /><View style={styles.info}>
        <Text style={styles.title}>{movie.titulo}</Text><Text style={styles.text}>{[movie.genero, movie.duracao ? movie.duracao + ' min' : null, movie.classificacao_etaria].filter(Boolean).join(' • ')}</Text>
      </View></View>
      <Button title="Visualizar" variant="link" onPress={() => router.push(movieRoute(movie.id_filme))} />
      <Button title="Editar" variant="secondary" disabled={pending !== null} onPress={() => router.push(adminMovieRoute(movie.id_filme))} />
      <Button title="Excluir" variant="secondary" loading={pending === movie.id_filme} disabled={pending !== null} onPress={() => confirmDelete(movie)} />
    </View>)}
    <Button title="Voltar ao perfil" variant="link" onPress={() => router.navigate(routes.profile)} />
  </Screen>;
}
const createStyles = (theme: AppTheme) => StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text }, text: { ...theme.typography.body, color: theme.colors.muted },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.md, gap: theme.spacing.sm },
  row: { flexDirection: 'row', gap: theme.spacing.md }, info: { flex: 1, gap: theme.spacing.sm },
});
