import { errorMetadata, log } from './logger';

const transient = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH',
  'EAI_AGAIN', 'EPIPE', 'PROTOCOL_CONNECTION_LOST',
]);

/** Retry apenas do SELECT de autenticação no startup, nunca de transações de negócio. */
export async function waitForDatabase(
  authenticate: () => Promise<unknown>,
  sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)),
): Promise<void> {
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await authenticate();
      log('info', 'database', 'ready', { attempt });
      return;
    } catch (error) {
      const metadata = errorMetadata(error);
      if (!metadata.code || !transient.has(metadata.code) || attempt === maxAttempts) {
        log('error', 'database', 'startup_failed', { ...metadata, attempt, maxAttempts });
        throw error;
      }
      const delayMs = Math.min(500 * 2 ** (attempt - 1), 3000);
      log('warn', 'database', 'startup_retry', { ...metadata, attempt, maxAttempts, delayMs });
      await sleep(delayMs);
    }
  }
}
