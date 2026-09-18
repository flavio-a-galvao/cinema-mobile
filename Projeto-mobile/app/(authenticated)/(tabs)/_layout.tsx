import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];
const tabs: { name: string; title: string; icon: IconName; outline: IconName }[] = [
  { name: 'home', title: 'Início', icon: 'home', outline: 'home-outline' },
  { name: 'catalog', title: 'Filmes', icon: 'film', outline: 'film-outline' },
  { name: 'my-tickets', title: 'Ingressos', icon: 'ticket', outline: 'ticket-outline' },
  { name: 'profile', title: 'Perfil', icon: 'person-circle', outline: 'person-circle-outline' },
];
export default function MainTabs() {
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();
  return <Tabs initialRouteName="home" screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: t.colors.primary,
    tabBarInactiveTintColor: t.colors.muted,
    tabBarLabelPosition: 'below-icon',
    tabBarLabelStyle: { fontSize: t.typography.caption.fontSize, fontWeight: '600', marginTop: t.spacing.xs },
    tabBarStyle: { height: t.sizes.tabHeight + insets.bottom, paddingBottom: Math.max(insets.bottom, t.spacing.sm), paddingTop: t.spacing.sm, backgroundColor: t.colors.surface, borderTopColor: t.colors.border, borderTopWidth: t.sizes.borderWidth, elevation: 0 },
    sceneStyle: { backgroundColor: t.colors.background },
  }}>
    {tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title,
      tabBarIcon: ({ color, focused }) => <View style={{ paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.xs, borderRadius: t.radius.pill, backgroundColor: focused ? t.colors.primarySoft : 'transparent' }}><Ionicons name={focused ? tab.icon : tab.outline} color={color} size={t.sizes.tabIcon} /></View>,
    }} />)}
  </Tabs>;
}
