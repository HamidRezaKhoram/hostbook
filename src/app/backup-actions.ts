import { backupFileName, makeBackup, mergeParties, readBackup } from '../domain/backup';
import { downloadText } from '../lib/download';
import { parties, putParty } from '../store/parties';
import { showToast } from './toast';

export function exportBackup(): void {
  const now = new Date();
  downloadText(backupFileName(now), makeBackup(parties.value, now));
  for (const p of parties.value) putParty({ ...p, lastBackupAt: now.toISOString() });
  showToast(
    `Backup saved (${parties.value.length} ${parties.value.length === 1 ? 'party' : 'parties'})`,
  );
}

export async function restoreBackup(file: File): Promise<void> {
  try {
    const { parties: incoming, skipped } = readBackup(await file.text());
    const { parties: merged, added, updated } = mergeParties(parties.value, incoming);
    for (const p of merged) if (incoming.includes(p)) putParty(p);
    const extra = skipped.length ? `, ${skipped.length} couldn't be read` : '';
    showToast(`Restored: ${added} new, ${updated} updated${extra}`);
  } catch (e) {
    showToast((e as Error).message, undefined, true);
  }
}
