import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
export default function MainTabs() {
 const { theme } = useTheme();
 return <Tabs initialRouteName="home" screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.primary, tabBarInactiveTintColor: theme.colors.muted, tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }, sceneStyle: { backgroundColor: theme.colors.background } }}>
 <Tabs.Screen name="home" options={{ title: 'Início', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: theme.sizes.icon }}>⌂</Text> }} />
 <Tabs.Screen name="catalog" options={{ title: 'Filmes', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: theme.sizes.icon }}>▣</Text> }} />
 <Tabs.Screen name="my-tickets" options={{ title: 'Ingressos', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: theme.sizes.icon }}>▤</Text> }} />
 <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: theme.sizes.icon }}>○</Text> }} />
 </Tabs>;
}
