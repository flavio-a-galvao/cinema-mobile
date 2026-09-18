import { useState } from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
/** Matriz decorativa determinística. Não codifica credencial nem permite entrada. */
export function TicketCode({id}:{id:number}){
 const [open,setOpen]=useState(false);const {theme:t}=useTheme();
 const dark=(row:number,col:number)=>{for(const [y,x] of [[0,0],[0,14],[14,0]]){if(row>=y&&row<y+7&&col>=x&&col<x+7){const r=row-y,c=col-x;return r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4);}}return ((Math.imul(row+1,31)+Math.imul(col+1,17)+Math.imul(id,13))^(row*col+id))%3===0;};
 return <View style={{gap:t.spacing.sm}}><Button variant="secondary" icon="qr-code-outline" title={open?'Ocultar código visual':'Ver QR simulado'} accessibilityState={{expanded:open}} onPress={()=>setOpen(v=>!v)}/>{open&&<View style={{alignItems:'center',gap:t.spacing.sm,padding:t.spacing.md,backgroundColor:t.colors.elevated,borderRadius:t.radius.md}}><View accessible accessibilityLabel="QR ilustrativo, sem validade para entrada" style={{padding:t.spacing.md,backgroundColor:t.colors.surface}}>{Array.from({length:21},(_,row)=><View key={row} style={{flexDirection:'row'}}>{Array.from({length:21},(_,col)=><View key={col} style={{width:t.sizes.qr/21,height:t.sizes.qr/21,backgroundColor:dark(row,col)?t.colors.text:t.colors.surface}}/>)}</View>)}</View><Text style={{...t.typography.caption,color:t.colors.muted,textAlign:'center'}}>QR simulado • sem validade para entrada</Text></View>}</View>;
}
