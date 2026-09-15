import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { MovieCard } from '@/components/MovieCard';
import { theme } from '@/constants/theme';
import * as movieService from '@/services/movieService';
import type { Movie } from '@/types/movie';

export default function CatalogScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchMovies = useCallback(async (): Promise<void> => {
    const currentRequest = ++requestId.current;
    await movieService.listMovies().then(
      (data) => {
        if (currentRequest === requestId.current) setMovies(data);
      },
      () => {
        if (currentRequest === requestId.current) {
          setError('Não foi possível carregar os filmes. Tente novamente.');
        }
      },
    ).finally(() => {
      if (currentRequest === requestId.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    });
  }, []);

  useEffect(() => {
    void fetchMovies();
    return () => { requestId.current += 1; };
  }, [fetchMovies]);

  function loadMovies(refresh = false): void {
    setError(null);
    setRefreshing(refresh);
    setIsLoading(!refresh);
    void fetchMovies();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={movies}
        keyExtractor={(movie) => String(movie.id_filme)}
        contentContainerStyle={styles.content}
        refreshing={refreshing}
        onRefresh={() => { void loadMovies(true); }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>Catálogo de filmes</Text>
            <Button title="Voltar à minha conta" onPress={() => router.replace('/account')} />
            {isLoading && <Loading message="Carregando filmes..." />}
            {error && <ErrorState message={error} onRetry={() => { void loadMovies(); }} />}
          </View>
        }
        ListEmptyComponent={!isLoading && !refreshing && !error ? (
          <EmptyState title="Nenhum filme disponível" message="Puxe para atualizar e consultar o catálogo novamente." />
        ) : null}
        renderItem={({ item }) => <MovieCard movie={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.sizes.contentMaxWidth, alignSelf: 'center', padding: theme.spacing.lg, gap: theme.spacing.md },
  header: { gap: theme.spacing.md },
  title: { ...theme.typography.heading, color: theme.colors.text },
});
