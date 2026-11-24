import { describe, expect, it } from 'vitest';
import {
  boardAssignments,
  boardSlots,
  buildPublish,
  guestShare,
  shareInfo,
  whenText,
  withShareIds,
} from '../../src/domain/share';
import { sampleParty, seq } from './helpers';

// Strings that must never leave the host's device through any share.
const PRIVATE = [
  'PRIVATE',
  'EpiPen',
  'tree-nut',
  'vegetarian',
  'halal',
  '0101',
  '0102',
  'climbing',
];
const leaks = (value: unknown, banned: string[]) => {
  const json = JSON.stringify(value);
  return banned.filter((b) => json.includes(b));
};

describe('shareInfo: what anyone with the party link sees', () => {
  it('has the logistics', () => {
    expect(shareInfo(sampleParty())).toEqual({
      name: 'Dumpling Night',
      start: '2026-12-12T19:00',
      end: '2026-12-12T23:00',
      tz: 'America/Toronto',
      place: { address: '12 Birch Rd', parking: 'Street' },
      food: 'Potluck: everyone brings a dish',
      note: 'Shoes off, slippers provided',
      hostName: 'Hamid',
    });
  });

  it('never includes private data, the door code, or the host phone', () => {
    expect(
      leaks(shareInfo(sampleParty()), [...PRIVATE, '4412', '0100', 'Maya', 'Leo', 'Sam']),
    ).toEqual([]);
  });

  it('omits an empty place', () => {
    const p = sampleParty();
    p.location = {};
    expect(shareInfo(p).place).toBeUndefined();
  });
});

describe('guestShare: one guest’s own link', () => {
  const p = sampleParty();
  const [maya, leo] = p.guests;

  it("has the guest's time, roles and tasks, plus door code and host phone", () => {
    expect(guestShare(p, leo!)).toEqual({
      name: 'Leo',
      arrival: '2026-12-12T19:00',
      tasks: [{ title: 'Ice', qty: '10 kg', note: 'Two bags is plenty' }],
      access: 'Code 4412',
      hostPhone: '+1 555 0100',
    });
    expect(guestShare(p, maya!)).toMatchObject({
      arrival: '2026-12-12T17:45',
      roles: ['Setup helper'],
    });
  });

  it("never includes other guests, anyone's dietary data, phones or notes", () => {
    for (const g of p.guests) {
      const others = p.guests.filter((o) => o.id !== g.id).map((o) => o.name);
      expect(leaks(guestShare(p, g), [...PRIVATE, ...others])).toEqual([]);
    }
  });

  it('describes when a task happens', () => {
    expect(whenText(undefined)).toBeUndefined();
    expect(whenText('before')).toBe('Before the party');
    expect(whenText('after')).toBe('After the party');
    expect(whenText({ at: '2026-12-12T18:30' })).toBe('6:30 p.m.');
  });
});

describe('the bring board', () => {
  it('lists bring tasks only, with friendly category names', () => {
    const p = sampleParty();
    const slots = boardSlots(p);
    expect(Object.keys(slots)).toHaveLength(p.tasks.filter((t) => t.kind === 'bring').length);
    expect(Object.values(slots)).toContainEqual({
      title: 'Ice',
      category: 'Ice',
      qty: '10 kg',
      note: 'Two bags is plenty',
    });
    expect(Object.values(slots).some((s) => /centrepiece|Setup crew/.test(s.title))).toBe(false);
  });

  it('shows assigned names; declined slots are open again', () => {
    const p = sampleParty();
    const ice = p.tasks.find((t) => t.category === 'ice')!;
    expect(boardAssignments(p)[ice.id]).toBe('Leo');
    ice.status = 'declined';
    expect(boardAssignments(p)[ice.id]).toBeNull();
    ice.assigneeIds = ['gone'];
    ice.status = 'asked';
    expect(boardAssignments(p)[ice.id]).toBeNull();
  });

  it('never shows private data', () => {
    expect(leaks(boardSlots(sampleParty()), [...PRIVATE, '4412', '0100'])).toEqual([]);
  });
});

describe('publishing', () => {
  it('assigns a share id and tokens once, keeping existing ones', () => {
    const p = withShareIds(sampleParty(), seq('s'));
    expect(p.share).toEqual({ partyId: 's-1' });
    expect(p.guests.map((g) => g.token)).toEqual(['s-2', 's-3', 's-4', 's-5', 's-6']);
    const again = withShareIds(p, seq('x'));
    expect(again.share).toEqual(p.share);
    expect(again.guests.map((g) => g.token)).toEqual(['s-2', 's-3', 's-4', 's-5', 's-6']);
  });

  it('publishes info, every tokened guest, the board, and removals', () => {
    const p = withShareIds(sampleParty(), seq('s'));
    p.guests.push({ ...p.guests[0]!, id: 'new', name: 'No Token', token: undefined });
    const pub = buildPublish(p, ['old-token']);
    expect(Object.keys(pub.guests!)).toEqual(['s-2', 's-3', 's-4', 's-5', 's-6', 'old-token']);
    expect(pub.guests!['old-token']).toBeNull();
    expect(pub.info.name).toBe('Dumpling Night');
    expect(Object.keys(pub.board!).length).toBeGreaterThan(5);
    expect(leaks({ ...pub, guests: {} }, [...PRIVATE, '4412'])).toEqual([]);
  });
});
