import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { waitForDatabase } from '../src/services/databaseReadiness';
import sequelize from '../src/config/database';

beforeEach(() => {
  for (const level of ['info', 'warn', 'error'] as const) vi.spyOn(console, level).mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());
const failure = (code: string) => Object.assign(new Error('segredo'), { original: { code } });

it('recupera SELECT seguro no startup após falhas transitórias, com backoff', async () => {
  const authenticate = vi.fn().mockRejectedValueOnce(failure('ECONNREFUSED')).mockRejectedValueOnce(failure('ETIMEDOUT')).mockResolvedValue(undefined);
  const sleep = vi.fn().mockResolvedValue(undefined);
  await waitForDatabase(authenticate, sleep);
  expect(authenticate).toHaveBeenCalledTimes(3);
  expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([500, 1000]);
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('segredo');
});

it('encerra após dez tentativas e limita intervalo de espera a três segundos', async () => {
  const error = failure('ECONNREFUSED');
  const authenticate = vi.fn().mockRejectedValue(error), sleep = vi.fn().mockResolvedValue(undefined);
  await expect(waitForDatabase(authenticate, sleep)).rejects.toBe(error);
  expect(authenticate).toHaveBeenCalledTimes(10);
  expect(sleep).toHaveBeenCalledTimes(9);
  expect(Math.max(...sleep.mock.calls.map(([ms]) => ms))).toBe(3000);
});

it.each(['ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ENOTFOUND', 'ER_LOCK_DEADLOCK', 'DESCONHECIDO'])('não repete erro permanente/não classificado: %s', async code => {
  const error = failure(code), authenticate = vi.fn().mockRejectedValue(error), sleep = vi.fn();
  await expect(waitForDatabase(authenticate, sleep)).rejects.toBe(error);
  expect(authenticate).toHaveBeenCalledTimes(1);
  expect(sleep).not.toHaveBeenCalled();
});

it('desativa retry de queries e logging SQL e limita conexão/aquisição sem modificar dialect', async () => {
  expect(sequelize.options.dialect).toBe('mysql');
  expect(sequelize.options.logging).toBe(false);
  expect(sequelize.options.retry).toMatchObject({ max: 0 });
  expect(sequelize.options.pool).toMatchObject({ acquire: 5000, max: 5 });
  expect(sequelize.options.dialectOptions).toMatchObject({ connectTimeout: 5000 });
  await sequelize.close();
});
