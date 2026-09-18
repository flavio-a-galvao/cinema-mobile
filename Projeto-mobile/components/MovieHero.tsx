import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MoviePoster } from '@/components/MoviePoster';
import { useTheme } from '@/contexts/ThemeContext';
import { movieRoute } from '@/constants/routes';
import type { Movie } from '@/types/movie';

export function MovieHero({ movies }: { movies: Movie[] }) {
  const withPoster = movies.filter(movie => !!movie.poster_url?.trim());
  const featured = (withPoster.length ? withPoster : movies).slice(0, 6);
  if (!featured.length) return null;
  return <Carousel key={featured.map(movie => movie.id_filme).join(',')} movies={featured} />;
}

function Carousel({ movies }: { movies: Movie[] }) {
  const { theme: t } = useTheme();
  const list = useRef<FlatList<Movie>>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  return <View style={{ gap: t.spacing.sm }} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    {width > 0 && <FlatList key={width} ref={list} horizontal pagingEnabled data={movies}
      initialScrollIndex={page} getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      keyExtractor={movie => String(movie.id_filme)} showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={event => setPage(Math.max(0, Math.min(movies.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))))}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={'Ver filme: ' + item.titulo}
        onPress={() => router.push(movieRoute(item.id_filme))}
        style={{ width, borderRadius: t.radius.lg, overflow: 'hidden', backgroundColor: t.colors.surface }}>
        <View><MoviePoster url={item.poster_url} title={item.titulo} banner />
          <View style={[StyleSheet.absoluteFill, { top: undefined, backgroundColor: t.colors.heroOverlay, padding: t.spacing.md, gap: t.spacing.xs }]}>
            <Text style={{ ...t.typography.caption, color: t.colors.heroText }}>DESTAQUE CINEMAX</Text>
            <Text numberOfLines={2} style={{ ...t.typography.heading, color: t.colors.heroText }}>{item.titulo}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: t.spacing.md, gap: t.spacing.sm }}>
          <Text numberOfLines={2} style={{ ...t.typography.caption, color: t.colors.muted, flex: 1 }}>{[item.genero, item.duracao ? item.duracao + ' min' : null].filter(Boolean).join(' • ')}</Text>
          <Text style={{ ...t.typography.label, color: t.colors.primary }}>Ver filme</Text>
          <Ionicons name="arrow-forward" size={t.sizes.icon} color={t.colors.primary} />
        </View>
      </Pressable>} />}
    {movies.length > 1 && <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      {movies.map((movie, index) => <Pressable key={movie.id_filme} accessibilityRole="button"
        accessibilityLabel={'Destaque ' + (index + 1) + ': ' + movie.titulo} accessibilityState={{ selected: page === index }}
        onPress={() => { setPage(index); list.current?.scrollToIndex({ index, animated: true }); }}
        style={{ flex: 1, maxWidth: t.sizes.controlMinHeight, minHeight: t.sizes.controlMinHeight, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: page === index ? t.spacing.lg : t.spacing.sm, height: t.spacing.sm, borderRadius: t.radius.pill, backgroundColor: page === index ? t.colors.primary : t.colors.border }} />
      </Pressable>)}
    </View>}
  </View>;
}
