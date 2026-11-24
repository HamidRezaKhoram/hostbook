// IndexedDB storage (ADR-004): one record per party, keyed by id.
import { createStore, del, set, values, type UseStore } from 'idb-keyval';
import type { Party } from '../domain/types';

let store: UseStore | undefined;
const db = () => (store ??= createStore('hostbook', 'parties'));

export const readAll = (): Promise<unknown[]> => values(db());
export const write = (party: Party): Promise<void> => set(party.id, party, db());
export const erase = (id: string): Promise<void> => del(id, db());
