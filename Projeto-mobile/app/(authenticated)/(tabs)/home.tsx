import { Brand } from '@/components/Brand';
import { MoviePoster } from '@/components/MoviePoster';
import { router, useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { MovieCard } from '@/components/MovieCard';
import { Loading } from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { routes } from '@/constants/routes';
import type { AppTheme } from '@/constants/theme';
import type { Movie } from '@/types/movie';
import { listMovies } from '@/services/movieService';
export default function HomeScreen() {
 const { theme } = useTheme(); const styles = createStyles(theme); const { authState } = useAuth();
 const focused = useIsFocused();
 const [movies, setMovies] = useState<Movie[] | null>(null); const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
 useEffect(() => { if (!focused) return; let active = true; void listMovies().then(data => { if(active) { setMovies(data); setError(false); } }, () => { if(active) setError(true); }); return () => { active = false; }; }, [attempt, focused]);
 return <Screen><Brand /><Text style={styles.muted}>Olá, {authState.user?.nome.split(' ')[0]}.</Text>
 <View style={styles.hero}>{movies?.[0] && <MoviePoster url={movies[0].poster_url} title={movies[0].titulo} large />}<Text style={styles.title}>Sua próxima história começa aqui.</Text><Text style={styles.muted}>Encontre um filme. Escolha sua sessão. Viva o cinema.</Text><Button icon="arrow-forward-outline" title="Explorar filmes" onPress={() => router.navigate(routes.catalog)} /></View>
 <Text accessibilityRole="header" style={styles.title}>No catálogo</Text>
 {error ? <ErrorState message="Não foi possível carregar os filmes." onRetry={() => { setError(false); setMovies(null); setAttempt(value => value+1); }} /> : movies === null ? <Loading /> : movies.length ? <View style={styles.grid}>{movies.slice(0,4).map(movie => <View key={movie.id_filme} style={styles.cell}><MovieCard movie={movie} /></View>)}</View> : <EmptyState title="Novas histórias em breve" message="O catálogo está vazio no momento." />}
 <Button variant="secondary" title="Meus ingressos" onPress={() => router.navigate(routes.tickets)} />
 </Screen>;
}
const createStyles = (theme: AppTheme) => StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: theme.spacing.md }, cell: { width: '48%' }, brand: { ...theme.typography.title, color: theme.colors.primary }, title: { ...theme.typography.heading, color: theme.colors.text }, muted: { ...theme.typography.body, color: theme.colors.muted }, hero: { padding: theme.spacing.lg, gap: theme.spacing.md, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface } });
