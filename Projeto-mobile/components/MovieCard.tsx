import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { MoviePoster } from '@/components/MoviePoster';
import { useTheme } from '@/contexts/ThemeContext';
import { movieRoute } from '@/constants/routes';
import type { Movie } from '@/types/movie';
export function MovieCard({movie}:{movie:Movie}){
 const {theme:t}=useTheme();
 return <Pressable accessibilityRole="button" accessibilityLabel={'Ver '+movie.titulo} onPress={()=>router.push(movieRoute(movie.id_filme))} style={({pressed})=>({width:'100%',borderRadius:t.radius.lg,overflow:'hidden',backgroundColor:t.colors.surface,opacity:pressed?0.8:1,...t.shadow})}><MoviePoster url={movie.poster_url} title={movie.titulo} fluid/><View style={{padding:t.spacing.sm,gap:t.spacing.xs}}><Text numberOfLines={2} style={{...t.typography.label,color:t.colors.text}}>{movie.titulo}</Text><Text numberOfLines={1} style={{...t.typography.caption,color:t.colors.muted}}>{movie.genero||'Cinema'}</Text><Text style={{...t.typography.caption,color:t.colors.muted}}>{[movie.classificacao_etaria,movie.duracao!=null?movie.duracao+' min':null].filter(Boolean).join(' • ')}</Text><Text style={{...t.typography.caption,color:t.colors.primary,fontWeight:'600'}}>Ver filme ↗</Text></View></Pressable>;
}
