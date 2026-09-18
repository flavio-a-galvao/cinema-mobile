import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import type { AppTheme } from '@/constants/theme';
type Option = { id: number; label: string };
export function AdminSelect({ label, value, options, onChange, disabled }: { label: string; value: number | null; options: Option[]; onChange: (value: number) => void; disabled?: boolean }) {
  const { theme } = useTheme(); const styles = createStyles(theme); const [open, setOpen] = useState(false);
  const selected = options.find(option => option.id === value);
  return <View style={styles.field}>
    <Text style={styles.text}>{label}</Text>
    <Button icon="chevron-down-outline" title={selected?.label ?? 'Selecionar ' + label.toLowerCase()} variant="secondary" disabled={disabled || options.length === 0} onPress={() => setOpen(true)} />
    {options.length === 0 && <Text style={styles.text}>Nenhuma opção cadastrada.</Text>}
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.screen}><Text style={styles.title}>{label}</Text>
        <FlatList data={options} keyExtractor={item => String(item.id)} contentContainerStyle={styles.list} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: value === item.id }} onPress={() => { onChange(item.id); setOpen(false); }} style={[styles.option, value === item.id && styles.selected]}><Text style={styles.text}>{item.label}</Text></Pressable>} />
        <Button title="Voltar" variant="link" onPress={() => setOpen(false)} />
      </SafeAreaView>
    </Modal>
  </View>;
}
const createStyles = (theme: AppTheme) => StyleSheet.create({
  field: { gap: theme.spacing.sm }, screen: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background, gap: theme.spacing.md },
  title: { ...theme.typography.heading, color: theme.colors.text }, text: { ...theme.typography.body, color: theme.colors.text },
  list: { gap: theme.spacing.sm }, option: { padding: theme.spacing.md, minHeight: theme.sizes.controlMinHeight, borderRadius: theme.radius.md, borderWidth: theme.sizes.borderWidth, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  selected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
});
