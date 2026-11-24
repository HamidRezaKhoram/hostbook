// Saved parties must keep loading forever. Every shape change bumps SCHEMA_VERSION and adds a
// migration from the previous version, with a fixture test of the old shape (CONTRIBUTING.md).
import { isLocalIso } from '../lib/time';
import { SCHEMA_VERSION, type Party } from './types';

type Raw = Record<string, unknown>;
/** `MIGRATIONS[n]` turns a version-n party into version n+1. */
export type Migrations = Record<number, (old: Raw) => Raw>;

export const MIGRATIONS: Migrations = {};

export class PartyFormatError extends Error {
  constructor(message: string) {
    super(`Can't read this party: ${message}`);
    this.name = 'PartyFormatError';
  }
}

const isObj = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export function migrate(
  raw: unknown,
  migrations: Migrations = MIGRATIONS,
  current = SCHEMA_VERSION,
): Raw {
  if (!isObj(raw)) throw new PartyFormatError('not an object');
  let data = raw;
  let v = data.schemaVersion;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1)
    throw new PartyFormatError('no schema version');
  if (v > current)
    throw new PartyFormatError(`made by a newer version of Hostbook (v${v}); update the app`);
  while (v < current) {
    const step = migrations[v];
    if (!step) throw new PartyFormatError(`no migration from v${v}`);
    data = { ...step(data), schemaVersion: v + 1 };
    v += 1;
  }
  return data;
}

/** Migrate, then check the shape enough that the app can't crash on a bad import. */
export function loadParty(raw: unknown): Party {
  const p = migrate(raw);
  const need = (ok: boolean, what: string) => {
    if (!ok) throw new PartyFormatError(what);
  };
  need(typeof p.id === 'string' && p.id.length > 0, 'missing id');
  need(typeof p.name === 'string', 'missing name');
  need(typeof p.start === 'string' && isLocalIso(p.start), 'bad start time');
  need(p.end === undefined || (typeof p.end === 'string' && isLocalIso(p.end)), 'bad end time');
  need(typeof p.tz === 'string', 'missing time zone');
  need(isObj(p.host) && typeof p.host.name === 'string', 'missing host');
  for (const key of ['guests', 'tasks', 'runSheet', 'checklist'] as const) {
    need(Array.isArray(p[key]), `missing ${key}`);
  }
  const guests = p.guests as unknown[];
  need(
    guests.every((g) => isObj(g) && typeof g.id === 'string' && typeof g.name === 'string'),
    'bad guest',
  );
  const tasks = p.tasks as unknown[];
  need(
    tasks.every((t) => isObj(t) && typeof t.id === 'string' && Array.isArray(t.assigneeIds)),
    'bad task',
  );
  return p as unknown as Party;
}
