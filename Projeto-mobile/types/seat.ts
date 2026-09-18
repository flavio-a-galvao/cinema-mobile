export type Seat = {
  id_assento: number;
  id_sala: number | null;
  numero: string | null;
  fila: string | null;
};

export type SessionSeat = Seat & { occupied: boolean };
