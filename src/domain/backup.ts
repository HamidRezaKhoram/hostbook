// Backup files: every party in one JSON file the host can save and restore (ADR-004).
import { loadParty, PartyFormatError } from './migrations';
import type { Party } from './types';

export interface BackupFile {
  app: 'hostbook';
  version: 1;
  exportedAt: string;
  parties: Party[];
}

export function makeBackup(parties: Party[], now = new Date()): string {
  const file: BackupFile = { app: 'hostbook', version: 1, exportedAt: now.toISOString(), parties };
  return JSON.stringify(file, null, 1);
}

export function backupFileName(now = new Date()): string {
  return `hostbook-backup-${now.toISOString().slice(0, 10)}.json`;
}

export interface Restored {
  parties: Party[];
  /** Parties in the file that couldn't be read, with the reason. */
  skipped: string[];
}

/** Reads a backup file, or a single exported party. Bad parties are skipped, not fatal. */
export function readBackup(text: string): Restored {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new PartyFormatError('this is not a Hostbook backup file');
  }
  const list =
    typeof data === 'object' && data !== null && (data as BackupFile).app === 'hostbook'
      ? (data as BackupFile).parties
      : [data];
  if (!Array.isArray(list)) throw new PartyFormatError('this is not a Hostbook backup file');
  const parties: Party[] = [];
  const skipped: string[] = [];
  list.forEach((raw, i) => {
    try {
      parties.push(loadParty(raw));
    } catch (e) {
      skipped.push(`#${i + 1}: ${(e as Error).message}`);
    }
  });
  if (!parties.length && skipped.length) throw new PartyFormatError(skipped[0]!);
  return { parties, skipped };
}

/** Restoring keeps whichever copy of a party was changed most recently. */
export function mergeParties(
  current: Party[],
  incoming: Party[],
): { parties: Party[]; added: number; updated: number } {
  const byId = new Map(current.map((p) => [p.id, p]));
  let added = 0;
  let updated = 0;
  for (const p of incoming) {
    const mine = byId.get(p.id);
    if (!mine) added++;
    else if (p.updatedAt > mine.updatedAt) updated++;
    else continue;
    byId.set(p.id, p);
  }
  return { parties: [...byId.values()], added, updated };
}
