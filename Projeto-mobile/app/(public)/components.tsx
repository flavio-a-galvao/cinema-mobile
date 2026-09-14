import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/Input';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { theme } from '@/constants/theme';

type DemoState = 'empty' | 'loading' | 'error';
const nextState: Record<DemoState, DemoState> = { empty: 'loading', loading: 'error', error: 'empty' };

export default function ComponentsScreen() {
  const [text, setText] = useState('');
  const [state, setState] = useState<DemoState>('empty');

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>Fundação mobile</Text>
      <Text style={styles.description}>Demonstração local dos componentes. Nenhum dado é enviado ou salvo.</Text>
      <Input label="Texto de demonstração" placeholder="Digite para testar o campo" value={text} onChangeText={setText}
        error={state === 'error' ? 'Exemplo de mensagem de validação.' : undefined} />
      <Button title="Alternar estado de demonstração" onPress={() => setState(nextState[state])} />
      {state === 'empty' && <EmptyState title="Tudo pronto para começar" message="Este é o componente de estado vazio." />}
      {state === 'loading' && <Loading message="Exemplo de carregamento. Toque em alternar para continuar." />}
      {state === 'error' && <ErrorState message="Exemplo de erro, sem falha real de conexão." onRetry={() => setState('empty')} />}
      <Button title="Exemplo indisponível" disabled />
      <Button title="Voltar ao início" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.typography.heading, color: theme.colors.text },
  description: { ...theme.typography.body, color: theme.colors.muted },
});
