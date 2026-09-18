import type { Seat } from '@/types/seat';
export function seatLabel(seat?: Seat): string { return seat ? [seat.fila, seat.numero].filter(Boolean).join('') || 'Sem código' : 'Código indisponível'; }
