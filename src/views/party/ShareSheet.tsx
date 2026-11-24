import { useEffect, useState } from 'preact/hooks';
import { appUrl, publishParty } from '../../app/sharing';
import { showToast } from '../../app/toast';
import { Field, Segmented, TextArea } from '../../components/fields';
import { Sheet } from '../../components/Sheet';
import {
  boardMessage,
  guestMessage,
  smsHref,
  whatsappHref,
  type MessageKind,
} from '../../domain/messages';
import { guestPayloadLink } from '../../domain/payload';
import { guestShare, shareInfo } from '../../domain/share';
import type { Party } from '../../domain/types';
import { findParty, updateParty } from '../../store/parties';

type LinkState =
  | { status: 'working' }
  | { status: 'live'; url: string }
  | { status: 'offline'; url: string }
  | { status: 'failed'; why: string };

const KINDS: { value: MessageKind; label: string }[] = [
  { value: 'invite', label: 'Invite' },
  { value: 'week', label: '1 week before' },
  { value: 'day', label: 'Day before' },
];

/** Share one guest's link (guestId), or the open bring board (guestId null). */
export function ShareSheet({
  party,
  guestId,
  onClose,
}: {
  party: Party;
  guestId: string | null;
  onClose: () => void;
}) {
  const [link, setLink] = useState<LinkState>({ status: 'working' });
  const [kind, setKind] = useState<MessageKind>('invite');
  const [text, setText] = useState('');
  const guest = guestId ? party.guests.find((g) => g.id === guestId) : undefined;

  useEffect(() => {
    let alive = true;
    publishParty(party.id)
      .then((p) => {
        const g = guestId ? p.guests.find((x) => x.id === guestId) : undefined;
        const url = g
          ? appUrl({ name: 'guest', shareId: p.share!.partyId, token: g.token! })
          : appUrl({ name: 'board', shareId: p.share!.partyId });
        if (alive) setLink({ status: 'live', url });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        const p = findParty(party.id) ?? party;
        const g = guestId ? p.guests.find((x) => x.id === guestId) : undefined;
        if (g) {
          const url = guestPayloadLink(appUrl({ name: 'home' }), {
            info: shareInfo(p),
            guest: guestShare(p, g),
            updatedAt: new Date().toISOString(),
          });
          setLink({ status: 'offline', url });
        } else {
          setLink({ status: 'failed', why: (e as Error).message });
        }
      });
    return () => {
      alive = false;
    };
  }, [party.id, guestId]);

  const url = link.status === 'live' || link.status === 'offline' ? link.url : '';
  useEffect(() => {
    if (!url) return;
    const p = findParty(party.id) ?? party;
    const g = guestId ? p.guests.find((x) => x.id === guestId) : undefined;
    setText(g ? guestMessage(kind, p, g, url) : boardMessage(p, url));
  }, [url, kind]);

  const sent = () => {
    if (guestId) {
      updateParty(party.id, (p) => ({
        ...p,
        guests: p.guests.map((g) =>
          g.id === guestId ? { ...g, linkSentAt: new Date().toISOString() } : g,
        ),
      }));
    }
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied. Paste it into any chat.');
      sent();
    } catch {
      showToast("Couldn't copy: select the text and copy it", undefined, true);
    }
  }

  async function share() {
    try {
      await navigator.share({ text });
      sent();
    } catch (e) {
      if ((e as Error).name !== 'AbortError') void copy();
    }
  }

  const title = guest ? `Send ${guest.name} their link` : 'Share the bring board';
  return (
    <Sheet title={title} onClose={onClose} doneLabel="Close">
      {link.status === 'working' && <p class="muted">Getting the link ready…</p>}
      {link.status === 'failed' && (
        <p class="form-error" role="alert">
          Couldn't share right now ({link.why}). Check the connection and try again.
        </p>
      )}
      {link.status === 'offline' && (
        <p class="banner banner--warn">
          No connection, so this is an offline link: it has all the details, but {guest?.name} can't
          reply through it. Send it again when you're back online for a live link.
        </p>
      )}
      {url && (
        <>
          {guest && (
            <Segmented label="Which message" options={KINDS} value={kind} onChange={setKind} />
          )}
          <Field label="Message" hint="Edit it if you like. The link is at the end.">
            <TextArea rows={5} value={text} onValue={setText} />
          </Field>
          <Field label="Link">
            <input class="input" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
          </Field>
          <div class="button-grid">
            {'share' in navigator && (
              <button type="button" class="btn" onClick={() => void share()}>
                Share…
              </button>
            )}
            <button type="button" class="btn btn--ghost" onClick={() => void copy()}>
              Copy message
            </button>
            <a class="btn btn--ghost" href={smsHref(guest?.phone, text)} onClick={sent}>
              Text message
            </a>
            <a
              class="btn btn--ghost"
              href={whatsappHref(guest?.phone, text)}
              target="_blank"
              rel="noopener"
              onClick={sent}
            >
              WhatsApp
            </a>
          </div>
        </>
      )}
    </Sheet>
  );
}
