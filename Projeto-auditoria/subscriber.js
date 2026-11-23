'use strict';

const { createClient } = require('@redis/client');
const { channels, openStore } = require('./store');

const log = (event) => console.log(JSON.stringify({ service: 'auditoria', ...event }));

async function main() {
  const { REDIS_URL, AUDIT_DB_PATH = './audit.sqlite' } = process.env;
  if (!REDIS_URL) throw new Error('REDIS_URL ausente');

  const client = createClient({
    url: REDIS_URL,
    socket: { connectTimeout: 2000, reconnectStrategy: n => Math.min(500 * (n + 1), 5000) },
  });
  const store = openStore(AUDIT_DB_PATH);
  let stopping = false;
  let lastWarning = -Infinity;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    try {
      if (client.isOpen) client.destroy();
    } finally {
      store.close();
    }
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  client.on('error', () => {
    if (!stopping && Date.now() - lastWarning >= 5000) {
      lastWarning = Date.now();
      log({ action: 'redis_unavailable' });
    }
  });

  try {
    await client.connect();
    await client.subscribe(channels, (message, channel) => {
      if (stopping) return;
      try {
        log(store.record(message, channel));
      } catch {
        log({ action: 'storage_error' });
        process.exitCode = 1;
        stop();
      }
    });
    if (!stopping) log({ action: 'subscribed', channels });
  } catch (error) {
    if (stopping) return;
    stop();
    throw error;
  }
}

main().catch(() => {
  log({ action: 'startup_error' });
  process.exitCode = 1;
});
