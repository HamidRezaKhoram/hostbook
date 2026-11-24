import { useState } from 'preact/hooks';
import { exportBackup } from '../../app/backup-actions';
import { stopSharing } from '../../app/sharing';
import { go } from '../../app/route';
import { partyHref } from '../../app/router';
import { showToast } from '../../app/toast';
import { Field, TextArea } from '../../components/fields';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { duplicateParty } from '../../domain/duplicate';
import type { Party } from '../../domain/types';
import { formatDay } from '../../lib/format';
import { putParty, removeParty, updateParty } from '../../store/parties';
import { RestoreButton } from '../Home';
import { PartyKicker, type PartyProps } from './common';

type Debrief = NonNullable<Party['debrief']>;

function DeleteSheet({ party, onClose }: PartyProps & { onClose: () => void }) {
  return (
    <Sheet title={`Delete ${party.name}?`} onClose={onClose} doneLabel="Keep it">
      <p>This removes the party and its guests, tasks and notes from this device.</p>
      <button
        type="button"
        class="btn btn--danger btn--block"
        onClick={() => {
          removeParty(party.id);
          go('#/', true);
          showToast(`Deleted ${party.name}`, { label: 'Undo', run: () => putParty(party) });
        }}
      >
        Delete party
      </button>
    </Sheet>
  );
}

export function More({ party }: PartyProps) {
  const [deleting, setDeleting] = useState(false);
  const setDebrief = (patch: Partial<Debrief>) =>
    updateParty(party.id, (p) => ({
      ...p,
      debrief: { ...p.debrief, ...patch, at: new Date().toISOString() },
    }));
  const coming = party.guests.filter((g) => g.rsvp === 'yes' || g.rsvp === 'maybe');
  const built = new Date(__BUILD_TIME__).toLocaleString('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Screen title="More" docTitle={`More · ${party.name}`} kicker={<PartyKicker party={party} />}>
      <section class="card stack-sm" aria-labelledby="notes">
        <h2 id="notes" class="card__title">
          Notes
        </h2>
        <Field label="Private notes" hint="Only you see these. Never shared.">
          <TextArea
            rows={5}
            value={party.notes}
            onValue={(v) => updateParty(party.id, (p) => ({ ...p, notes: v }))}
          />
        </Field>
      </section>

      <section class="card stack-sm" aria-labelledby="after">
        <h2 id="after" class="card__title">
          After the party
        </h2>
        {coming.length > 0 && (
          <fieldset class="field">
            <legend class="field__label">Who came?</legend>
            {coming.map((g) => (
              <label key={g.id} class="check">
                <input
                  type="checkbox"
                  checked={!!g.attended}
                  onChange={(e) => {
                    const attended = e.currentTarget.checked;
                    updateParty(party.id, (p) => ({
                      ...p,
                      guests: p.guests.map((x) => (x.id === g.id ? { ...x, attended } : x)),
                    }));
                  }}
                />
                <span>{g.name}</span>
              </label>
            ))}
          </fieldset>
        )}
        <Field label="What worked?">
          <TextArea
            rows={2}
            value={party.debrief?.worked ?? ''}
            onValue={(v) => setDebrief({ worked: v })}
          />
        </Field>
        <Field label="What would I change?">
          <TextArea
            rows={2}
            value={party.debrief?.change ?? ''}
            onValue={(v) => setDebrief({ change: v })}
          />
        </Field>
        <Field label="Who clicked? Who to invite again?">
          <TextArea
            rows={2}
            value={party.debrief?.clicked ?? ''}
            onValue={(v) => setDebrief({ clicked: v })}
          />
        </Field>
      </section>

      {party.share && (
        <section class="card stack-sm" aria-labelledby="sharing">
          <h2 id="sharing" class="card__title">
            Sharing
          </h2>
          <p class="muted">
            Guests' links are live: replies and bring-list picks show up here, and your changes
            reach them automatically.
          </p>
          <button
            type="button"
            class="btn btn--danger btn--block"
            onClick={() =>
              stopSharing(party.id)
                .then(() => showToast("Stopped sharing. Old links won't work any more."))
                .catch((e: unknown) =>
                  showToast(`Couldn't stop sharing: ${(e as Error).message}`, undefined, true),
                )
            }
          >
            Stop sharing
          </button>
        </section>
      )}

      <section class="card stack-sm" aria-labelledby="party-actions">
        <h2 id="party-actions" class="card__title">
          This party
        </h2>
        <button
          type="button"
          class="btn btn--ghost btn--block"
          onClick={() => {
            const copy = duplicateParty(party);
            putParty(copy);
            go(partyHref(copy.id));
            showToast(`Made a copy: ${copy.name}`);
          }}
        >
          Duplicate (same party next time)
        </button>
        <button type="button" class="btn btn--danger btn--block" onClick={() => setDeleting(true)}>
          Delete party
        </button>
      </section>

      <section class="card stack-sm" aria-labelledby="backup">
        <h2 id="backup" class="card__title">
          Backup
        </h2>
        <p class="muted">
          Your parties live only on this phone. Save a backup file now and then.
          {party.lastBackupAt && ` Last backup: ${formatDay(party.lastBackupAt.slice(0, 16))}.`}
        </p>
        <button type="button" class="btn btn--ghost btn--block" onClick={exportBackup}>
          Save a backup (all parties)
        </button>
        <RestoreButton />
      </section>

      <div class="card">
        <h2 class="card__title">Install on your phone</h2>
        <p>
          iPhone: Share → <strong>Add to Home Screen</strong>. Android: menu ⋮ →{' '}
          <strong>Install app</strong>. It then works offline and keeps your data safer.
        </p>
      </div>
      <a class="btn btn--ghost btn--block" href="#/">
        All parties
      </a>
      <p class="fine">Built {built}</p>
      {deleting && <DeleteSheet party={party} onClose={() => setDeleting(false)} />}
    </Screen>
  );
}
