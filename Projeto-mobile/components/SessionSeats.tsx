import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { TicketSummary } from '@/components/TicketSummary';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { listSessionSeats } from '@/services/seatService';
import type { SessionSeat } from '@/types/seat';
import type { MovieSession } from '@/types/session';

const MAX_TICKETS = 10;

type SeatsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; seats: SessionSeat[] };

export function SessionSeats({ sessionId, price }: { sessionId: number; price: MovieSession['preco'] }) {
  const { authState } = useAuth();
  const token = authState.token;
  const [state, setState] = useState<SeatsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void listSessionSeats(sessionId, token).then(
      (seats) => {
        if (active) {
          setSelectedIds([]);
          setState({ status: 'success', seats });
        }
      },
      () => { if (active) setState({ status: 'error' }); },
    );
    return () => { active = false; };
  }, [sessionId, token, attempt]);

  function toggleSeat(seat: SessionSeat): void {
    if (seat.occupied) return;
    setSelectedIds((current) => current.includes(seat.id_assento)
      ? current.filter((id) => id !== seat.id_assento)
      : current.length < MAX_TICKETS ? [...current, seat.id_assento] : current);
  }

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
        <View style={styles.container}>
          <Text accessibilityLiveRegion="polite" style={styles.count}>Assentos selecionados: {selectedIds.length} / {MAX_TICKETS}</Text>
          <Text style={styles.count}>Ao alterar os assentos, as quantidades voltam para inteira.</Text>
          <View style={styles.grid}>
            {state.seats.map((seat) => {
              const selected = !seat.occupied && selectedIds.includes(seat.id_assento);
              const disabled = seat.occupied || (!selected && selectedIds.length >= MAX_TICKETS);
              const label = `${seat.fila || ''}${seat.numero || `Assento ${seat.id_assento}`}`;
              const status = seat.occupied ? 'Ocupado' : selected ? 'Selecionado' : 'Disponível';
              const textStyle = seat.occupied ? styles.occupiedText : selected ? styles.selectedText : styles.availableText;
              return (
                <Pressable
                  key={seat.id_assento}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${label}, ${status}`}
                  accessibilityState={{ disabled, checked: selected }}
                  disabled={disabled}
                  onPress={() => toggleSeat(seat)}
                  style={[styles.seat, seat.occupied ? styles.occupied : selected ? styles.selected : styles.available]}
                >
                  <Text style={textStyle}>{label}</Text>
                  <Text style={textStyle}>{status}</Text>
                </Pressable>
              );
            })}
          </View>
          {selectedIds.length > 0 && (
            <TicketSummary key={selectedIds.join(',')} seats={state.seats.filter((seat) => selectedIds.includes(seat.id_assento))} price={price} />
          )}
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
  available: { backgroundColor: theme.colors.background, borderColor: theme.colors.primary },
  selected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  occupied: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  selectedText: { ...theme.typography.caption, color: theme.colors.onPrimary, textAlign: 'center' },
  count: { ...theme.typography.body, color: theme.colors.text },
  availableText: { ...theme.typography.caption, color: theme.colors.primary, textAlign: 'center' },
  occupiedText: { ...theme.typography.caption, color: theme.colors.muted, textAlign: 'center' },
});
