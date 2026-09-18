import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MoviePoster } from '@/components/MoviePoster';
import { useTheme } from '@/contexts/ThemeContext';
import { movieRoute } from '@/constants/routes';
import type { AppTheme } from '@/constants/theme';
import type { Movie } from '@/types/movie';
export function MovieCard({ movie }: { movie: Movie }) {
 const { theme } = useTheme(); const styles = createStyles(theme);
 return <Pressable accessibilityRole="button" accessibilityLabel={'Ver '+movie.titulo} onPress={() => router.push(movieRoute(movie.id_filme))} style={styles.card}>
 <MoviePoster url={movie.poster_url} title={movie.titulo} /><View style={styles.info}>
 <Text style={styles.title} numberOfLines={2}>{movie.titulo}</Text>
 <Text style={styles.meta}>{movie.genero || 'Cinema'}</Text>
 <Text style={styles.meta}>{[movie.classificacao_etaria && 'Classificação '+movie.classificacao_etaria, movie.duracao != null && movie.duracao+' min'].filter(Boolean).join(' • ')}</Text>
 <Text style={styles.action}>Ver filme →</Text></View></Pressable>;
}
const createStyles = (theme: AppTheme) => StyleSheet.create({ card: { flexDirection: 'row', gap: theme.spacing.md, padding: theme.spacing.sm, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }, info: { flex: 1, justifyContent: 'center', gap: theme.spacing.sm }, title: { ...theme.typography.label, color: theme.colors.text }, meta: { ...theme.typography.caption, color: theme.colors.muted }, action: { ...theme.typography.label, color: theme.colors.primary } });
