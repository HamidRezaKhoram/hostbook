import { useState } from 'preact/hooks';
import { showToast } from '../../app/toast';
import { Field, TextArea } from '../../components/fields';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { ALLERGEN_LABELS, ROLE_LABELS } from '../../domain/constants';
import { arrivalTime, dietarySummary, headcount, tasksFor } from '../../domain/derive';
import { newGuest, parseNameList } from '../../domain/factories';
import type { Rsvp } from '../../domain/types';
import { formatTime } from '../../lib/format';
import { updateParty } from '../../store/parties';
import { RSVP_LABELS } from './guest-actions';
import { GuestSheet } from './GuestSheet';
import { PartyKicker, type PartyProps } from './common';

const RSVP_ORDER: Rsvp[] = ['yes', 'maybe', 'invited', 'no'];

function AddGuestsSheet({ party, onClose }: PartyProps & { onClose: () => void }) {
  const [text, setText] = useState('');
  const names = parseNameList(text);
  const existing = new Set(party.guests.map((g) => g.name.toLocaleLowerCase('en-CA')));
  const fresh = names.filter((n) => !existing.has(n.toLocaleLowerCase('en-CA')));
  return (
    <Sheet title="Add guests" onClose={onClose} doneLabel="Close">
      <Field label="Names" hint="One per line, or paste a list from your messages.">
        <TextArea rows={6} value={text} onValue={setText} placeholder={'Maya\nLeo\nSam'} />
      </Field>
      {names.length > fresh.length && (
        <p class="hint">{names.length - fresh.length} already on the list.</p>
      )}
      <button
        type="button"
        class="btn btn--block"
        disabled={!fresh.length}
        onClick={() => {
          updateParty(party.id, (p) => ({
            ...p,
            guests: [...p.guests, ...fresh.map((n) => newGuest(n))],
          }));
          showToast(`Added ${fresh.length} ${fresh.length === 1 ? 'guest' : 'guests'}`);
          onClose();
        }}
      >
        {fresh.length
          ? `Add ${fresh.length} ${fresh.length === 1 ? 'guest' : 'guests'}`
          : 'Add guests'}
      </button>
    </Sheet>
  );
}

export function Guests({ party }: PartyProps) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const h = headcount(party);
  const diet = dietarySummary(party).line;
  const sorted = [...party.guests].sort(
    (a, b) =>
      RSVP_ORDER.indexOf(a.rsvp) - RSVP_ORDER.indexOf(b.rsvp) || a.name.localeCompare(b.name),
  );
  const current = party.guests.find((g) => g.id === editing);

  return (
    <Screen
      title="Guests"
      docTitle={`Guests · ${party.name}`}
      kicker={<PartyKicker party={party} />}
    >
      <p class="summary">
        <strong>{h.expected} expected</strong> · {h.yes} yes · {h.maybe} maybe · {h.invited} no
        reply · {h.no} can't
      </p>
      {diet && (
        <p class="card diet-line">
          <strong>Dietary:</strong> {diet}
        </p>
      )}
      <button type="button" class="btn btn--block" onClick={() => setAdding(true)}>
        + Add guests
      </button>
      {sorted.length === 0 ? (
        <p class="muted center">No guests yet. Paste your list to start.</p>
      ) : (
        <ul class="plain-list rows card">
          {sorted.map((g) => {
            const roles = g.roles.filter((r) => r !== 'regular').map((r) => ROLE_LABELS[r]);
            const tasks = tasksFor(party, g.id).map((t) => t.title);
            const allergies = g.dietary.allergies.map((a) => ALLERGEN_LABELS[a]);
            return (
              <li key={g.id}>
                <button type="button" class="row" onClick={() => setEditing(g.id)}>
                  <span class="row__main">
                    <span class="row__title">
                      {g.name}
                      {g.plusOnes > 0 && <span class="muted"> +{g.plusOnes}</span>}
                    </span>
                    <span class="row__sub">
                      {[`arrives ${formatTime(arrivalTime(party, g))}`, ...roles, ...tasks].join(
                        ' · ',
                      )}
                    </span>
                    {allergies.length > 0 && (
                      <span class="row__sub warn">⚠ {allergies.join(', ')} allergy</span>
                    )}
                  </span>
                  <span class={`badge badge--${g.rsvp}`}>{RSVP_LABELS[g.rsvp]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {adding && <AddGuestsSheet party={party} onClose={() => setAdding(false)} />}
      {current && <GuestSheet party={party} guest={current} onClose={() => setEditing(null)} />}
    </Screen>
  );
}
