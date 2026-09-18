export type Room = { id_sala: number; nome: string | null; capacidade: number };
export type RoomInput = { nome: string; capacidade: number };
export type RoomSummary = Room & { quantidade_assentos: number };
export type GeneratedSeats = { criados: number; total: number };
