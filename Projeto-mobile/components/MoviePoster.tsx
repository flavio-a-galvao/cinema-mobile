import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { AppTheme } from '@/constants/theme';
function resolvePoster(value: string | null): string | null {
 if (!value) return null;
 try { const url = new URL(value, process.env.EXPO_PUBLIC_API_URL); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function MoviePoster({ url, title, large = false }: { url: string | null; title: string; large?: boolean }) {
 const { theme } = useTheme(); const styles = createStyles(theme); const [failed, setFailed] = useState<string | null>(null); const uri = resolvePoster(url);
 return <View style={[styles.frame, large && styles.large]}>{uri && failed !== uri ? <Image source={{ uri }} accessibilityLabel={title} resizeMode="cover" onError={() => setFailed(uri)} style={styles.image} /> : <Text style={styles.fallback}>CINEMAX</Text>}</View>;
}
const createStyles = (theme: AppTheme) => StyleSheet.create({ frame: { width: theme.sizes.posterWidth, height: theme.sizes.posterHeight, borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }, large: { width: '100%', height: theme.sizes.heroPosterHeight }, image: { width: '100%', height: '100%' }, fallback: { ...theme.typography.caption, color: theme.colors.muted } });
