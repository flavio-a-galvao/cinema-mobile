import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateRoomSeats } from '../src/controllers/salasAssentos.controller';
import Sala from '../src/models/Sala';
import Assento from '../src/models/Assento';
vi.mock('../src/models/Sala', () => ({ default: { findByPk: vi.fn() } }));
vi.mock('../src/models/Assento', () => ({ default: { findAll: vi.fn(), bulkCreate: vi.fn(), count: vi.fn() } }));
vi.mock('../src/config/database', () => ({ default: { transaction: vi.fn(async callback => callback({ LOCK: { UPDATE: 'UPDATE' } })) } }));
let seats: { fila: string; numero: string; id_sala: number }[];
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() });
beforeEach(() => {
  vi.clearAllMocks(); seats = [];
  (Sala.findByPk as any).mockResolvedValue({ id_sala: 1, capacidade: 48 });
  (Assento.findAll as any).mockImplementation(async () => [...seats]);
  (Assento.count as any).mockImplementation(async () => seats.length);
  (Assento.bulkCreate as any).mockImplementation(async (missing: typeof seats) => { seats.push(...missing); });
});
describe('Geração de assentos da sala', () => {
  it('gera A1–F8 e repetir não duplica', async () => {
    const first = response(); await generateRoomSeats({ params: { id: '1' } } as any, first as any);
    expect(first.json).toHaveBeenCalledWith({ criados: 48, total: 48 });
    expect(Sala.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({ lock: 'UPDATE' }));
    const second = response(); await generateRoomSeats({ params: { id: '1' } } as any, second as any);
    expect(second.json).toHaveBeenCalledWith({ criados: 0, total: 48 }); expect(Assento.bulkCreate).toHaveBeenCalledOnce();
    expect(new Set(seats.map(seat => seat.fila + seat.numero)).size).toBe(48);
    expect(seats).toContainEqual({ id_sala: 1, fila: 'F', numero: '8' });
  });
  it('completa apenas lugares faltantes e preserva os existentes', async () => {
    seats.push({ id_sala: 1, fila: 'A', numero: '1' });
    const res = response(); await generateRoomSeats({ params: { id: '1' } } as any, res as any);
    expect(res.json).toHaveBeenCalledWith({ criados: 47, total: 48 });
    expect((Assento.bulkCreate as any).mock.calls[0][0]).not.toContainEqual({ id_sala: 1, fila: 'A', numero: '1' });
  });
  it('respeita assento existente com fileira minúscula', async () => {
    seats.push({ id_sala: 1, fila: 'a', numero: '1' });
    const res = response(); await generateRoomSeats({ params: { id: '1' } } as any, res as any);
    expect(res.json).toHaveBeenCalledWith({ criados: 47, total: 48 });
  });
  it('capacidade insuficiente retorna 409 sem criar', async () => {
    (Sala.findByPk as any).mockResolvedValue({ id_sala: 1, capacidade: 20 });
    const res = response(); await generateRoomSeats({ params: { id: '1' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(409); expect(Assento.bulkCreate).not.toHaveBeenCalled();
  });
  it('sala inexistente retorna 404', async () => {
    (Sala.findByPk as any).mockResolvedValue(null);
    const res = response(); await generateRoomSeats({ params: { id: '1' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404); expect(Assento.bulkCreate).not.toHaveBeenCalled();
  });
});
