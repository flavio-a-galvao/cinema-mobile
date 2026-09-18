import { expect, it, vi } from 'vitest';
import { normalizeRoomCapacity } from '../src/utils/normalizeRoomCapacity';
it('normaliza salas até 48, preserva excedentes e é idempotente', async () => {
 const rooms=[{id_sala:1,capacidade:60},{id_sala:2,capacidade:20},{id_sala:3,capacidade:70},{id_sala:4,capacidade:48}];
 const counts=[48,0,49,48];
 const query=vi.fn(async(sql:string,options:any)=>{
  if(sql.startsWith('SELECT id_sala'))return rooms;
  const id=options.replacements.id;
  if(sql.startsWith('SELECT id_assento'))return Array.from({length:counts[id-1]},(_,i)=>({id_assento:i}));
  if(sql.startsWith('UPDATE salas')){rooms[id-1].capacidade=options.replacements.capacity;return [];}
  throw new Error('Operação inesperada');
 });
 const db={query,transaction:async(callback:any)=>callback({})};
 expect(await normalizeRoomCapacity(db as any)).toEqual({normalized:[1,2],needsReview:[{id_sala:3,assentos:49}]});
 expect(rooms[2].capacidade).toBe(70);
 expect(await normalizeRoomCapacity(db as any)).toEqual({normalized:[],needsReview:[{id_sala:3,assentos:49}]});
 expect(query.mock.calls.filter(([sql])=>sql.startsWith('UPDATE'))).toHaveLength(2);
 expect(query.mock.calls.some(([sql])=>/DELETE|DROP/i.test(sql))).toBe(false);
});
