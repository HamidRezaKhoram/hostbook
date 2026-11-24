// Live sharing for the host's parties (ADR-010). Firebase is loaded only when needed, and the
// app keeps working without it: sharing then falls back to offline links (ADR-005).
import { useEffect } from 'preact/hooks';
import { withShareIds } from '../domain/share';
import { hostClaimWrites, mergeBoard, mergeReplies, publishPlan } from '../domain/sync-merge';
import type { Party } from '../domain/types';
import type { SyncPort } from '../sync/port';
import type { BoardEntry } from '../sync/types';
import { findParty, putParty, updateParty } from '../store/parties';
import { hrefFor, type Route } from './router';
import { showToast } from './toast';

let syncPromise: Promise<SyncPort | null> | undefined;

/** The sharing backend, or null when this build has no Firebase config. */
export function getSync(): Promise<SyncPort | null> {
  syncPromise ??= (async () => {
    const { firebaseConfig } = await import('../sync/firebase-config');
    if (!firebaseConfig) return null;
    const { createFirebaseSync } = await import('../sync/firebase');
    return createFirebaseSync();
  })().catch((e: unknown) => {
    console.error(e);
    syncPromise = undefined;
    return null;
  });
  return syncPromise;
}

/** Full URL for an in-app route, e.g. a guest's link. */
export function appUrl(route: Route): string {
  return `${location.origin}${import.meta.env.BASE_URL}${hrefFor(route)}`;
}

function timeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${what} timed out`)), ms)),
  ]);
}

const lastPublished = new Map<string, string>();
const latestBoard = new Map<string, Record<string, BoardEntry>>();

/**
 * Publishes what guests should see (only if it changed) and returns the shared party. Gives
 * the party a share id and guests their tokens on first use. Throws when offline or not set up.
 */
export async function publishParty(partyId: string): Promise<Party> {
  const sync = await getSync();
  if (!sync) throw new Error('Live sharing is not set up in this version');
  if (!navigator.onLine) throw new Error('No connection');
  let party = findParty(partyId);
  if (!party) throw new Error('Party not found');
  if (!party.share || party.guests.some((g) => !g.token)) {
    party = withShareIds(party);
    putParty(party);
  }
  const shareId = party.share!.partyId;
  const { data, tokens } = publishPlan(party);
  const fingerprint = JSON.stringify(data);
  if (lastPublished.get(partyId) !== fingerprint) {
    await timeout(sync.publish(shareId, data), 12_000, 'Sharing');
    lastPublished.set(partyId, fingerprint);
  }
  const owner = await sync.uid();
  const board = latestBoard.get(partyId);
  if (board)
    for (const w of hostClaimWrites(party, board, owner))
      void sync.assign(shareId, w.slotId, w.name);
  const current = findParty(partyId) ?? party;
  if (JSON.stringify(current.share?.publishedTokens) !== JSON.stringify(tokens)) {
    party = {
      ...current,
      share: { ...current.share!, publishedTokens: tokens, publishedAt: new Date().toISOString() },
    };
    putParty(party); // not a host edit: keeps updatedAt
  }
  return findParty(partyId) ?? party;
}

/** Stops sharing: guests' links stop working and their replies are deleted. */
export async function stopSharing(partyId: string): Promise<void> {
  const sync = await getSync();
  const party = findParty(partyId);
  if (!sync || !party?.share) return;
  await timeout(sync.unpublish(party.share.partyId), 12_000, 'Stopping');
  lastPublished.delete(partyId);
  latestBoard.delete(partyId);
  updateParty(partyId, (p) => {
    const { share: _gone, ...rest } = p;
    return { ...rest, guests: p.guests.map(({ token: _t, ...g }) => g) };
  });
}

/**
 * While a shared party is open: bring in guests' replies and board claims live, and republish
 * shortly after the host changes something.
 */
export function usePartySync(party: Party): void {
  // Listen only once the share exists on the server: listening to a share that isn't
  // published yet is refused (found by the iPhone e2e tests: the first publish can lose the race).
  const shareId = party.share?.publishedAt ? party.share.partyId : undefined;

  useEffect(() => {
    if (!shareId) return;
    let stopped = false;
    const stops: (() => void)[] = [];
    const retries: ReturnType<typeof setTimeout>[] = [];

    /** Subscribes, and re-subscribes a few seconds after a refusal or dropped listen. */
    function keep(start: (onError: (e: Error) => void) => () => void) {
      let stop = () => {};
      const run = () => {
        if (stopped) return;
        stop = start((e) => {
          console.warn('Listening again soon:', e.message);
          retries.push(setTimeout(run, 3000));
        });
      };
      run();
      stops.push(() => stop());
    }

    void getSync().then(async (sync) => {
      if (!sync || stopped) return;
      const owner = await sync.uid();
      if (stopped) return;
      keep((onError) =>
        sync.watchReplies(
          shareId,
          (replies) => {
            const current = findParty(party.id);
            if (!current) return;
            const { party: next, news } = mergeReplies(current, replies);
            if (news.length) {
              updateParty(party.id, () => next);
              showToast(news.join(' · '));
            }
          },
          onError,
        ),
      );
      keep((onError) =>
        sync.watchBoard(
          shareId,
          (board) => {
            latestBoard.set(party.id, board);
            const current = findParty(party.id);
            if (!current) return;
            const { party: next, news } = mergeBoard(current, board, owner);
            if (news.length) {
              updateParty(party.id, () => next);
              showToast(news.join(' · '));
            }
            for (const w of hostClaimWrites(findParty(party.id)!, board, owner)) {
              void sync.assign(shareId, w.slotId, w.name);
            }
          },
          onError,
        ),
      );
    });
    return () => {
      stopped = true;
      retries.forEach(clearTimeout);
      stops.forEach((s) => s());
    };
  }, [party.id, shareId]);

  const shared = party.share?.partyId;
  useEffect(() => {
    if (!shared) return;
    const t = setTimeout(() => {
      publishParty(party.id).catch((e: unknown) => console.warn('Republish later:', e));
    }, 1200);
    return () => clearTimeout(t);
  }, [party.id, shared, party.updatedAt]);
}
