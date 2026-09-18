import { Notice } from '@/components/Notice';
import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AdminSections } from '@/components/AdminSections';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { AppTheme } from '@/constants/theme';
import { adminRoomRoute, routes } from '@/constants/routes';
import type { RoomSummary } from '@/types/room';
import { listRooms, deleteRoom } from '@/services/adminCinemaService';
import { adminError, confirmAdminDelete } from '@/utils/adminFeedback';
export default function AdminRoomsScreen() {
  const { theme } = useTheme(); const styles = createStyles(theme); const { authState } = useAuth(); const token = authState.token;
  const [rooms, setRooms] = useState<RoomSummary[] | null>(null); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [pending, setPending] = useState<number | null>(null); const busy = useRef(false); const request = useRef(0);
  const load = useCallback(async () => {
    if (!token) return; const current = ++request.current;
    try { const data = await listRooms(token); if (current === request.current) { setRooms(data); setError(''); } }
    catch (cause) { if (current === request.current) setError(adminError(cause)); }
  }, [token]);
  useFocusEffect(useCallback(() => { void load(); return () => { request.current++; }; }, [load]));
  async function remove(room: RoomSummary) {
    if (!token || busy.current) return; busy.current = true; setPending(room.id_sala); setError(''); setMessage('');
    try { await deleteRoom(room.id_sala, token); setRooms(current => current?.filter(item => item.id_sala !== room.id_sala) ?? []); setMessage('Sala excluída com sucesso.'); }
    catch (cause) { setError(adminError(cause)); } finally { busy.current = false; setPending(null); }
  }
  return <Screen><AdminSections current="rooms" /><Text style={styles.title}>Gerenciar salas</Text>
    <Button icon="add-outline" title="Nova sala" disabled={pending !== null} onPress={() => router.push(adminRoomRoute())} />
    {!!error && <ErrorState message={error} onRetry={() => { void load(); }} />}{!!message && <Notice message={message} />}
    {rooms === null && !error && <Loading />}{rooms?.length === 0 && <EmptyState title="Nenhuma sala cadastrada" message="Crie uma sala para organizar as sessões do Cinemax." />}
    {rooms?.map(room => <View key={room.id_sala} style={styles.card}>
      <Text style={styles.title}>{room.nome || 'Sala sem nome'}</Text><Text style={styles.text}>Capacidade: {room.capacidade} • Assentos: {room.quantidade_assentos}</Text>
      <Button title="Editar e gerar assentos" variant="secondary" disabled={pending !== null} onPress={() => router.push(adminRoomRoute(room.id_sala))} />
      <Button title="Excluir sala" icon="trash-outline" variant="danger" loading={pending === room.id_sala} disabled={pending !== null} onPress={() => confirmAdminDelete(room.nome || 'Sala', () => { void remove(room); })} />
    </View>)}
    <Button title="Atualizar salas" variant="secondary" disabled={pending !== null} onPress={() => { setRooms(null); setError(''); void load(); }} />
    <Button title="Voltar ao perfil" variant="link" onPress={() => router.navigate(routes.profile)} />
  </Screen>;
}
const createStyles = (theme: AppTheme) => StyleSheet.create({ title: { ...theme.typography.heading, color: theme.colors.text }, text: { ...theme.typography.body, color: theme.colors.muted }, card: { borderWidth: theme.sizes.borderWidth, borderColor: theme.colors.border, gap: theme.spacing.sm, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg } });
