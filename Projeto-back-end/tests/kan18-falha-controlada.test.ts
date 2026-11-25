// Ensaio isolado KAN-18. Falha deliberada; NÃO INTEGRAR esta branch.
import { describe, it, expect } from 'vitest';

describe('KAN-18 — ensaio negativo controlado (não é defeito da aplicação)', () => {
  it('deve sinalizar uma falha de teste deliberada no GitHub Actions', () => {
    expect('falha deliberada KAN-18').toBe('sucesso propositalmente impossível');
  });
});
