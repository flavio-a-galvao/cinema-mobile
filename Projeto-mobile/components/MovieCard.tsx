import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import type { Movie } from '@/types/movie';

type MovieCardProps = { movie: Movie };

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{movie.titulo}</Text>
      {movie.genero ? <Text style={styles.metadata}>Gênero: {movie.genero}</Text> : null}
      {movie.classificacao_etaria ? <Text style={styles.metadata}>Classificação: {movie.classificacao_etaria}</Text> : null}
      {movie.duracao != null ? <Text style={styles.metadata}>Duração: {movie.duracao} min</Text> : null}
      {movie.sinopse ? <Text style={styles.synopsis} numberOfLines={3}>{movie.sinopse}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing.md, gap: theme.spacing.sm, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface },
  title: { ...theme.typography.label, color: theme.colors.text },
  metadata: { ...theme.typography.caption, color: theme.colors.muted },
  synopsis: { ...theme.typography.body, color: theme.colors.text },
});
