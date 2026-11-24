// Prep checklist progress: which stage the host is in and what to do next.
import { minutesBetween } from '../lib/time';
import { BUCKET_ORDER, BUCKET_STARTS_DAYS_BEFORE } from './constants';
import type { Bucket, ChecklistItem, Party } from './types';

export interface PrepProgress {
  done: number;
  total: number;
  /** The stage we're in now, based on days until the party. */
  current: Bucket;
  /** Undone items from earlier stages and the current one, oldest first (max 3). */
  next: ChecklistItem[];
}

export function currentBucket(party: Party, nowLocal: string): Bucket {
  const minsToStart = minutesBetween(nowLocal, party.start);
  if (minsToStart <= 0) {
    if (party.end && minutesBetween(nowLocal, party.end) <= 0) return 'after';
    return 'during';
  }
  if (minsToStart <= 5) return 'min5';
  const days = minsToStart / (24 * 60);
  if (days < 1) return 'day';
  // The latest stage whose start (days before) we have reached.
  const stages = (['w6', 'w3', 'w1', 'd2'] as Bucket[]).filter(
    (b) => days <= BUCKET_STARTS_DAYS_BEFORE[b],
  );
  return stages.at(-1) ?? 'w6';
}

export function prepProgress(party: Party, nowLocal: string): PrepProgress {
  const current = currentBucket(party, nowLocal);
  const upTo = BUCKET_ORDER.indexOf(current);
  const next = party.checklist
    .filter((c) => !c.done && BUCKET_ORDER.indexOf(c.bucket) <= upTo)
    .sort((a, b) => BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket))
    .slice(0, 3);
  return {
    done: party.checklist.filter((c) => c.done).length,
    total: party.checklist.length,
    current,
    next,
  };
}
