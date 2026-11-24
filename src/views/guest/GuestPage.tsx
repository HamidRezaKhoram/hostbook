import { useEffect, useState } from 'preact/hooks';
import { appUrl, getSync } from '../../app/sharing';
import { showToast } from '../../app/toast';
import { Field, Input, Segmented, TextArea } from '../../components/fields';
import { Screen } from '../../components/Screen';
import type { SyncPort } from '../../sync/port';
import type { BoardEntry, GuestRsvp, GuestView } from '../../sync/types';
import { smsHref } from '../../domain/messages';
import { BoardList } from './BoardList';
import { GuestFooter, PartyFacts } from './GuestDetails';

type Load =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; why: string }
  | { status: 'ok'; view: GuestView; sync: SyncPort; uid: string };

const RSVP: { value: GuestRsvp; label: string }[] = [
  { value: 'yes', label: "I'm coming" },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: "Can't come" },
];

export function GuestPage({ shareId, token }: { shareId: string; token: string }) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [board, setBoard] = useState<Record<string, BoardEntry>>({});
  const [rsvp, setRsvp] = useState<GuestRsvp | undefined>();
  const [plusOnes, setPlusOnes] = useState('0');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let alive = true;
    (async () => {
      const sync = await getSync();
      if (!sync)
        return setLoad({ status: 'error', why: "Live links aren't available in this version." });
      const [view, uid] = await Promise.all([sync.loadGuestView(shareId, token), sync.uid()]);
      if (!alive) return;
      if (!view) return setLoad({ status: 'missing' });
      setLoad({ status: 'ok', view, sync, uid });
      if (view.reply) {
        setRsvp(view.reply.rsvp);
        setPlusOnes(String(view.reply.plusOnes ?? 0));
        setNote(view.reply.note ?? '');
      }
      stop = sync.watchBoard(shareId, setBoard);
    })().catch((e: unknown) => {
      if (alive) setLoad({ status: 'error', why: (e as Error).message });
    });
    return () => {
      alive = false;
      stop?.();
    };
  }, [shareId, token]);

  if (load.status === 'loading') {
    return (
      <main class="app" aria-busy="true">
        <p class="muted center">Loading your invitation…</p>
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
              ? 'The host may have changed the guest list or stopped sharing. Ask them for a new link.'
              : `Check your connection and try again. (${load.why})`}
          </p>
          <GuestFooter />
        </Screen>
      </main>
    );
  }

  const { view, sync, uid } = load;
  const { info, guest } = view;
  const host = info.hostName;
  const url = appUrl({ name: 'guest', shareId, token });

  async function send() {
    if (!rsvp) return;
    setSending(true);
    try {
      const reply = {
        rsvp,
        ...(rsvp !== 'no'
          ? { plusOnes: Math.max(0, Math.min(10, Math.floor(Number(plusOnes) || 0))) }
          : {}),
        ...(note.trim() ? { note: note.trim().slice(0, 500) } : {}),
      };
      await sync.sendReply(shareId, token, reply);
      setLoad({ ...load, view: { ...view, reply: { ...reply, at: Date.now() } } } as Load);
      showToast(`Sent! ${host} can see it now.`);
    } catch (e) {
      showToast(`Couldn't send: ${(e as Error).message}`, undefined, true);
    } finally {
      setSending(false);
    }
  }

  async function claim(slotId: string) {
    setBusy(slotId);
    const ok = await sync.claim(shareId, slotId, guest.name).catch(() => false);
    setBusy(null);
    showToast(ok ? `Thanks! ${host} can see it.` : 'Someone just took that one.');
  }

  async function release(slotId: string) {
    setBusy(slotId);
    await sync.release(shareId, slotId).catch(() => undefined);
    setBusy(null);
  }

  return (
    <main class="app">
      <Screen
        title={info.name}
        docTitle={info.name}
        kicker={<span class="brand">Hi {guest.name}!</span>}
      >
        <PartyFacts info={info} guest={guest} url={url} />

        <section class="card stack-sm" aria-labelledby="reply">
          <h2 id="reply" class="card__title">
            {view.reply ? 'Your reply' : `Let ${host} know`}
          </h2>
          <Segmented label="Are you coming?" options={RSVP} value={rsvp} onChange={setRsvp} />
          {rsvp && rsvp !== 'no' && (
            <Field label="Bringing anyone? (extra people)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                value={plusOnes}
                onValue={setPlusOnes}
              />
            </Field>
          )}
          <Field label={`Note for ${host} (optional)`}>
            <TextArea
              rows={2}
              value={note}
              onValue={setNote}
              placeholder="Food allergies, running late…"
            />
          </Field>
          <button
            type="button"
            class="btn btn--block"
            disabled={!rsvp || sending}
            onClick={() => void send()}
          >
            {view.reply ? 'Update my reply' : 'Send'}
          </button>
          {view.reply && <p class="hint">{host} has your reply. You can change it any time.</p>}
        </section>

        <BoardList
          board={board}
          myUid={uid}
          busy={busy}
          onClaim={(id) => void claim(id)}
          onRelease={(id) => void release(id)}
        />

        {guest.hostPhone && (
          <a
            class="btn btn--ghost btn--block"
            href={smsHref(guest.hostPhone, `Hi ${host}, it's ${guest.name}. `)}
          >
            Text {host}
          </a>
        )}
        <GuestFooter />
      </Screen>
    </main>
  );
}
