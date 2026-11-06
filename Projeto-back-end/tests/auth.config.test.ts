import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it.each(['', 'curto', 'cinemax-dev-secret', 'change_me_use_a_long_random_secret'])('recusa segredo ausente/fraco/público em produção (%s)', async secret => {
  vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('JWT_SECRET', secret); vi.resetModules();
  await expect(import('../src/config/auth')).rejects.toThrow('Configure JWT_SECRET');
});

it('aceita configuração forte sem revelar seu valor', async () => {
  vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('JWT_SECRET', 'teste-exclusivo-'.repeat(4)); vi.resetModules();
  const config = await import('../src/config/auth');
  expect(config.JWT_SECRET).toBe('teste-exclusivo-'.repeat(4));
  expect(config.JWT_EXPIRES_IN).toBe('8h');
});
