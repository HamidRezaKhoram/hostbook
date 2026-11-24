import { describe, expect, it } from 'vitest';
import {
  hostClaimWrites,
  mergeBoard,
  mergeReplies,
  publishPlan,
} from '../../src/domain/sync-merge';
import { withShareIds } from '../../src/domain/share';
import type { BoardEntry } from '../../src/sync/types';
import { sampleParty, seq } from './helpers';

const shared = () => withShareIds(sampleParty(), seq('s')); // tokens s-2 (Maya) … s-6 (Ana)
const OWNER = 'host-uid';

describe('mergeReplies', () => {
  it("applies a guest's newer reply and reports it", () => {
    const p = shared();
    const { party, news } = mergeReplies(p, {
      's-4': { rsvp: 'yes', plusOnes: 2, note: 'Bringing kids', at: 100 },
    });
    const sam = party.guests[2]!;
    expect([sam.rsvp, sam.plusOnes, sam.reply?.note]).toEqual(['yes', 2, 'Bringing kids']);
    expect(news).toEqual(['Sam: coming']);
  });

  it('ignores replies it already has, and unknown tokens', () => {
    const first = mergeReplies(shared(), { 's-3': { rsvp: 'no', at: 100 } }).party;
    expect(mergeReplies(first, { 's-3': { rsvp: 'yes', at: 100 } })).toEqual({
      party: first,
      news: [],
    });
    expect(mergeReplies(first, { nope: { rsvp: 'yes', at: 200 } }).news).toEqual([]);
    const later = mergeReplies(first, { 's-3': { rsvp: 'maybe', at: 200 } });
    expect([later.party.guests[1]!.rsvp, later.news]).toEqual(['maybe', ['Leo: maybe']]);
  });

  it('keeps plus-ones sane', () => {
    const { party } = mergeReplies(shared(), { 's-2': { rsvp: 'yes', plusOnes: 99, at: 1 } });
    expect(party.guests[0]!.plusOnes).toBe(10);
    const keep = mergeReplies(shared(), { 's-3': { rsvp: 'yes', at: 1 } }).party;
    expect(keep.guests[1]!.plusOnes).toBe(1);
  });
});

describe('mergeBoard', () => {
  const claim = (uid: string, name: string): BoardEntry => ({
    slot: { title: 'x' },
    claim: { uid, name, at: 1 },
  });

  it("a guest's claim assigns the item to them, confirmed", () => {
    const p = shared();
    const salad = p.tasks.find((t) => t.title === 'Green salad')!;
    const { party, news } = mergeBoard(p, { [salad.id]: claim('jo-uid', 'jo ') }, OWNER);
    const t = party.tasks.find((x) => x.id === salad.id)!;
    expect([t.assigneeIds, t.status, t.claimUid]).toEqual([
      [p.guests[3]!.id],
      'confirmed',
      'jo-uid',
    ]);
    expect(news).toEqual(['Jo will bring Green salad']);
    expect(mergeBoard(party, { [salad.id]: claim('jo-uid', 'Jo') }, OWNER).news).toEqual([]);
  });

  it('someone new from the open board is added as coming', () => {
    const p = shared();
    const salad = p.tasks.find((t) => t.title === 'Green salad')!;
    const { party } = mergeBoard(p, { [salad.id]: claim('x', 'Priya') }, OWNER, seq('n'));
    const priya = party.guests.at(-1)!;
    expect(priya).toMatchObject({
      id: 'n-1',
      name: 'Priya',
      rsvp: 'yes',
      note: 'Joined from the bring board',
    });
    expect(party.tasks.find((t) => t.id === salad.id)!.assigneeIds).toEqual(['n-1']);
  });

  it('a released claim frees the item; host claims are ignored', () => {
    const p = shared();
    const salad = p.tasks.find((t) => t.title === 'Green salad')!;
    const claimed = mergeBoard(p, { [salad.id]: claim('jo-uid', 'Jo') }, OWNER).party;
    const released = mergeBoard(claimed, {}, OWNER);
    const t = released.party.tasks.find((x) => x.id === salad.id)!;
    expect([t.assigneeIds, t.status, t.claimUid]).toEqual([[], 'open', undefined]);
    expect(released.news).toEqual(["Jo can't bring Green salad after all"]);
    expect(mergeBoard(p, { [salad.id]: claim(OWNER, 'Leo') }, OWNER)).toEqual({
      party: p,
      news: [],
    });
  });
});

describe('hostClaimWrites', () => {
  it("mirrors the host's assignments onto the board, never touching guests' claims", () => {
    const p = shared();
    const ice = p.tasks.find((t) => t.category === 'ice')!; // Leo, confirmed
    const dessert = p.tasks.find((t) => t.title === 'Dessert')!; // Sam, asked
    const salad = p.tasks.find((t) => t.title === 'Green salad')!; // open
    const board: Record<string, BoardEntry> = {
      [dessert.id]: { slot: { title: 'Dessert' }, claim: { uid: OWNER, name: 'Old name', at: 1 } },
      [salad.id]: { slot: { title: 'Green salad' }, claim: { uid: OWNER, name: 'Jo', at: 1 } },
    };
    const writes = hostClaimWrites(p, board, OWNER);
    expect(writes).toContainEqual({ slotId: ice.id, name: 'Leo' });
    expect(writes).toContainEqual({ slotId: dessert.id, name: 'Sam' });
    expect(writes).toContainEqual({ slotId: salad.id, name: null });
    const guestClaim = {
      [salad.id]: { slot: { title: 'x' }, claim: { uid: 'jo-uid', name: 'Jo', at: 1 } },
    };
    expect(
      hostClaimWrites(p, guestClaim, OWNER).find((w) => w.slotId === salad.id),
    ).toBeUndefined();
    const synced = {
      [ice.id]: { slot: { title: 'Ice' }, claim: { uid: OWNER, name: 'Leo', at: 1 } },
    };
    expect(hostClaimWrites(p, synced, OWNER).find((w) => w.slotId === ice.id)).toBeUndefined();
  });
});

describe('publishPlan', () => {
  it('publishes every guest and deletes the links of removed guests', () => {
    const p = shared();
    p.share!.publishedTokens = ['s-2', 's-3', 'gone'];
    const { data, tokens } = publishPlan(p);
    expect(tokens).toEqual(['s-2', 's-3', 's-4', 's-5', 's-6']);
    expect(data.guests!.gone).toBeNull();
    expect(data.guests!['s-3']!.name).toBe('Leo');
  });
});
