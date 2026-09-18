import { useIsFocused } from 'expo-router';
import { seatLabel } from '@/utils/seatLabel';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loading } from '@/components/Loading';
import { TicketSummary } from '@/components/TicketSummary';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { authState } = useAuth();
  const focused = useIsFocused();
  const token = authState.token;
  const [state, setState] = useState<SeatsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [confirmationLocked, setConfirmationLocked] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (!token || !focused) return;
    let active = true;
    void listSessionSeats(sessionId, token).then(
      (seats) => {
        if (active) {
          setSelectedIds([]);
          setConfirmationLocked(false);
          setState({ status: 'success', seats });
        }
      },
      () => { if (active) setState({ status: 'error' }); },
    );
    return () => { active = false; };
  }, [sessionId, token, attempt, focused]);

  function toggleSeat(seat: SessionSeat): void {
    if (confirmationLocked || seat.occupied) return;
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
          <Text style={styles.count}>Escolha seus lugares. Depois, ajuste inteira e meia.</Text>
          <View style={styles.screenLine}><Text style={styles.count}>TELA DO CINEMA</Text></View>
          <View style={styles.legend}><Text style={styles.availableText}>□ Disponível</Text><Text style={styles.selectedLegend}>■ Selecionado</Text><Text style={styles.occupiedText}>× Ocupado</Text></View>
          <ScrollView horizontal contentContainerStyle={styles.map} showsHorizontalScrollIndicator>
            <View style={styles.container}>
            {[...new Set(state.seats.map(seat => seat.fila || '—'))].sort().map(row => (
              <View key={row} style={styles.row}>
                <Text style={styles.rowLabel}>{row}</Text>
                {state.seats.filter(seat => (seat.fila || '—') === row).sort((a,b) => (a.numero || '').localeCompare(b.numero || '', undefined, { numeric: true })).map(seat => {
                  const selected = !seat.occupied && selectedIds.includes(seat.id_assento);
                  const disabled = confirmationLocked || seat.occupied || (!selected && selectedIds.length >= MAX_TICKETS);
                  const label = seatLabel(seat);
                  return <Pressable key={seat.id_assento} accessibilityRole="checkbox" accessibilityLabel={label + ', ' + (seat.occupied ? 'Ocupado' : selected ? 'Selecionado' : 'Disponível')} accessibilityState={{ disabled, checked: selected }} disabled={disabled} onPress={() => toggleSeat(seat)} style={[styles.seat, Number(seat.numero) === 5 && styles.aisle, seat.occupied ? styles.occupied : selected ? styles.selected : styles.available]}>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={seat.occupied ? styles.occupiedText : selected ? styles.selectedText : styles.availableText}>{label}</Text>
                  </Pressable>;
                })}
              </View>
            ))}
            </View>
          </ScrollView>
          {selectedIds.length > 0 && (
            <TicketSummary sessionId={sessionId} onLockChange={setConfirmationLocked} key={selectedIds.join(',')} seats={state.seats.filter((seat) => selectedIds.includes(seat.id_assento))} price={price} />
          )}
        </View>
      ))}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { gap: theme.spacing.md },
  title: { ...theme.typography.heading, color: theme.colors.text },
  screenLine: { borderTopWidth: theme.spacing.xs, borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.lg, padding: theme.spacing.md, alignItems: 'center' },
  legend: { justifyContent: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  selectedLegend: { ...theme.typography.caption, color: theme.colors.primary },
  map: { flexGrow: 1, justifyContent: 'center', paddingVertical: theme.spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  rowLabel: { ...theme.typography.caption, color: theme.colors.muted, marginRight: theme.spacing.xs },
  aisle: { marginLeft: theme.spacing.sm },
  seat: { width: theme.sizes.seat, height: theme.sizes.seat, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.sm, borderWidth: theme.sizes.borderWidth, padding: theme.spacing.xs },
  available: { backgroundColor: theme.colors.background, borderColor: theme.colors.primary },
  selected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  occupied: { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border, opacity: theme.opacity.disabled },
  selectedText: { ...theme.typography.caption, color: theme.colors.onPrimary, textAlign: 'center' },
  count: { ...theme.typography.body, color: theme.colors.text },
  availableText: { ...theme.typography.caption, color: theme.colors.muted, textAlign: 'center' },
  occupiedText: { ...theme.typography.caption, color: theme.colors.muted, textAlign: 'center' },
});
