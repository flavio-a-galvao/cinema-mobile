import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { listSessionSeats } from '@/services/seatService';
import type { SessionSeat } from '@/types/seat';

type SeatsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; seats: SessionSeat[] };

export function SessionSeats({ sessionId }: { sessionId: number }) {
  const { authState } = useAuth();
  const token = authState.token;
  const [state, setState] = useState<SeatsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void listSessionSeats(sessionId, token).then(
      (seats) => { if (active) setState({ status: 'success', seats }); },
      () => { if (active) setState({ status: 'error' }); },
    );
    return () => { active = false; };
  }, [sessionId, token, attempt]);

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>Assentos</Text>
      {state.status === 'loading' && <Loading message="Consultando assentos e ocupação..." />}
      {state.status === 'error' && <ErrorState message="Não foi possível consultar a ocupação dos assentos." onRetry={() => {
        setState({ status: 'loading' });
        setAttempt((value) => value + 1);
      }} />}
      {state.status === 'success' && (state.seats.length === 0 ? (
        <EmptyState title="Nenhum assento disponível para consulta" message="Não há assentos cadastrados para a sala desta sessão." />
      ) : (
        <View style={styles.grid}>
          {state.seats.map((seat) => (
            <View key={seat.id_assento} style={[styles.seat, seat.occupied ? styles.occupied : styles.available]}>
              <Text style={seat.occupied ? styles.occupiedText : styles.availableText}>
                {seat.fila || ''}{seat.numero || `Assento ${seat.id_assento}`}
              </Text>
              <Text style={seat.occupied ? styles.occupiedText : styles.availableText}>
                {seat.occupied ? 'Ocupado' : 'Disponível'}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.md },
  title: { ...theme.typography.heading, color: theme.colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  seat: { flexGrow: 1, flexShrink: 1, padding: theme.spacing.md, gap: theme.spacing.xs, borderRadius: theme.radius.sm, borderWidth: theme.sizes.borderWidth },
  available: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  occupied: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  availableText: { ...theme.typography.caption, color: theme.colors.onPrimary, textAlign: 'center' },
  occupiedText: { ...theme.typography.caption, color: theme.colors.muted, textAlign: 'center' },
});
