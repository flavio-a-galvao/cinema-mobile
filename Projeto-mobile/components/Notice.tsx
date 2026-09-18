import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/contexts/ThemeContext';
export function Notice({message,tone='success'}:{message:string;tone?:'success'|'warning'|'error'}) {
 const {theme:t}=useTheme();const color=t.colors[tone];const background=tone==='success'?t.colors.successSoft:tone==='warning'?t.colors.warningSoft:t.colors.errorSoft;
 return <View accessibilityLiveRegion="polite" style={{flexDirection:'row',gap:t.spacing.sm,padding:t.spacing.md,borderRadius:t.radius.md,backgroundColor:background}}><Ionicons name={tone==='success'?'checkmark-circle-outline':'information-circle-outline'} color={color} size={t.sizes.icon}/><Text style={{...t.typography.caption,color,flex:1}}>{message}</Text></View>;
}
