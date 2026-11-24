import { newGuest, newParty } from '../../src/domain/factories';
import type { Guest, Party } from '../../src/domain/types';

/** Predictable ids: id-1, id-2, ... */
export function seq(prefix = 'id') {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

export const NOW = new Date('2026-11-24T12:00:00Z');

export function guest(
  name: string,
  patch: Partial<Guest> = {},
  id = seq(name.toLowerCase()),
): Guest {
  return { ...newGuest(name, 'yes', id), ...patch };
}

/**
 * Dumpling Night: a potluck, Sat Dec 12 7–11 p.m., with private details that must never be
 * shared (notes, phones, dietary info, door code only for guests).
 */
export function sampleParty(): Party {
  const p = newParty(
    {
      type: 'potluck',
      name: 'Dumpling Night',
      start: '2026-12-12T19:00',
      tz: 'America/Toronto',
      hostName: 'Hamid',
      purpose: 'Mix the climbing and work crews',
    },
    NOW,
    seq('t'),
  );
  p.location = { address: '12 Birch Rd', parking: 'Street', access: 'Code 4412' };
  p.host.phone = '+1 555 0100';
  p.details.guestNote = 'Shoes off, slippers provided';
  p.notes = 'PRIVATE: Leo and Sam had a falling out';
  p.guests = [
    guest('Maya', {
      roles: ['helper'],
      phone: '+1 555 0101',
      dietary: { allergies: [], diets: ['vegetarian'], religious: [] },
    }),
    guest('Leo', { phone: '+1 555 0102', note: 'PRIVATE: always late', plusOnes: 1 }),
    guest('Sam', {
      rsvp: 'maybe',
      dietary: { allergies: ['tree-nut'], diets: [], religious: [], note: 'EpiPen in bag' },
    }),
    guest('Jo', { rsvp: 'no', roles: ['seed'] }),
    guest('Ana', {
      rsvp: 'invited',
      dietary: { allergies: [], diets: ['vegetarian'], religious: ['halal'] },
    }),
  ];
  const ice = p.tasks.find((t) => t.category === 'ice')!;
  ice.assigneeIds = [p.guests[1]!.id];
  ice.status = 'confirmed';
  ice.quantity = '10 kg';
  ice.note = 'Two bags is plenty';
  const dessert = p.tasks.find((t) => t.title === 'Dessert')!;
  dessert.assigneeIds = [p.guests[2]!.id];
  dessert.status = 'asked';
  return p;
}
