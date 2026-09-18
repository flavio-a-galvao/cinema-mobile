import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/contexts/ThemeContext';
function resolvePoster(value:string|null){if(!value)return null;try{const url=new URL(value,process.env.EXPO_PUBLIC_API_URL);return ['http:','https:'].includes(url.protocol)?url.href:null;}catch{return null;}}
export function MoviePoster({url,title,large=false,fluid=false}:{url:string|null;title:string;large?:boolean;fluid?:boolean}){
 const {theme:t}=useTheme();const [failed,setFailed]=useState<string|null>(null);const uri=resolvePoster(url);
 return <View style={{width:large||fluid?'100%':t.sizes.posterWidth,aspectRatio:2/3,maxWidth:large?t.sizes.heroPosterHeight:undefined,alignSelf:large?'center':undefined,borderRadius:t.radius.md,overflow:'hidden',backgroundColor:t.colors.elevated,alignItems:'center',justifyContent:'center',gap:t.spacing.sm}}>{uri&&failed!==uri?<Image source={{uri}} accessibilityLabel={title} resizeMode="cover" onError={()=>setFailed(uri)} style={StyleSheet.absoluteFill}/>:<><Ionicons name="film-outline" color={t.colors.primary} size={t.sizes.iconLarge}/><Text style={{...t.typography.caption,color:t.colors.muted}}>CINEMAX</Text></>}</View>;
}
