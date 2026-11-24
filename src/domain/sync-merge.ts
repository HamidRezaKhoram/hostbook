// Bringing guests' replies and bring-board claims back into the host's party (ADR-010).
// Pure: the app feeds in what Firebase sends and saves what comes out.
import type { BoardEntry, Reply, SharePublish } from '../sync/types';
import { isCovered } from './derive';
import { newGuest, type IdFn } from './factories';
import { buildPublish } from './share';
import type { Party } from './types';

export interface MergeResult {
  party: Party;
  /** Short lines for a toast: "Leo: yes", "Jo will bring Dessert". */
  news: string[];
}

const RSVP_WORD = { yes: 'coming', maybe: 'maybe', no: "can't come" } as const;

/** Applies replies newer than what the host already has. */
export function mergeReplies(party: Party, replies: Record<string, Reply>): MergeResult {
  const news: string[] = [];
  const guests = party.guests.map((g) => {
    const r = g.token ? replies[g.token] : undefined;
    if (!r || (g.reply && g.reply.at >= r.at)) return g;
    news.push(`${g.name}: ${RSVP_WORD[r.rsvp]}`);
    const plusOnes =
      r.plusOnes === undefined ? g.plusOnes : Math.max(0, Math.min(10, Math.floor(r.plusOnes)));
    return { ...g, rsvp: r.rsvp, plusOnes, reply: r };
  });
  return { party: news.length ? { ...party, guests } : party, news };
}

const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase('en-CA') === b.trim().toLocaleLowerCase('en-CA');

/**
 * Claims made by guests on the board become assignments; released claims free the item again.
 * Someone not on the guest list who claims from the open board is added as coming.
 */
export function mergeBoard(
  party: Party,
  board: Record<string, BoardEntry>,
  ownerUid: string,
  id: IdFn = () => crypto.randomUUID(),
): MergeResult {
  const news: string[] = [];
  let guests = party.guests;
  const tasks = party.tasks.map((t) => {
    if (t.kind !== 'bring') return t;
    const claim = board[t.id]?.claim;
    if (claim && claim.uid !== ownerUid) {
      if (t.claimUid === claim.uid) return t;
      let guest = guests.find((g) => sameName(g.name, claim.name));
      if (!guest) {
        guest = { ...newGuest(claim.name, 'yes', id), note: 'Joined from the bring board' };
        guests = [...guests, guest];
      }
      news.push(`${guest.name} will bring ${t.title}`);
      return { ...t, assigneeIds: [guest.id], status: 'confirmed' as const, claimUid: claim.uid };
    }
    if (!claim && t.claimUid) {
      const who = guests.find((g) => t.assigneeIds.includes(g.id))?.name ?? 'Someone';
      news.push(`${who} can't bring ${t.title} after all`);
      const { claimUid: _gone, ...rest } = t;
      return { ...rest, assigneeIds: [], status: 'open' as const };
    }
    return t;
  });
  if (!news.length) return { party, news };
  return { party: { ...party, guests, tasks }, news };
}

/**
 * Board claims the host's own assignments should have. Never touches a guest's claim: a claim
 * made since the last merge is left alone until mergeBoard brings it in.
 */
export function hostClaimWrites(
  party: Party,
  board: Record<string, BoardEntry>,
  ownerUid: string,
): { slotId: string; name: string | null }[] {
  const names = new Map(party.guests.map((g) => [g.id, g.name]));
  const writes: { slotId: string; name: string | null }[] = [];
  for (const t of party.tasks) {
    if (t.kind !== 'bring' || t.claimUid) continue;
    const current = board[t.id]?.claim;
    if (current && current.uid !== ownerUid) continue;
    const wanted = isCovered(t) ? (names.get(t.assigneeIds[0]!) ?? null) : null;
    if (wanted && current?.name !== wanted) writes.push({ slotId: t.id, name: wanted });
    if (!wanted && current) writes.push({ slotId: t.id, name: null });
  }
  return writes;
}

/** What to publish now, including deleting the links of guests removed since last time. */
export function publishPlan(party: Party): { data: SharePublish; tokens: string[] } {
  const tokens = party.guests.map((g) => g.token).filter((t): t is string => !!t);
  const removed = (party.share?.publishedTokens ?? []).filter((t) => !tokens.includes(t));
  return { data: buildPublish(party, removed), tokens };
}
