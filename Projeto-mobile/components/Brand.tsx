import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/contexts/ThemeContext';
export function Brand({ subtitle }: { subtitle?: string }) {
 const {theme:t}=useTheme();
 return <View style={{gap:t.spacing.md}}><View style={{flexDirection:'row',alignItems:'center',gap:t.spacing.sm}}><View style={{padding:t.spacing.sm,backgroundColor:t.colors.primarySoft,borderRadius:t.radius.md}}><Ionicons name="film" size={t.sizes.iconLarge} color={t.colors.primary}/></View><Text accessibilityRole="header" style={{...t.typography.title,color:t.colors.text}}>Cine<Text style={{color:t.colors.primary}}>max</Text></Text></View>{subtitle && <Text style={{...t.typography.body,color:t.colors.muted}}>{subtitle}</Text>}</View>;
}
