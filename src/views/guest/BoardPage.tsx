import { useEffect, useState } from 'preact/hooks';
import { getSync } from '../../app/sharing';
import { showToast } from '../../app/toast';
import { Field, Input } from '../../components/fields';
import { Screen } from '../../components/Screen';
import { appUrl } from '../../app/sharing';
import type { SyncPort } from '../../sync/port';
import type { BoardEntry, ShareInfo } from '../../sync/types';
import { getPrefs, setPrefs } from '../../store/prefs';
import { BoardList } from './BoardList';
import { GuestFooter, PartyFacts } from './GuestDetails';

type Load =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; why: string }
  | { status: 'ok'; info: ShareInfo; sync: SyncPort; uid: string };

/** The open bring board: anyone with the link picks something to bring. */
export function BoardPage({ shareId }: { shareId: string }) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [board, setBoard] = useState<Record<string, BoardEntry>>({});
  const [name, setName] = useState(getPrefs().boardName ?? '');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let alive = true;
    (async () => {
      const sync = await getSync();
      if (!sync)
        return setLoad({ status: 'error', why: "Live links aren't available in this version." });
      const [info, uid] = await Promise.all([sync.loadInfo(shareId), sync.uid()]);
      if (!alive) return;
      if (!info) return setLoad({ status: 'missing' });
      setLoad({ status: 'ok', info, sync, uid });
      stop = sync.watchBoard(shareId, setBoard);
    })().catch((e: unknown) => alive && setLoad({ status: 'error', why: (e as Error).message }));
    return () => {
      alive = false;
      stop?.();
    };
  }, [shareId]);

  if (load.status === 'loading') {
    return (
      <main class="app" aria-busy="true">
        <p class="muted center">Loading the bring list…</p>
      </main>
    );
  }
  if (load.status !== 'ok') {
    return (
      <main class="app">
        <Screen
          title={load.status === 'missing' ? 'This link has expired' : "Can't open this link"}
        >
          <p>
            {load.status === 'missing'
              ? 'The host stopped sharing this list.'
              : `Check your connection. (${load.why})`}
          </p>
          <GuestFooter />
        </Screen>
      </main>
    );
  }

  const { info, sync, uid } = load;
  async function claim(slotId: string) {
    const who = name.trim();
    if (!who) return showToast('Add your name first, so the host knows who.', undefined, true);
    setPrefs({ boardName: who });
    setBusy(slotId);
    const ok = await sync.claim(shareId, slotId, who.slice(0, 40)).catch(() => false);
    setBusy(null);
    showToast(ok ? `Thanks, ${who}! ${info.hostName} can see it.` : 'Someone just took that one.');
  }

  return (
    <main class="app">
      <Screen
        title={info.name}
        docTitle={info.name}
        kicker={<span class="brand">{info.hostName} is hosting</span>}
      >
        <PartyFacts info={info} url={appUrl({ name: 'board', shareId })} />
        <Field label="Your name" hint="So everyone knows who's bringing what.">
          <Input value={name} onValue={setName} autoComplete="given-name" />
        </Field>
        <BoardList
          board={board}
          myUid={uid}
          busy={busy}
          onClaim={(id) => void claim(id)}
          onRelease={(id) => void sync.release(shareId, id)}
        />
        <GuestFooter />
      </Screen>
    </main>
  );
}
