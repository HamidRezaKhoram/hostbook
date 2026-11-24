// Security rules for /shares (ADR-010), checked one by one against the database emulator.
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const id = (s: string) => s.padEnd(22, '0'); // share ids and tokens are 22 url-safe chars
const P = id('party');
const T = id('leo-token'); // issued to Leo
const T2 = id('stranger-token'); // never issued
const NOW = { '.sv': 'timestamp' };

const info = {
  name: 'Dumpling Night',
  start: '2026-12-12T19:00',
  tz: 'America/Toronto',
  hostName: 'Hamid',
};
const leo = { name: 'Leo', arrival: '2026-12-12T19:00', access: '4412', hostPhone: '+15550100' };

let env: RulesTestEnvironment;
const as = (uid: string) => env.authenticatedContext(uid).database();
const anon = () => env.unauthenticatedContext().database();
const at = (db: ReturnType<typeof anon>, path = '') => db.ref(`shares/${P}${path && '/' + path}`);

/** A share owned by "host", with Leo invited and two slots (one free, one assigned by the host). */
async function seed() {
  await assertSucceeds(
    at(as('host')).set({
      owner: 'host',
      info,
      guests: { [T]: leo },
      board: {
        ice: { slot: { title: 'Ice', qty: '10 kg' } },
        wine: { slot: { title: 'Wine' }, claim: { uid: 'host', name: 'Jo', at: NOW } },
      },
    }),
  );
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-hostbook',
    database: { rules: readFileSync('database.rules.json', 'utf8'), host: '127.0.0.1', port: 9000 },
  });
});
afterAll(() => env.cleanup());
beforeEach(() => env.clearDatabase());

describe('creating and owning a share', () => {
  it('a signed-in host can create a share they own', seed);

  it('signed-out users cannot create anything', async () => {
    await assertFails(at(anon()).set({ owner: 'x', info }));
  });

  it('nobody can create a share owned by someone else', async () => {
    await assertFails(at(as('mallory')).set({ owner: 'host', info }));
  });

  it('share ids must be 22 url-safe characters', async () => {
    await assertFails(as('host').ref('shares/short').set({ owner: 'host', info }));
    await assertFails(
      as('host')
        .ref(`shares/${id('bad~chars~here')}`)
        .set({ owner: 'host', info }),
    );
  });

  it('a share needs info with name, start, tz and hostName', async () => {
    await assertFails(at(as('host')).set({ owner: 'host', info: { name: 'x' } }));
  });

  it('unknown keys are rejected', async () => {
    await assertFails(at(as('host')).set({ owner: 'host', info, extra: 1 }));
  });

  it('only the owner can change the share; the owner can never be changed', async () => {
    await seed();
    await assertFails(at(as('mallory'), 'info/name').set('Hijacked'));
    await assertFails(at(as('mallory')).set({ owner: 'mallory', info }));
    await assertFails(at(as('host'), 'owner').set('mallory'));
    await assertSucceeds(at(as('host'), 'info/name').set('Dumpling Night II'));
  });

  it('only the owner can delete the share', async () => {
    await seed();
    await assertFails(at(as('mallory')).remove());
    await assertSucceeds(at(as('host')).remove());
  });
});

describe('reading', () => {
  beforeEach(seed);

  it('anyone with the party id can read info and the board', async () => {
    await assertSucceeds(at(anon(), 'info').get());
    await assertSucceeds(at(as('someone'), 'board').get());
  });

  it('only the owner can read the whole share or list guests and replies', async () => {
    await assertFails(at(as('someone')).get());
    await assertFails(at(as('someone'), 'guests').get());
    await assertFails(at(as('someone'), 'replies').get());
    await assertSucceeds(at(as('host')).get());
    await assertSucceeds(at(as('host'), 'replies').get());
  });

  it("a guest's token unlocks only their own record", async () => {
    await assertSucceeds(at(as('leo'), `guests/${T}`).get());
    await assertSucceeds(at(as('leo'), `replies/${T}`).get());
  });
});

describe('guest replies', () => {
  beforeEach(seed);

  it('a token holder can RSVP and change it', async () => {
    await assertSucceeds(at(as('leo'), `replies/${T}`).set({ rsvp: 'yes', plusOnes: 1, at: NOW }));
    await assertSucceeds(
      at(as('leo'), `replies/${T}`).set({ rsvp: 'no', note: 'Sick, sorry', at: NOW }),
    );
  });

  it('must be signed in, and the token must have been issued by the host', async () => {
    await assertFails(at(anon(), `replies/${T}`).set({ rsvp: 'yes', at: NOW }));
    await assertFails(at(as('leo'), `replies/${T2}`).set({ rsvp: 'yes', at: NOW }));
  });

  it('rejects bad values', async () => {
    const r = at(as('leo'), `replies/${T}`);
    await assertFails(r.set({ rsvp: 'definitely', at: NOW }));
    await assertFails(r.set({ rsvp: 'yes' }));
    await assertFails(r.set({ rsvp: 'yes', at: Date.now() + 3_600_000 }));
    await assertFails(r.set({ rsvp: 'yes', plusOnes: 11, at: NOW }));
    await assertFails(r.set({ rsvp: 'yes', plusOnes: 1.5, at: NOW }));
    await assertFails(r.set({ rsvp: 'yes', note: 'x'.repeat(501), at: NOW }));
    await assertFails(r.set({ rsvp: 'yes', at: NOW, isAdmin: true }));
  });

  it('guests cannot touch info, guest records or other parts of the share', async () => {
    await assertFails(at(as('leo'), `guests/${T}/arrival`).set('2026-12-12T17:00'));
    await assertFails(at(as('leo'), `guests/${T2}`).set(leo));
    await assertFails(at(as('leo'), 'info/name').set('Leo party'));
  });
});

describe('claiming bring-slots', () => {
  beforeEach(seed);
  const claim = (uid: string, name = 'Leo') => ({ uid, name, at: NOW });

  it('anyone signed in can claim an open slot', async () => {
    await assertSucceeds(at(as('leo'), 'board/ice/claim').set(claim('leo')));
  });

  it('a taken slot cannot be claimed or released by someone else', async () => {
    await assertSucceeds(at(as('leo'), 'board/ice/claim').set(claim('leo')));
    await assertFails(at(as('sam'), 'board/ice/claim').set(claim('sam', 'Sam')));
    await assertFails(at(as('sam'), 'board/ice/claim').remove());
    await assertFails(at(as('sam'), 'board/wine/claim').set(claim('sam', 'Sam')));
  });

  it('the claimer can release their own claim', async () => {
    await assertSucceeds(at(as('leo'), 'board/ice/claim').set(claim('leo')));
    await assertSucceeds(at(as('leo'), 'board/ice/claim').remove());
  });

  it('you can only claim in your own name, for slots that exist', async () => {
    await assertFails(at(as('leo'), 'board/ice/claim').set(claim('sam')));
    await assertFails(at(as('leo'), 'board/nope/claim').set(claim('leo')));
    await assertFails(at(anon(), 'board/ice/claim').set(claim('leo')));
  });

  it('rejects bad claim values', async () => {
    const c = at(as('leo'), 'board/ice/claim');
    await assertFails(c.set({ uid: 'leo', name: '', at: NOW }));
    await assertFails(c.set({ uid: 'leo', name: 'x'.repeat(41), at: NOW }));
    await assertFails(c.set({ uid: 'leo', name: 'Leo', at: NOW, paid: true }));
  });

  it('guests cannot edit the slot itself', async () => {
    await assertFails(at(as('leo'), 'board/ice/slot/qty').set('1 cube'));
    await assertFails(at(as('leo'), 'board/cake/slot').set({ title: 'Cake' }));
  });

  it('the host can assign, reassign and clear any slot', async () => {
    await assertSucceeds(at(as('leo'), 'board/ice/claim').set(claim('leo')));
    await assertSucceeds(at(as('host'), 'board/ice/claim').set(claim('host', 'Sam')));
    await assertSucceeds(at(as('host'), 'board/wine/claim').remove());
  });
});
