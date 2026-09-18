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
import { adminSessionRoute, routes } from '@/constants/routes';
import type { MovieSession } from '@/types/session';
import { listRooms, listSessions, deleteSession } from '@/services/adminCinemaService';
import { listAdminMovies } from '@/services/movieService';
import { adminError, confirmAdminDelete } from '@/utils/adminFeedback';
type SessionRow = MovieSession & { movieTitle: string; roomName: string };
export default function AdminSessionsScreen() {
  const { theme } = useTheme(); const styles = createStyles(theme); const { authState } = useAuth(); const token = authState.token;
  const [sessions, setSessions] = useState<SessionRow[] | null>(null); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [pending, setPending] = useState<number | null>(null); const busy = useRef(false); const request = useRef(0);
  const load = useCallback(async () => {
    if (!token) return; const current = ++request.current;
    try {
      const [data, movies, rooms] = await Promise.all([listSessions(token), listAdminMovies(token), listRooms(token)]);
      const titles = new Map(movies.map(movie => [movie.id_filme, movie.titulo])); const names = new Map(rooms.map(room => [room.id_sala, room.nome]));
      if (current === request.current) { setSessions(data.map(session => ({ ...session, movieTitle: titles.get(session.id_filme ?? 0) ?? 'Filme indisponível', roomName: names.get(session.id_sala ?? 0) || 'Sala indisponível' }))); setError(''); }
    } catch (cause) { if (current === request.current) setError(adminError(cause)); }
  }, [token]);
  useFocusEffect(useCallback(() => { void load(); return () => { request.current++; }; }, [load]));
  async function remove(session: SessionRow) {
    if (!token || busy.current) return; busy.current = true; setPending(session.id_sessao); setError(''); setMessage('');
    try { await deleteSession(session.id_sessao, token); setSessions(current => current?.filter(item => item.id_sessao !== session.id_sessao) ?? []); setMessage('Sessão excluída com sucesso.'); }
    catch (cause) { setError(adminError(cause)); } finally { busy.current = false; setPending(null); }
  }
  return <Screen><AdminSections current="sessions" /><Text style={styles.title}>Gerenciar sessões</Text>
    <Button icon="add-outline" title="Nova sessão" disabled={pending !== null} onPress={() => router.push(adminSessionRoute())} />
    {!!error && <ErrorState message={error} onRetry={() => { void load(); }} />}{!!message && <Notice message={message} />}
    {sessions === null && !error && <Loading />}{sessions?.length === 0 && <EmptyState title="Nenhuma sessão cadastrada" message="Escolha um filme e uma sala para agendar a primeira sessão." />}
    {sessions?.map(session => <View key={session.id_sessao} style={styles.card}>
      <Text style={styles.title}>{session.movieTitle}</Text><Text style={styles.text}>{session.roomName}</Text>
      <Text style={styles.text}>{session.horario ? new Date(session.horario).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Horário não informado'}</Text>
      <Text style={styles.text}>{session.preco !== null ? Number(session.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Preço não informado'}</Text>
      <Button title="Editar sessão" variant="secondary" disabled={pending !== null} onPress={() => router.push(adminSessionRoute(session.id_sessao))} />
      <Button title="Excluir sessão" icon="trash-outline" variant="danger" loading={pending === session.id_sessao} disabled={pending !== null} onPress={() => confirmAdminDelete(session.movieTitle + ' — ' + session.roomName, () => { void remove(session); })} />
    </View>)}
    <Button title="Atualizar sessões" variant="secondary" disabled={pending !== null} onPress={() => { setSessions(null); setError(''); void load(); }} />
    <Button title="Voltar ao perfil" variant="link" onPress={() => router.navigate(routes.profile)} />
  </Screen>;
}
const createStyles = (theme: AppTheme) => StyleSheet.create({ title: { ...theme.typography.heading, color: theme.colors.text }, text: { ...theme.typography.body, color: theme.colors.muted }, card: { borderWidth: theme.sizes.borderWidth, borderColor: theme.colors.border, gap: theme.spacing.sm, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg } });
