import { router } from 'expo-router';
import { View, Text } from 'react-native';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { adminRoutes, routes } from '@/constants/routes';
export function AdminSections({ current }: { current: 'movies' | 'rooms' | 'sessions' }) {
  const { theme } = useTheme();
  const sections = [{ key: 'movies', title: 'Filmes', href: routes.admin }, { key: 'rooms', title: 'Salas', href: adminRoutes.rooms }, { key: 'sessions', title: 'Sessões', href: adminRoutes.sessions }];
  return <View style={{ gap: theme.spacing.md }}><Text style={{ ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700' }}>CINEMAX / ADMINISTRAÇÃO</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
    {sections.map(section => <View key={section.key} style={{ flexGrow: 1 }}><Button title={section.title} variant={current === section.key ? 'primary' : 'secondary'} onPress={() => { if (current !== section.key) router.replace(section.href); }} /></View>)}
  </View></View>;
}
