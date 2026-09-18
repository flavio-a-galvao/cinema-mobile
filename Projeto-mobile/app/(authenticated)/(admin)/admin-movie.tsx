import { ageError, digitsOnly, maskBrazilianDate, toApiDate, toDisplayDate } from '@/utils/movieForm';
import { Notice } from '@/components/Notice';
import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { isAxiosError } from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loading } from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { MoviePoster } from '@/components/MoviePoster';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { routes } from '@/constants/routes';
import type { AppTheme } from '@/constants/theme';
import type { MovieInput } from '@/types/movie';
import { getMovieById, saveMovie, uploadPoster } from '@/services/movieService';

type Form = { titulo: string; genero: string; classificacao_etaria: string; duracao: string; sinopse: string; data_lancamento: string };
const empty: Form = { titulo: '', genero: '', classificacao_etaria: '', duracao: '', sinopse: '', data_lancamento: '' };
export default function AdminMovieScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const initialId = id ? Number(id) : undefined;
  const invalidId = initialId !== undefined && (!Number.isSafeInteger(initialId) || initialId <= 0);
  const { theme } = useTheme(); const styles = createStyles(theme); const { authState } = useAuth();
  const [savedId, setSavedId] = useState(initialId); const [form, setForm] = useState<Form>(empty);
  const [poster, setPoster] = useState<string | null>(null); const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(!!id); const [loadError, setLoadError] = useState(''); const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false); const busy = useRef(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  useEffect(() => {
    if (!initialId) return;
    let active = true;
    void getMovieById(initialId).then(movie => {
      if (!active) return;
      setForm({ titulo: movie.titulo, genero: movie.genero ?? '', classificacao_etaria: movie.classificacao_etaria?.toLowerCase() === 'livre' ? '0' : movie.classificacao_etaria ?? '', duracao: movie.duracao?.toString() ?? '', sinopse: movie.sinopse ?? '', data_lancamento: toDisplayDate(movie.data_lancamento) });
      setSavedId(movie.id_filme); setPoster(movie.poster_url); setLoadError('');
    }, () => { if (active) setLoadError('Não foi possível carregar este filme.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initialId, attempt]);
  function field(key: keyof Form, value: string) { setForm(current => ({ ...current, [key]: value })); setSuccess(''); setError(''); }
  async function pickPoster() {
    setError(''); setSuccess('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (result.canceled) return;
      const selected = result.assets[0];
      if (selected.fileSize && selected.fileSize > 5 * 1024 * 1024) { setError('O poster deve ter no máximo 5 MB.'); return; }
      if (selected.mimeType && !['image/jpeg', 'image/png', 'image/webp'].includes(selected.mimeType)) { setError('Selecione uma imagem JPEG, PNG ou WEBP.'); return; }
      setAsset(selected);
    } catch { setError('Não foi possível acessar a galeria. Verifique a permissão de fotos.'); }
  }
  async function save() {
    if (busy.current || !authState.token) return;
    const duration = form.duracao.trim() ? Number(form.duracao) : null;
    const date = toApiDate(form.data_lancamento.trim());
    const classificationError = ageError(form.classificacao_etaria);
    if (classificationError) { setError(classificationError); return; }
    if (form.titulo.length > 150 || form.genero.length > 50) { setError('Respeite os limites: título 150 e gênero 50 caracteres.'); return; }
    if (!form.titulo.trim()) { setError('Informe o título do filme.'); return; }
    if (duration !== null && (!Number.isInteger(duration) || duration <= 0 || duration > 2147483647)) { setError('Informe a duração em minutos, maior que zero.'); return; }
    if (form.data_lancamento && !date) { setError('Informe uma data válida no formato DD/MM/AAAA.'); return; }
    const input: MovieInput = { titulo: form.titulo.trim(), genero: form.genero.trim() || null, classificacao_etaria: form.classificacao_etaria.trim() || null, duracao: duration, sinopse: form.sinopse.trim() || null, data_lancamento: date || null };
    busy.current = true; setPending(true); setError(''); setSuccess('');
    let metadataSaved = false;
    try {
      const movie = await saveMovie(input, authState.token, savedId);
      // Guardar o ID antes do upload evita cadastrar novamente se só o upload falhar.
      setSavedId(movie.id_filme); setPoster(movie.poster_url); metadataSaved = true;
      if (asset) { const updated = await uploadPoster(movie.id_filme, asset, authState.token); setPoster(updated.poster_url); setAsset(null); }
      setSuccess('Filme salvo com sucesso. O catálogo já foi atualizado.');
    } catch (cause) {
      const status = isAxiosError(cause) ? cause.response?.status : undefined;
      const message = status === 413 ? 'O poster deve ter no máximo 5 MB.' : status === 400 ? 'Verifique os campos e envie uma imagem JPEG, PNG ou WEBP válida.' : status === 401 || status === 403 ? 'Sua sessão não permite esta operação. Entre novamente com uma conta admin.' : 'Não foi possível salvar. Verifique a conexão e tente novamente.';
      setError((metadataSaved ? 'Dados do filme salvos; o poster não foi enviado. ' : '') + message);
    } finally { busy.current = false; setPending(false); }
  }
  if (invalidId) return <Screen><ErrorState message="Filme não encontrado." /><Button title="Voltar" onPress={() => router.replace(routes.admin)} /></Screen>;
  if (loading) return <Screen><Loading /></Screen>;
  if (loadError) return <Screen><ErrorState message={loadError} onRetry={() => { setLoading(true); setAttempt(value => value + 1); }} /><Button title="Voltar" onPress={() => router.replace(routes.admin)} /></Screen>;
  return <Screen>
    <Text style={styles.title}>{savedId ? 'Editar filme' : 'Novo filme'}</Text>
    <MoviePoster url={poster} title={form.titulo || 'Cinemax'} large />
    {asset && <Text style={styles.text}>Poster selecionado: {asset.fileName ?? 'imagem da galeria'}. Será enviado ao salvar.</Text>}
    <Button title="Selecionar poster" variant="secondary" disabled={pending} onPress={() => { void pickPoster(); }} />
    <Text style={styles.text}>JPEG, PNG ou WEBP • até 5 MB</Text>
    <Input label="Título" value={form.titulo} maxLength={150} editable={!pending} onChangeText={value => field('titulo', value)} />
    <Input label="Gênero" value={form.genero} maxLength={50} editable={!pending} onChangeText={value => field('genero', value)} />
    <Input label="Classificação etária" value={form.classificacao_etaria} maxLength={3} keyboardType="number-pad" error={ageError(form.classificacao_etaria)} editable={!pending} onChangeText={value => field('classificacao_etaria', digitsOnly(value, 3))} />
    <Input label="Duração (minutos)" value={form.duracao} error={form.duracao && (Number(form.duracao) <= 0 || Number(form.duracao) > 2147483647) ? 'Informe uma duração positiva em minutos, até 2147483647.' : undefined} maxLength={10} keyboardType="number-pad" editable={!pending} onChangeText={value => field('duracao', digitsOnly(value, 10))} />
    <Input label="Lançamento (DD/MM/AAAA)" placeholder="DD/MM/AAAA" keyboardType="number-pad" value={form.data_lancamento} error={form.data_lancamento.length === 10 && !toApiDate(form.data_lancamento) ? 'Informe uma data válida no formato DD/MM/AAAA.' : undefined} maxLength={10} editable={!pending} onChangeText={value => field('data_lancamento', maskBrazilianDate(value))} />
    <Input label="Sinopse" value={form.sinopse} multiline maxLength={16000} editable={!pending} onChangeText={value => field('sinopse', value)} />
    {!!error && <ErrorState message={error} />}
    {!!success && <Notice message={success} />}
    <Button icon="checkmark-outline" title="Salvar filme" disabled={!!ageError(form.classificacao_etaria)} loading={pending} onPress={() => { void save(); }} />
    <Button title="Voltar aos filmes" variant="link" disabled={pending} onPress={() => router.replace(routes.admin)} />
  </Screen>;
}
const createStyles = (theme: AppTheme) => StyleSheet.create({ title: { ...theme.typography.heading, color: theme.colors.text }, text: { ...theme.typography.body, color: theme.colors.muted } });
