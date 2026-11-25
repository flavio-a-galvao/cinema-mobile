'use strict';

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { mkdtempSync, rmSync, rmdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { test } = require('node:test');
const { channels, openStore } = require('../store');

const event = (overrides = {}) => ({
  eventId: randomUUID(), type: 'filme.created', id: 8,
  timestamp: '2026-11-23T12:00:00.000Z', ...overrides,
});

test('aceita o contrato dos dois canais e dos seis tipos publicados pela API', () => {
  const store = openStore(':memory:');
  try {
    for (const [index, entity] of ['filme', 'sessao'].entries()) {
      for (const action of ['created', 'updated', 'deleted']) {
        const msg = event({ type: entity + '.' + action });
        assert.deepEqual(store.record(JSON.stringify(msg), channels[index]),
          { action: 'stored', ...msg, channel: channels[index] });
      }
    }
  } finally { store.close(); }
});

test('descarta mensagens inválidas, envelopes antigos e canal inconsistente', () => {
  const store = openStore(':memory:');
  try {
    const invalid = ['{', 'null', JSON.stringify({ type: 'film.created', filmId: 8 }),
      JSON.stringify(event({ id: -1 })), JSON.stringify(event({ eventId: 'sem-uuid' })),
      JSON.stringify(event({ timestamp: '2026-11-23' })), JSON.stringify(event({ timestamp: 'inválido' })),
      JSON.stringify(event({ type: 'sessao.created' })), JSON.stringify(event({ data: 'x'.repeat(4096) }))];
    for (const message of invalid) assert.equal(store.record(message, channels[0]).action, 'invalid_event');
    assert.equal(store.record(JSON.stringify(event()), '__proto__').action, 'invalid_event');
  } finally { store.close(); }
});

test('preserva linhas entre aberturas, ignora duplicatas e não grava campos extras', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cinemax-audit-test-'));
  const file = join(dir, 'audit.sqlite');
  try {
    const msg = event({ extra: 'fora do contrato' });
    let store = openStore(file);
    try { assert.equal(store.record(JSON.stringify(msg), channels[0]).action, 'stored'); }
    finally { store.close(); }
    store = openStore(file);
    try {
      const retry = JSON.stringify({ ...msg, eventId: msg.eventId.toUpperCase(), id: 99 });
      assert.equal(store.record(retry, channels[0]).action, 'duplicate');
    } finally { store.close(); }
    const db = new DatabaseSync(file, { readOnly: true });
    try {
      const rows = db.prepare('SELECT * FROM audit_events').all().map(row => ({ ...row }));
      assert.deepEqual(rows, [{ event_id: msg.eventId, channel: channels[0],
        event_type: msg.type, entity_id: 8, occurred_at: msg.timestamp }]);
    } finally { db.close(); }
  } finally { rmSync(file, { force: true }); rmdirSync(dir); }
});
