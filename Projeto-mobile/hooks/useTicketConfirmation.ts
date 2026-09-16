import { usePreventRemove } from 'expo-router/react-navigation';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getMyClient, upsertMyClient } from '@/services/clientService';
import { createTicket } from '@/services/ticketService';
import type { SessionSeat } from '@/types/seat';
import type { Ticket } from '@/types/ticket';

type ConfirmationInput = {
  sessionId: number;
  seats: SessionSeat[];
  qtdInteira: number;
  qtdMeia: number;
  validPrice: boolean;
  onLockChange: (locked: boolean) => void;
};

export function useTicketConfirmation({ sessionId, seats, qtdInteira, qtdMeia, validPrice, onLockChange }: ConfirmationInput) {
  const { authState } = useAuth();
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
      router.replace({ pathname: '../ticket-confirmation', params: { tickets: JSON.stringify(created) } });
    }
  }, [complete, pending, created]);

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
      for (const seat of seats) {
        ticketRequested = true;
        const ticket = await createTicket({ id_sessao: sessionId, id_cliente: client.id_cliente, id_assento: seat.id_assento }, token);
        saved.push(ticket);
        setCreated([...saved]);
      }
      setComplete(true);
    } catch (cause: unknown) {
      if (ticketRequested) {
        setStopped(true);
        const uncertain = !isAxiosError(cause) || !cause.response || cause.response.status >= 500;
        setError(`${saved.length} ingresso(s) com criação confirmada. ${uncertain
          ? 'A última solicitação pode ter sido processada, mas não foi possível confirmar a resposta.'
          : 'Não foi possível criar o próximo ingresso; o assento pode estar ocupado.'} A operação foi interrompida. Os ingressos já criados não foram desfeitos. Confira seus ingressos antes de iniciar outra confirmação.`);
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
