// Firebase Realtime Database adapter for SyncPort (ADR-010). Load it lazily:
//   const { createFirebaseSync } = await import('./sync/firebase');
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
} from 'firebase/auth';
import {
  connectDatabaseEmulator,
  get,
  getDatabase,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
  type Database,
} from 'firebase/database';
import { firebaseConfig, firebaseEmulator } from './firebase-config';
import type { Unsubscribe, SyncPort } from './port';
import type {
  BoardEntry,
  GuestShare,
  GuestView,
  Reply,
  ReplyInput,
  ShareInfo,
  SharePublish,
} from './types';

export interface FirebaseSyncOptions {
  config?: FirebaseOptions;
  /** Separate app instances act as separate devices (used by tests). */
  appName?: string;
  emulator?: { host: string; authPort: number; databasePort: number };
}

const isPermissionDenied = (e: unknown) =>
  e instanceof Error &&
  /permission[_ ]denied/i.test(`${(e as { code?: string }).code} ${e.message}`);

/** RTDB rejects `undefined`; drop those keys (deeply) before writing. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createFirebaseSync(opts: FirebaseSyncOptions = {}): SyncPort {
  const config = opts.config ?? firebaseConfig;
  if (!config) throw new Error('Firebase is not configured: copy .env.example to .env.local');
  const app = initializeApp(config, opts.appName ?? '[DEFAULT]');
  const auth: Auth = getAuth(app);
  const db: Database = getDatabase(app);
  const emulator = opts.emulator ?? firebaseEmulator;
  if (emulator) {
    const { host, authPort, databasePort } = emulator;
    connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true });
    connectDatabaseEmulator(db, host, databasePort);
  }

  let signingIn: Promise<string> | undefined;
  function uid(): Promise<string> {
    signingIn ??= new Promise<string>((resolve, reject) => {
      const stop = onAuthStateChanged(auth, (user) => {
        if (user) {
          stop();
          resolve(user.uid);
        }
      });
      signInAnonymously(auth).catch((e: unknown) => {
        stop();
        signingIn = undefined;
        reject(e);
      });
    });
    return signingIn;
  }

  const share = (partyId: string, path = '') => ref(db, `shares/${partyId}${path && '/' + path}`);

  return {
    uid,

    async publish(partyId, data: SharePublish) {
      const owner = await uid();
      // A multi-path update: never overwrite the share, or guests' replies and claims would vanish.
      const changes: Record<string, unknown> = { owner, info: clean(data.info) };
      for (const [token, guest] of Object.entries(data.guests ?? {})) {
        changes[`guests/${token}`] = guest && clean(guest);
        if (!guest) changes[`replies/${token}`] = null;
      }
      for (const [slotId, slot] of Object.entries(data.board ?? {})) {
        changes[slot ? `board/${slotId}/slot` : `board/${slotId}`] = slot && clean(slot);
      }
      await update(share(partyId), changes);
    },

    async unpublish(partyId) {
      await uid();
      await remove(share(partyId));
    },

    async assign(partyId, slotId, name) {
      const me = await uid();
      const target = share(partyId, `board/${slotId}/claim`);
      if (name === null) await remove(target);
      else await set(target, { uid: me, name, at: serverTimestamp() });
    },

    watchReplies(partyId, cb, onError) {
      let stop: Unsubscribe = () => {};
      let stopped = false;
      void uid().then(() => {
        if (stopped) return;
        stop = onValue(
          share(partyId, 'replies'),
          (snap) => cb((snap.val() as Record<string, Reply> | null) ?? {}),
          (e) => onError?.(e),
        );
      }, onError);
      return () => {
        stopped = true;
        stop();
      };
    },

    watchBoard(partyId, cb, onError) {
      let stop: Unsubscribe = () => {};
      let stopped = false;
      void uid().then(() => {
        if (stopped) return;
        stop = onValue(
          share(partyId, 'board'),
          (snap) => cb((snap.val() as Record<string, BoardEntry> | null) ?? {}),
          (e) => onError?.(e),
        );
      }, onError);
      return () => {
        stopped = true;
        stop();
      };
    },

    async loadInfo(partyId) {
      await uid();
      const snap = await get(share(partyId, 'info'));
      return snap.exists() ? (snap.val() as ShareInfo) : null;
    },

    async loadGuestView(partyId, token): Promise<GuestView | null> {
      await uid();
      const [info, guest, reply] = await Promise.all([
        get(share(partyId, 'info')),
        get(share(partyId, `guests/${token}`)),
        get(share(partyId, `replies/${token}`)),
      ]);
      if (!info.exists() || !guest.exists()) return null;
      return {
        info: info.val() as ShareInfo,
        guest: guest.val() as GuestShare,
        reply: (reply.val() as Reply | null) ?? null,
      };
    },

    async sendReply(partyId, token, reply: ReplyInput) {
      await uid();
      await set(share(partyId, `replies/${token}`), { ...clean(reply), at: serverTimestamp() });
    },

    async claim(partyId, slotId, name) {
      const me = await uid();
      try {
        // The rules only allow this when the slot exists and is unclaimed, so a race has one winner.
        await set(share(partyId, `board/${slotId}/claim`), {
          uid: me,
          name,
          at: serverTimestamp(),
        });
        return true;
      } catch (e) {
        if (isPermissionDenied(e)) return false;
        throw e;
      }
    },

    async release(partyId, slotId) {
      await uid();
      await remove(share(partyId, `board/${slotId}/claim`));
    },
  };
}
