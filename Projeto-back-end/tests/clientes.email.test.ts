import { describe, expect, it, vi } from 'vitest';
import type { QueryInterface } from 'sequelize';
import { ensureClientesEmailUnique } from '../src/utils/ensureClientesEmailUnique';

function queryInterface(indexes: unknown[] = []) {
  return { showIndex: vi.fn().mockResolvedValue(indexes), addIndex: vi.fn().mockResolvedValue(undefined) };
}

describe('Unicidade de clientes.email em bases existentes', () => {
  it('adiciona índice único por email', async () => {
    const query = queryInterface();
    await ensureClientesEmailUnique(query as unknown as QueryInterface);
    expect(query.addIndex).toHaveBeenCalledWith('clientes', ['email'], { unique: true, name: 'clientes_email_unique' });
  });
  it('não recria índice único existente', async () => {
    const query = queryInterface([{ unique: true, fields: [{ attribute: 'email' }] }]);
    await ensureClientesEmailUnique(query as unknown as QueryInterface);
    expect(query.addIndex).not.toHaveBeenCalled();
  });
  it('não confunde índice composto com unicidade de email', async () => {
    const query = queryInterface([{ unique: true, fields: [{ attribute: 'email' }, { attribute: 'nome' }] }]);
    await ensureClientesEmailUnique(query as unknown as QueryInterface);
    expect(query.addIndex).toHaveBeenCalledTimes(1);
  });
  it('interrompe a inicialização se o banco rejeita o índice', async () => {
    const query = queryInterface();
    query.addIndex.mockRejectedValue(new Error('Duplicate entry'));
    await expect(ensureClientesEmailUnique(query as unknown as QueryInterface)).rejects.toThrow('Verifique duplicidades');
  });
});
