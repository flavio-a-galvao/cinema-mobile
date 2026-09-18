import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/contexts/ThemeContext';
export default function MainTabs(){const {theme:t}=useTheme();return <Tabs initialRouteName="home" screenOptions={{headerShown:false,tabBarActiveTintColor:t.colors.primary,tabBarInactiveTintColor:t.colors.muted,tabBarActiveBackgroundColor:t.colors.primarySoft,tabBarItemStyle:{borderRadius:t.radius.md,marginHorizontal:t.spacing.xs},tabBarLabelStyle:{fontSize:t.typography.caption.fontSize,fontWeight:'600'},tabBarStyle:{backgroundColor:t.colors.surface,borderTopColor:t.colors.border,paddingTop:t.spacing.sm},sceneStyle:{backgroundColor:t.colors.background}}}>
<Tabs.Screen name="home" options={{title:'Início',tabBarIcon:({color,focused})=><Ionicons name={focused?'home':'home-outline'} color={color} size={t.sizes.icon}/>}}/>
<Tabs.Screen name="catalog" options={{title:'Filmes',tabBarIcon:({color,focused})=><Ionicons name={focused?'film':'film-outline'} color={color} size={t.sizes.icon}/>}}/>
<Tabs.Screen name="my-tickets" options={{title:'Ingressos',tabBarIcon:({color,focused})=><Ionicons name={focused?'ticket':'ticket-outline'} color={color} size={t.sizes.icon}/>}}/>
<Tabs.Screen name="profile" options={{title:'Perfil',tabBarIcon:({color,focused})=><Ionicons name={focused?'person-circle':'person-circle-outline'} color={color} size={t.sizes.icon}/>}}/>
</Tabs>;}
