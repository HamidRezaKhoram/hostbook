// What leaves the device when the host shares (ADR-010). Everything here is a *projection*:
// only fields chosen on purpose are copied, so private data can't leak by accident.
import { newShareId } from '../lib/ids';
import { formatTime } from '../lib/format';
import type { BoardSlot, GuestShare, ShareInfo, SharePublish } from '../sync/types';
import { CATEGORY_LABELS, ROLE_LABELS } from './constants';
import { arrivalTime, leaveTime, tasksFor } from './derive';
import type { FoodStyle, Guest, Party, Task } from './types';

const FOOD_TEXT: Record<FoodStyle, string> = {
  'full-meal': 'Dinner is served',
  snacks: 'Snacks and drinks, not a full meal',
  potluck: 'Potluck: everyone brings a dish',
  'eat-first': 'Eat before you come',
};

/** Drop undefined and empty-string fields so the payload stays small and clean. */
function compact<T extends object>(o: T): T {
  return Object.fromEntries(
    Object.entries(o).filter(
      ([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length),
    ),
  ) as T;
}

export function whenText(when: Task['when']): string | undefined {
  if (!when) return undefined;
  if (typeof when === 'object') return formatTime(when.at);
  return {
    before: 'Before the party',
    arrival: 'When you arrive',
    during: 'During the party',
    after: 'After the party',
  }[when];
}

/** Party logistics for anyone with the party link. No door code, no phone numbers, no notes. */
export function shareInfo(party: Party): ShareInfo {
  const place = compact({
    label: party.location.label,
    address: party.location.address,
    mapsUrl: party.location.mapsUrl,
    parking: party.location.parking,
  });
  return compact({
    name: party.name,
    start: party.start,
    end: party.end,
    tz: party.tz,
    place: Object.keys(place).length ? place : undefined,
    food: party.details.food && FOOD_TEXT[party.details.food],
    dress: party.details.dress,
    note: party.details.guestNote,
    hostName: party.host.name,
  });
}

/** One guest's own part: their time, roles and tasks, plus door code and host phone. */
export function guestShare(party: Party, guest: Guest): GuestShare {
  const roles = guest.roles.filter((r) => r !== 'regular').map((r) => ROLE_LABELS[r]);
  const tasks = tasksFor(party, guest.id).map((t) =>
    compact({ title: t.title, qty: t.quantity, when: whenText(t.when), note: t.note }),
  );
  return compact({
    name: guest.name,
    arrival: arrivalTime(party, guest),
    leave: leaveTime(party, guest),
    roles,
    tasks,
    access: party.location.access,
    hostPhone: party.host.phone,
  });
}

/** The bring board: bring tasks only, no assignee details beyond a display name. */
export function boardSlots(party: Party): Record<string, BoardSlot> {
  return Object.fromEntries(
    party.tasks
      .filter((t) => t.kind === 'bring')
      .map((t) => [
        t.id,
        compact({
          title: t.title,
          category: CATEGORY_LABELS[t.category],
          qty: t.quantity,
          note: t.note,
        }),
      ]),
  );
}

/** Who the host assigned to each bring slot (first name shown on the board), or null. */
export function boardAssignments(party: Party): Record<string, string | null> {
  const names = new Map(party.guests.map((g) => [g.id, g.name]));
  return Object.fromEntries(
    party.tasks
      .filter((t) => t.kind === 'bring')
      .map((t) => {
        const who =
          t.status === 'declined' ? undefined : t.assigneeIds.map((id) => names.get(id))[0];
        return [t.id, who ?? null];
      }),
  );
}

/** Gives the party a share id and every guest a token, keeping existing ones. */
export function withShareIds(party: Party, id: () => string = newShareId): Party {
  return {
    ...party,
    share: party.share ?? { partyId: id() },
    guests: party.guests.map((g) => (g.token ? g : { ...g, token: id() })),
  };
}

/**
 * Everything to publish. Guests who were removed since the last publish are passed in
 * `removedTokens` so their records (and replies) are deleted.
 */
export function buildPublish(party: Party, removedTokens: string[] = []): SharePublish {
  const guests: SharePublish['guests'] = {};
  for (const g of party.guests) if (g.token) guests[g.token] = guestShare(party, g);
  for (const t of removedTokens) guests[t] = null;
  return { info: shareInfo(party), guests, board: boardSlots(party) };
}
