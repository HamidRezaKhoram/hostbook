// The real Firebase adapter end to end: a host device and guest devices, each with its own
// anonymous account, talking through the auth + database emulators.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newShareId } from '../../src/lib/ids';
import { createFirebaseSync } from '../../src/sync/firebase';
import type { SyncPort } from '../../src/sync/port';
import type { BoardEntry, Reply, ShareInfo } from '../../src/sync/types';

const NS = 'demo-hostbook-sync';
const emulator = { host: '127.0.0.1', authPort: 9099, databasePort: 9000 };
const config = {
  apiKey: 'demo-key',
  projectId: 'demo-hostbook',
  databaseURL: `http://127.0.0.1:9000?ns=${NS}`,
};
let n = 0;
const device = (): SyncPort => createFirebaseSync({ config, emulator, appName: `device-${++n}` });

const info: ShareInfo = {
  name: 'Dumpling Night',
  start: '2026-12-12T19:00',
  end: '2026-12-12T22:00',
  tz: 'America/Toronto',
  hostName: 'Hamid',
  place: { address: '12 Birch Rd', parking: 'Street' },
};

/** Resolves with the first value from a watch that passes `ok`. */
function next<T>(watch: (cb: (v: T) => void) => () => void, ok: (v: T) => boolean): Promise<T> {
  return new Promise((resolve) => {
    const stop = watch((v) => {
      if (ok(v)) {
        queueMicrotask(() => stop());
        resolve(v);
      }
    });
  });
}

beforeAll(async () => {
  // Load the real rules into this test's namespace.
  const res = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer owner' },
    body: readFileSync('database.rules.json', 'utf8'),
  });
  expect(res.ok).toBe(true);
});

afterAll(async () => {
  await fetch(`http://127.0.0.1:9000/.json?ns=${NS}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer owner' },
  });
});

describe('Firebase sync', () => {
  const partyId = newShareId();
  const leoToken = newShareId();
  const samToken = newShareId();
  const host = device();
  const leo = device();
  const sam = device();

  it('gives each device its own anonymous account', async () => {
    const ids = await Promise.all([host.uid(), leo.uid(), sam.uid()]);
    expect(new Set(ids).size).toBe(3);
  });

  it('host publishes; a guest link opens only that guest’s part', async () => {
    await host.publish(partyId, {
      info,
      guests: {
        [leoToken]: {
          name: 'Leo',
          arrival: '2026-12-12T19:00',
          tasks: [{ title: 'Ice', qty: '10 kg' }],
          access: '4412',
          hostPhone: '+15550100',
          leave: undefined,
        },
        [samToken]: { name: 'Sam', arrival: '2026-12-12T17:45', roles: ['helper'] },
      },
      board: { ice: { title: 'Ice', qty: '10 kg' }, cake: { title: 'Dessert for 12' } },
    });
    const view = await leo.loadGuestView(partyId, leoToken);
    expect(view).toEqual({
      info,
      guest: {
        name: 'Leo',
        arrival: '2026-12-12T19:00',
        tasks: [{ title: 'Ice', qty: '10 kg' }],
        access: '4412',
        hostPhone: '+15550100',
      },
      reply: null,
    });
    expect(await leo.loadGuestView(partyId, newShareId())).toBeNull();
  });

  it('a guest RSVP reaches the host live', async () => {
    const seen = next<Record<string, Reply>>(
      (cb) => host.watchReplies(partyId, cb),
      (r) => r[leoToken]?.rsvp === 'yes',
    );
    await leo.sendReply(partyId, leoToken, { rsvp: 'yes', plusOnes: 1, note: 'Bringing Ana' });
    const replies = await seen;
    expect(replies[leoToken]).toMatchObject({ rsvp: 'yes', plusOnes: 1, note: 'Bringing Ana' });
    expect(replies[leoToken]!.at).toBeGreaterThan(Date.now() - 60_000);
    expect((await leo.loadGuestView(partyId, leoToken))!.reply?.rsvp).toBe('yes');
  });

  it('two guests race for one slot: exactly one wins, and everyone sees who', async () => {
    const results = await Promise.all([
      leo.claim(partyId, 'ice', 'Leo'),
      sam.claim(partyId, 'ice', 'Sam'),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    const winner = results[0] ? 'Leo' : 'Sam';
    const board = await next<Record<string, BoardEntry>>(
      (cb) => host.watchBoard(partyId, cb),
      (b) => !!b.ice?.claim,
    );
    expect(board.ice!.claim!.name).toBe(winner);
    expect(board.cake!.claim).toBeUndefined();
  });

  it('a guest can release their own claim, and the host can assign anyone', async () => {
    const board = await next<Record<string, BoardEntry>>(
      (cb) => leo.watchBoard(partyId, cb),
      () => true,
    );
    const winner = board.ice!.claim!.name === 'Leo' ? leo : sam;
    await winner.release(partyId, 'ice');
    await host.assign(partyId, 'ice', 'Jo');
    const after = await next<Record<string, BoardEntry>>(
      (cb) => sam.watchBoard(partyId, cb),
      (b) => b.ice?.claim?.name === 'Jo',
    );
    expect(after.ice!.claim!.name).toBe('Jo');
  });

  it('republishing keeps replies and claims; removing a guest drops their reply', async () => {
    await host.publish(partyId, { info: { ...info, name: 'Dumpling Night!' } });
    expect((await leo.loadGuestView(partyId, leoToken))!.reply?.rsvp).toBe('yes');
    await host.publish(partyId, { info, guests: { [leoToken]: null } });
    expect(await leo.loadGuestView(partyId, leoToken)).toBeNull();
    expect((await sam.loadGuestView(partyId, samToken))!.guest.name).toBe('Sam');
  });

  it('a guest cannot publish over the host’s share', async () => {
    await expect(leo.publish(partyId, { info: { ...info, name: 'Leo’s party' } })).rejects.toThrow(
      /permission/i,
    );
  });

  it('unpublish removes everything', async () => {
    await host.unpublish(partyId);
    expect(await sam.loadGuestView(partyId, samToken)).toBeNull();
  });
});
