import { showToast } from '../../app/toast';
import type { Guest, Party, Rsvp } from '../../domain/types';
import { putParty, updateParty } from '../../store/parties';

export const RSVP_LABELS: Record<Rsvp, string> = {
  yes: 'Yes',
  maybe: 'Maybe',
  invited: 'No reply',
  no: "Can't come",
};

/** Removes a guest everywhere (list and task assignments), with undo. */
export function removeGuest(party: Party, guest: Guest): void {
  const before = party;
  updateParty(party.id, (p) => ({
    ...p,
    guests: p.guests.filter((g) => g.id !== guest.id),
    tasks: p.tasks.map((t) =>
      t.assigneeIds.includes(guest.id)
        ? { ...t, assigneeIds: t.assigneeIds.filter((id) => id !== guest.id) }
        : t,
    ),
  }));
  showToast(`Removed ${guest.name}`, { label: 'Undo', run: () => putParty(before) });
}
