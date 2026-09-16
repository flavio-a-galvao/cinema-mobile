import { createContext, useContext, useState, type Dispatch, type SetStateAction, type PropsWithChildren } from 'react';
import type { Ticket } from '@/types/ticket';
import type { Payment } from '@/types/payment';

export type Checkout = {
  userId: number;
  tickets: Ticket[];
  seatLabels: Record<number, string>;
  qtdInteira: number;
  qtdMeia: number;
  fullCents: number;
  halfCents: number;
  status: 'ready' | 'processing' | 'complete' | 'uncertain';
  payments: Payment[];
};
const CheckoutContext = createContext<{ checkout: Checkout | null; setCheckout: Dispatch<SetStateAction<Checkout | null>> } | null>(null);
export function CheckoutProvider({ children }: PropsWithChildren) {
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  return <CheckoutContext.Provider value={{ checkout, setCheckout }}>{children}</CheckoutContext.Provider>;
}
export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) throw new Error('CheckoutProvider ausente.');
  return context;
}
