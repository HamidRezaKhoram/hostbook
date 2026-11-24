// The host's parties: loaded once from IndexedDB, kept in a signal, saved on every change.
import { signal } from '@preact/signals';
import { loadParty } from '../domain/migrations';
import type { Party } from '../domain/types';
import { showToast } from '../app/toast';
import { erase, readAll, write } from './db';

export const parties = signal<Party[]>([]);
export const ready = signal(false);

function saveFailed(e: unknown) {
  console.error(e);
  showToast("Couldn't save on this device. Export a backup from More.", undefined, true);
}

export async function loadParties(): Promise<void> {
  try {
    const loaded: Party[] = [];
    for (const raw of await readAll()) {
      try {
        loaded.push(loadParty(raw));
      } catch (e) {
        console.error('Skipping unreadable party', e);
      }
    }
    parties.value = loaded;
  } catch (e) {
    console.error(e);
    showToast("Couldn't open saved parties on this device.", undefined, true);
  } finally {
    ready.value = true;
  }
}

export const findParty = (id: string) => parties.value.find((p) => p.id === id);

export function putParty(party: Party): void {
  const exists = parties.value.some((p) => p.id === party.id);
  parties.value = exists
    ? parties.value.map((p) => (p.id === party.id ? party : p))
    : [...parties.value, party];
  write(party).catch(saveFailed);
}

/** Apply a change to a party and save it. The recipe gets the current party and returns the next. */
export function updateParty(id: string, recipe: (p: Party) => Party): void {
  const current = findParty(id);
  if (!current) return;
  putParty({ ...recipe(current), updatedAt: new Date().toISOString() });
}

export function removeParty(id: string): Party | undefined {
  const gone = findParty(id);
  parties.value = parties.value.filter((p) => p.id !== id);
  erase(id).catch(saveFailed);
  return gone;
}
