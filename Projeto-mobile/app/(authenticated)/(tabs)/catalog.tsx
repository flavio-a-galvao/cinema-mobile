import { Input } from '@/components/Input';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { MovieCard } from '@/components/MovieCard';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import * as movieService from '@/services/movieService';
import type { Movie } from '@/types/movie';

export default function CatalogScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const filtered = movies.filter(movie => (movie.titulo + ' ' + (movie.genero ?? '')).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()));
  const requestId = useRef(0);

  const fetchMovies = useCallback(async (): Promise<void> => {
    const currentRequest = ++requestId.current;
    await movieService.listMovies().then(
      (data) => {
        if (currentRequest === requestId.current) { setMovies(data); setError(null); }
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

  useFocusEffect(useCallback(() => {
    void fetchMovies();
    return () => { requestId.current += 1; };
  }, [fetchMovies]));

  function loadMovies(refresh = false): void {
    setError(null);
    setRefreshing(refresh);
    setIsLoading(!refresh);
    void fetchMovies();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={filtered}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(movie) => String(movie.id_filme)}
        contentContainerStyle={styles.content}
        refreshing={refreshing}
        onRefresh={() => { void loadMovies(true); }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>Filmes</Text><Text style={{ ...theme.typography.body, color: theme.colors.muted }}>Encontre sua próxima sessão.</Text><Input label="Pesquisar filmes" placeholder="Título ou gênero" value={query} onChangeText={setQuery} autoCorrect={false} />
            {isLoading && <Loading message="Carregando filmes..." />}
            {error && <ErrorState message={error} onRetry={() => { void loadMovies(); }} />}
          </View>
        }
        ListEmptyComponent={!isLoading && !refreshing && !error ? (
          <EmptyState title={query ? "Nenhum resultado" : "Novas histórias em breve"} message={query ? "Tente outro título ou gênero." : "Puxe para atualizar o catálogo."} />
        ) : null}
        renderItem={({ item }) => <View style={{ width: '48%', flexGrow: 0 }}><MovieCard movie={item} /></View>}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.sizes.contentMaxWidth, alignSelf: 'center', padding: theme.spacing.lg, gap: theme.spacing.md },
  header: { gap: theme.spacing.md },
  title: { ...theme.typography.heading, color: theme.colors.text },
});
