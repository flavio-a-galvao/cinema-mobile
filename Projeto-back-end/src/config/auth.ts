import 'dotenv/config';

const configuredSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (
  !configuredSecret || configuredSecret.trim().length < 32
  || configuredSecret === 'cinemax-dev-secret'
  || configuredSecret === 'change_me_use_a_long_random_secret'
)) {
  throw new Error('Configure JWT_SECRET forte e exclusivo antes de iniciar em producao.');
}
// Compatibilidade local/testes; o fallback público é proibido em produção.
export const JWT_SECRET = configuredSecret || 'cinemax-dev-secret';
export const JWT_EXPIRES_IN = "8h";
