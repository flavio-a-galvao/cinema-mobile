'use strict';

const { DatabaseSync } = require('node:sqlite');

const channels = ['cinemax:eventos:filmes', 'cinemax:eventos:sessoes'];
const validTypes = {
  [channels[0]]: /^filme\.(created|updated|deleted)$/,
  [channels[1]]: /^sessao\.(created|updated|deleted)$/,
};
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

function parseEvent(message, channel) {
  if (!Object.hasOwn(validTypes, channel) || Buffer.byteLength(message) > 4096) return null;

  try {
    const { eventId, type, id, timestamp } = JSON.parse(message);
    if (typeof eventId !== 'string' || !uuid.test(eventId) ||
        typeof type !== 'string' || !validTypes[channel].test(type) ||
        !Number.isSafeInteger(id) || id < 1 ||
        typeof timestamp !== 'string' || new Date(timestamp).toISOString() !== timestamp) {
      return null;
    }
    return { eventId: eventId.toLowerCase(), type, id, timestamp };
  } catch {
    return null;
  }
}

function openStore(file) {
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS audit_events (
      event_id TEXT PRIMARY KEY NOT NULL,
      channel TEXT NOT NULL,
      event_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      occurred_at TEXT NOT NULL
    );
  `);
  const insert = db.prepare(`
    INSERT INTO audit_events (event_id, channel, event_type, entity_id, occurred_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(event_id) DO NOTHING
  `);
  return {
    record(message, channel) {
      const event = parseEvent(message, channel);
      if (!event) return { action: 'invalid_event' };
      const { eventId, type, id, timestamp } = event;
      const { changes } = insert.run(eventId, channel, type, id, timestamp);
      return { action: changes ? 'stored' : 'duplicate', ...event, channel };
    },
    close: () => db.close(),
  };
}

module.exports = { channels, openStore };
