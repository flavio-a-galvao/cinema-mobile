import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/contexts/ThemeContext';

function resolvePoster(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, process.env.EXPO_PUBLIC_API_URL);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

type Props = { url: string | null; title: string; large?: boolean; fluid?: boolean; banner?: boolean };
export function MoviePoster({ url, title, large = false, fluid = false, banner = false }: Props) {
  const { theme: t } = useTheme();
  const [failed, setFailed] = useState<string | null>(null);
  const uri = resolvePoster(url);
  return <View style={{
    width: banner || large || fluid ? '100%' : t.sizes.posterWidth,
    aspectRatio: banner ? 16 / 9 : 2 / 3,
    maxWidth: large ? t.sizes.heroPosterHeight : undefined,
    alignSelf: large ? 'center' : undefined,
    borderRadius: t.radius.md, overflow: 'hidden', backgroundColor: t.colors.elevated,
    alignItems: 'center', justifyContent: 'center', gap: t.spacing.sm,
  }}>
    {uri && failed !== uri ? <>
      {large && <Image source={{ uri }} accessible={false} blurRadius={t.spacing.md} resizeMode="cover" style={[StyleSheet.absoluteFill, { opacity: t.opacity.disabled }]} />}
      <Image source={{ uri }} accessibilityLabel={title} resizeMode={large ? 'contain' : 'cover'}
        onError={() => setFailed(uri)} style={{ width: '100%', height: '100%' }} />
    </> : <><Ionicons name="film-outline" color={t.colors.primary} size={t.sizes.iconLarge} /><Text style={{ ...t.typography.caption, color: t.colors.muted }}>CINEMAX</Text></>}
  </View>;
}
