import { seatLabel } from '@/utils/seatLabel';
import { routes } from '@/constants/routes';
import { useCheckout } from '@/contexts/CheckoutContext';
import { usePreventRemove } from 'expo-router/react-navigation';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getMyClient, upsertMyClient } from '@/services/clientService';
import { createTickets } from '@/services/ticketService';
import type { SessionSeat } from '@/types/seat';
import type { Ticket } from '@/types/ticket';

type ConfirmationInput = {
  sessionId: number;
  seats: SessionSeat[];
  qtdInteira: number;
  qtdMeia: number;
  validPrice: boolean;
  fullCents: number;
  halfCents: number;
  onLockChange: (locked: boolean) => void;
};

export function useTicketConfirmation({ sessionId, seats, qtdInteira, qtdMeia, validPrice, onLockChange }: ConfirmationInput) {
  const { authState } = useAuth();
  const { setCheckout } = useCheckout();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Ticket[]>([]);
  const [stopped, setStopped] = useState(false);
  const [complete, setComplete] = useState(false);
  const busy = useRef(false);

  usePreventRemove(pending, () => {
    Alert.alert('Confirmação em andamento', 'Aguarde a resposta para saber quais ingressos foram criados.');
  });
  useEffect(() => {
    if (complete && !pending) {
      router.replace(routes.payment);
    }
  }, [complete, pending]);

  async function confirm(): Promise<void> {
    if (busy.current || stopped || complete) return;
    if (authState.status !== 'authenticated') {
      setError('Entre na sua conta novamente para confirmar.');
      return;
    }
    if (!validPrice || seats.length < 1 || seats.length > 10
      || !Number.isInteger(qtdInteira) || !Number.isInteger(qtdMeia)
      || qtdInteira < 0 || qtdMeia < 0 || qtdInteira + qtdMeia !== seats.length
      || new Set(seats.map((seat) => seat.id_assento)).size !== seats.length
      || seats.some((seat) => seat.occupied || !Number.isSafeInteger(seat.id_assento) || seat.id_assento <= 0)
      || !Number.isSafeInteger(sessionId) || sessionId <= 0) {
      setError('Confira os assentos e as quantidades: selecione de 1 a 10 ingressos, um por assento.');
      return;
    }
    busy.current = true;
    setPending(true);
    setError(null);
    onLockChange(true);
    const saved: Ticket[] = [];
    let ticketRequested = false;
    try {
      const { token, user } = authState;
      const client = await getMyClient(token).catch((cause: unknown) => {
        if (isAxiosError(cause) && cause.response?.status === 404) {
          return upsertMyClient({ nome: user.nome }, token);
        }
        throw cause;
      });
      if (!Number.isSafeInteger(client.id_cliente) || client.id_cliente <= 0) throw new Error('Cliente inválido.');
      ticketRequested = true;
      saved.push(...await createTickets({ id_sessao: sessionId, id_cliente: client.id_cliente, id_assentos: seats.map(seat => seat.id_assento), qtdInteira, qtdMeia }, token));
      setCreated([...saved]);
      setCheckout({ userId: user.id_usuario, tickets: saved, seatLabels: Object.fromEntries(seats.map(seat => [seat.id_assento, seatLabel(seat)])), qtdInteira, qtdMeia, fullCents: Math.round(Number(saved.find(ticket => ticket.tipo_ingresso === 'inteira')?.valor_unitario ?? 0) * 100), halfCents: Math.round(Number(saved.find(ticket => ticket.tipo_ingresso === 'meia')?.valor_unitario ?? 0) * 100), status: 'ready', payments: [] });
      setComplete(true);
    } catch (cause: unknown) {
      if (ticketRequested) {
        setStopped(true);
        const uncertain = !isAxiosError(cause) || !cause.response || cause.response.status >= 500;
        setError(uncertain ? 'Não foi possível confirmar a resposta da compra. Confira Meus Ingressos antes de tentar novamente.' : 'A compra não foi concluída. Um assento pode ter sido ocupado ou a sessão já começou. Atualize a sessão para escolher novamente.');
      } else {
        onLockChange(false);
        setError('Não foi possível obter seu cadastro de cliente. Tente novamente.');
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return { confirm, pending, error, created, stopped, complete };
}
