import { Notice } from '@/components/Notice';
import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loading } from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { AppTheme } from '@/constants/theme';
import { adminRoutes } from '@/constants/routes';
import { listRooms, saveRoom, generateSeats } from '@/services/adminCinemaService';
import { adminError } from '@/utils/adminFeedback';
function RoomEditor({ id }: { id?: number }) {
  const { theme } = useTheme(); const styles = createStyles(theme); const { authState } = useAuth(); const token = authState.token;
  const [savedId, setSavedId] = useState(id); const [nome, setNome] = useState(''); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(!!id); const [loadError, setLoadError] = useState(''); const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<'save' | 'generate' | null>(null); const busy = useRef(false); const [dirty, setDirty] = useState(!id);
  const savedValues = useRef<{ nome: string; capacidade: number } | null>(null);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => {
    if (!id || !token) return; let active = true;
    void listRooms(token).then(rooms => {
      if (!active) return; const room = rooms.find(item => item.id_sala === id);
      if (!room) { setLoadError('Sala não encontrada.'); return; }
      savedValues.current = { nome: room.nome ?? '', capacidade: room.capacidade }; setNome(room.nome ?? ''); setTotal(room.quantidade_assentos); setDirty(false); setLoadError('');
    }, cause => { if (active) setLoadError(adminError(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, token, attempt]);
  async function save() {
    if (!token || busy.current) return;
    if (total > 48) { setError('Esta sala possui mais de 48 assentos e precisa de revisão manual. Nenhum dado foi alterado.'); return; }
    if (savedId && savedValues.current?.nome === nome.trim()) { setError(''); setDirty(false); setMessage('A sala já está atualizada.'); return; }
    if (nome.length > 50) { setError('O nome da sala deve ter no máximo 50 caracteres.'); return; }
    const capacity = 48;
    if (!nome.trim()) { setError('Informe o nome da sala.'); return; }
    busy.current = true; setPending('save'); setError(''); setMessage('');
    try { const room = await saveRoom({ nome: nome.trim(), capacidade: capacity }, token, savedId); savedValues.current = { nome: nome.trim(), capacidade: capacity }; setSavedId(room.id_sala); setDirty(false); setMessage('Sala salva com sucesso.'); }
    catch (cause) { setError(adminError(cause)); } finally { busy.current = false; setPending(null); }
  }
  async function generate() {
    if (!token || !savedId || busy.current || dirty) return; busy.current = true; setPending('generate'); setError(''); setMessage('');
    try { const result = await generateSeats(savedId, token); setTotal(result.total); setMessage(result.criados ? result.criados + ' assentos criados. Total: ' + result.total + '.' : 'Os assentos A1–F8 já estão cadastrados. Nenhuma duplicação.'); }
    catch (cause) { setError(adminError(cause)); } finally { busy.current = false; setPending(null); }
  }
  if (loading) return <Screen><Loading /></Screen>;
  if (loadError) return <Screen><ErrorState message={loadError} onRetry={() => { setLoading(true); setAttempt(value => value + 1); }} /><Button title="Voltar" onPress={() => router.replace(adminRoutes.rooms)} /></Screen>;
  return <Screen><Text style={styles.title}>{savedId ? 'Editar sala' : 'Nova sala'}</Text>
    <Input label="Nome da sala" value={nome} maxLength={50} editable={!pending} onChangeText={value => { setNome(value); setDirty(true); setMessage(''); }} />
    <Notice tone="warning" message="48 lugares • 6 fileiras × 8 assentos" />
    {total > 48 && <Notice tone="warning" message="Esta sala possui mais de 48 assentos. Cadastro preservado para revisão manual." />}
    <Text style={styles.text}>Assentos cadastrados: {total}</Text>
    {!!error && <ErrorState message={error} />}{!!message && <Notice message={message} />}
    <Button icon="checkmark-outline" title="Salvar sala" loading={pending === 'save'} disabled={pending !== null} onPress={() => { void save(); }} />
    <Text style={styles.title}>Mapa de assentos</Text><Text style={styles.text}>Fileiras A a F, com 8 assentos por fileira. A geração completa somente os lugares que faltam e preserva os existentes.</Text>
    {dirty && <Text style={styles.text}>Salve a sala antes de gerar os assentos.</Text>}
    <Button title="Gerar assentos A1–F8" variant="secondary" loading={pending === 'generate'} disabled={!savedId || dirty || pending !== null || total > 48} onPress={() => { void generate(); }} />
    <Button title="Voltar às salas" variant="link" disabled={pending !== null} onPress={() => router.replace(adminRoutes.rooms)} />
  </Screen>;
}
export default function AdminRoomScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const roomId = id ? Number(id) : undefined;
  if (roomId !== undefined && (!Number.isSafeInteger(roomId) || roomId <= 0)) return <Screen><ErrorState message="Sala não encontrada." /><Button title="Voltar" onPress={() => router.replace(adminRoutes.rooms)} /></Screen>;
  return <RoomEditor key={id ?? 'new'} id={roomId} />;
}
const createStyles = (theme: AppTheme) => StyleSheet.create({ title: { ...theme.typography.heading, color: theme.colors.text }, text: { ...theme.typography.body, color: theme.colors.muted } });
