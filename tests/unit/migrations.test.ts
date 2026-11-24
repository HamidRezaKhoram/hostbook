import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { headcount } from '../../src/domain/derive';
import { loadParty, migrate, PartyFormatError } from '../../src/domain/migrations';
import { SCHEMA_VERSION } from '../../src/domain/types';

const fixture = (name: string) =>
  JSON.parse(readFileSync(`tests/fixtures/${name}`, 'utf8')) as Record<string, unknown>;

describe('loading saved parties', () => {
  it('loads a saved v1 party unchanged', () => {
    const raw = fixture('party-v1.json');
    const p = loadParty(raw);
    expect(p).toEqual(raw);
    expect(SCHEMA_VERSION).toBe(1);
    expect(headcount(p).expected).toBe(2);
  });

  it('runs migrations in order up to the current version', () => {
    const steps = {
      1: (o: Record<string, unknown>) => ({ ...o, a: 'from 1' }),
      2: (o: Record<string, unknown>) => ({ ...o, b: `${String(o.a)}, then 2` }),
    };
    expect(migrate({ schemaVersion: 1 }, steps, 3)).toEqual({
      schemaVersion: 3,
      a: 'from 1',
      b: 'from 1, then 2',
    });
    expect(() => migrate({ schemaVersion: 1 }, {}, 2)).toThrow(/no migration from v1/);
  });

  it('refuses parties from a newer app, or without a version', () => {
    expect(() => migrate({ schemaVersion: 99 })).toThrow(/newer version/);
    expect(() => migrate({})).toThrow(/no schema version/);
    expect(() => migrate({ schemaVersion: 0 })).toThrow(/no schema version/);
    expect(() => migrate([])).toThrow(/not an object/);
    expect(() => migrate(null)).toThrow(PartyFormatError);
  });

  it.each([
    ['missing id', { id: '' }],
    ['missing name', { name: 3 }],
    ['bad start time', { start: '12/12/2026' }],
    ['bad end time', { end: 'late' }],
    ['missing time zone', { tz: undefined }],
    ['missing host', { host: 'Hamid' }],
    ['missing guests', { guests: {} }],
    ['bad guest', { guests: [{ name: 'No id' }] }],
    ['bad task', { tasks: [{ id: 't', title: 'x' }] }],
  ])('rejects a corrupt party: %s', (message, patch) => {
    expect(() => loadParty({ ...fixture('party-v1.json'), ...patch })).toThrow(message);
  });
});
