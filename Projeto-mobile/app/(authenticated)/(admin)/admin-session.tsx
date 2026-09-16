import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { AdminSelect } from '@/components/AdminSelect';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loading } from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { AppTheme } from '@/constants/theme';
import { adminRoutes } from '@/constants/routes';
import type { Movie } from '@/types/movie';
import type { RoomSummary } from '@/types/room';
import { listRooms, saveSession, getAdminSession } from '@/services/adminCinemaService';
import { listAdminMovies } from '@/services/movieService';
import { adminError } from '@/utils/adminFeedback';
const pad = (value: number) => String(value).padStart(2, '0');
function SessionEditor({ id }: { id?: number }) {
  const { theme } = useTheme(); const styles = createStyles(theme); const { authState } = useAuth(); const token = authState.token;
  const [savedId, setSavedId] = useState(id); const [movies, setMovies] = useState<Movie[]>([]); const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [movieId, setMovieId] = useState<number | null>(null); const [roomId, setRoomId] = useState<number | null>(null);
  const [date, setDate] = useState(''); const [time, setTime] = useState(''); const [price, setPrice] = useState(''); const [originalTime, setOriginalTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(''); const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false); const busy = useRef(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => {
    if (!token) return; let active = true;
    void Promise.all([listAdminMovies(token), listRooms(token), id ? getAdminSession(id, token) : Promise.resolve(null)]).then(([films, halls, session]) => {
      if (!active) return; setMovies(films); setRooms(halls); setLoadError('');
      if (session) {
        setMovieId(session.id_filme); setRoomId(session.id_sala); setPrice(session.preco?.toString() ?? '');
        const schedule = session.horario ? new Date(session.horario) : null;
        if (schedule && Number.isFinite(schedule.getTime())) {
          setDate(schedule.getFullYear() + '-' + pad(schedule.getMonth() + 1) + '-' + pad(schedule.getDate()));
          setTime(pad(schedule.getHours()) + ':' + pad(schedule.getMinutes())); setOriginalTime(schedule.getTime());
        }
      }
    }, cause => { if (active) setLoadError(adminError(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, token, attempt]);
  async function save() {
    if (!token || busy.current) return;
    if (!movieId || !roomId || !movies.some(movie => movie.id_filme === movieId) || !rooms.some(room => room.id_sala === roomId)) { setError('Selecione um filme e uma sala cadastrados.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { setError('Informe data e horário válidos: AAAA-MM-DD e HH:MM.'); return; }
    const [year, month, day] = date.split('-').map(Number); const [hour, minute] = time.split(':').map(Number);
    const schedule = new Date(year, month - 1, day, hour, minute);
    if (schedule.getFullYear() !== year || schedule.getMonth() !== month - 1 || schedule.getDate() !== day || schedule.getHours() !== hour || schedule.getMinutes() !== minute) { setError('Esta data ou horário não existe.'); return; }
    if (schedule.getTime() <= Date.now() && schedule.getTime() !== originalTime) { setError('Escolha data e horário futuros.'); return; }
    const normalizedPrice = price.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedPrice) || Number(normalizedPrice) > 9999.99) { setError('Informe um preço de 0 a 9999,99, com até duas casas decimais.'); return; }
    busy.current = true; setPending(true); setError(''); setMessage('');
    try {
      const session = await saveSession({ id_filme: movieId, id_sala: roomId, horario: schedule.toISOString(), preco: Number(normalizedPrice) }, token, savedId);
      setSavedId(session.id_sessao); setOriginalTime(schedule.getTime()); setMessage('Sessão salva e disponível no catálogo do filme.');
    } catch (cause) { setError(adminError(cause)); } finally { busy.current = false; setPending(false); }
  }
  if (loading) return <Screen><Loading /></Screen>;
  if (loadError) return <Screen><ErrorState message={loadError} onRetry={() => { setLoading(true); setAttempt(value => value + 1); }} /><Button title="Voltar" onPress={() => router.replace(adminRoutes.sessions)} /></Screen>;
  return <Screen><Text style={styles.title}>{savedId ? 'Editar sessão' : 'Nova sessão'}</Text>
    <AdminSelect label="Filme" value={movieId} options={movies.map(movie => ({ id: movie.id_filme, label: movie.titulo }))} disabled={pending} onChange={value => { setMovieId(value); setMessage(''); }} />
    <AdminSelect label="Sala" value={roomId} options={rooms.map(room => ({ id: room.id_sala, label: (room.nome || 'Sala sem nome') + ' • ' + room.quantidade_assentos + ' assentos' }))} disabled={pending} onChange={value => { setRoomId(value); setMessage(''); }} />
    <Input label="Data (AAAA-MM-DD)" value={date} maxLength={10} placeholder="2026-12-20" editable={!pending} onChangeText={value => { setDate(value); setMessage(''); }} />
    <Input label="Horário (HH:MM)" value={time} maxLength={5} placeholder="19:30" editable={!pending} onChangeText={value => { setTime(value); setMessage(''); }} />
    <Text style={styles.text}>Data e horário no fuso local do aparelho.</Text>
    <Input label="Preço da inteira (R$)" value={price} keyboardType="decimal-pad" editable={!pending} onChangeText={value => { setPrice(value); setMessage(''); }} />
    {!!error && <ErrorState message={error} />}{!!message && <Text style={styles.text} accessibilityRole="alert">{message}</Text>}
    <Button title="Salvar sessão" loading={pending} disabled={!movies.length || !rooms.length} onPress={() => { void save(); }} />
    <Button title="Voltar às sessões" variant="link" disabled={pending} onPress={() => router.replace(adminRoutes.sessions)} />
  </Screen>;
}
export default function AdminSessionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const sessionId = id ? Number(id) : undefined;
  if (sessionId !== undefined && (!Number.isSafeInteger(sessionId) || sessionId <= 0)) return <Screen><ErrorState message="Sessão não encontrada." /><Button title="Voltar" onPress={() => router.replace(adminRoutes.sessions)} /></Screen>;
  return <SessionEditor key={id ?? 'new'} id={sessionId} />;
}
const createStyles = (theme: AppTheme) => StyleSheet.create({ title: { ...theme.typography.heading, color: theme.colors.text }, text: { ...theme.typography.body, color: theme.colors.muted } });
