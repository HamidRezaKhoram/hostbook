import { partyHref } from '../../app/router';
import type { Party } from '../../domain/types';

export interface PartyProps {
  party: Party;
}

/** Small link above a tab's heading, back to the party overview. */
export function PartyKicker({ party }: PartyProps) {
  return (
    <a href={partyHref(party.id)} class="kicker-link">
      ‹ {party.name}
    </a>
  );
}
