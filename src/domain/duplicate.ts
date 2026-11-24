// "Same party next year": keep the plan and the people, reset everything that happened.
import type { IdFn } from './factories';
import type { Party } from './types';

export function duplicateParty(
  party: Party,
  now = new Date(),
  id: IdFn = () => crypto.randomUUID(),
): Party {
  const guestIds = new Map(party.guests.map((g) => [g.id, id()]));
  const stamp = now.toISOString();
  const { share: _share, debrief: _debrief, lastBackupAt: _backup, ...rest } = party;
  return {
    ...rest,
    id: id(),
    name: `${party.name} (copy)`,
    guests: party.guests.map(
      ({ token: _t, attended: _a, linkSentAt: _l, arrivalOverride: _o, ...g }) => ({
        ...g,
        id: guestIds.get(g.id)!,
        rsvp: 'invited',
      }),
    ),
    tasks: party.tasks.map((t) => ({ ...t, id: id(), assigneeIds: [], status: 'open' })),
    runSheet: party.runSheet.map((r) => {
      const { done: _d, whoIds: _w, ...item } = r;
      return { ...item, id: id() };
    }),
    checklist: party.checklist.map((c) => ({ ...c, id: id(), done: false })),
    createdAt: stamp,
    updatedAt: stamp,
  };
}
