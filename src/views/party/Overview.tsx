import { useState } from 'preact/hooks';
import { partyHref } from '../../app/router';
import { Screen } from '../../components/Screen';
import { BUCKET_LABELS } from '../../domain/constants';
import { bringBoard, dietarySummary, headcount } from '../../domain/derive';
import { prepProgress } from '../../domain/progress';
import { formatWhen } from '../../lib/format';
import { nowLocal } from '../../lib/time';
import { updateParty } from '../../store/parties';
import { DetailsSheet } from './DetailsSheet';
import type { PartyProps } from './common';

export function Overview({ party }: PartyProps) {
  const [editing, setEditing] = useState(false);
  const h = headcount(party);
  const board = bringBoard(party);
  const total = board.reduce((n, g) => n + g.tasks.length, 0);
  const open = board.reduce((n, g) => n + g.open.length, 0);
  const prep = prepProgress(party, nowLocal(party.tz));
  const diet = dietarySummary(party).line;

  return (
    <Screen
      title={party.name}
      kicker={
        <a href="#/" class="kicker-link">
          ‹ Your parties
        </a>
      }
    >
      <div class="lede-block">
        <p class="when">{formatWhen(party.start, party.end)}</p>
        {party.location.address && <p class="muted">{party.location.address}</p>}
        {party.purpose ? (
          <p class="purpose">“{party.purpose}”</p>
        ) : (
          <button type="button" class="link link--button" onClick={() => setEditing(true)}>
            Why are we gathering? Add one sentence
          </button>
        )}
      </div>
      <button type="button" class="btn btn--ghost" onClick={() => setEditing(true)}>
        Edit details
      </button>

      <div class="stats">
        <a class="stat card" href={partyHref(party.id, 'guests')}>
          <span class="stat__label">Guests</span>
          <span class="stat__value">{h.expected} expected</span>
          <span class="stat__sub">
            {h.yes} yes · {h.maybe} maybe · {h.no} no{h.invited ? ` · ${h.invited} no reply` : ''}
          </span>
        </a>
        <a class="stat card" href={partyHref(party.id, 'bring')}>
          <span class="stat__label">Bring</span>
          <span class="stat__value">
            {total - open}/{total} covered
          </span>
          <span class={`stat__sub${open ? ' warn' : ''}`}>
            {open ? `${open} still open` : 'All covered'}
          </span>
        </a>
        <a class="stat card" href={partyHref(party.id, 'timeline')}>
          <span class="stat__label">Prep</span>
          <span class="stat__value">
            {prep.done}/{prep.total} done
          </span>
          <span class="stat__sub">Now: {BUCKET_LABELS[prep.current]}</span>
        </a>
      </div>

      {diet && (
        <p class="card diet-line">
          <strong>Dietary:</strong> {diet}
        </p>
      )}

      {prep.next.length > 0 && (
        <section class="card" aria-labelledby="next-up">
          <h2 id="next-up" class="card__title">
            Next up
          </h2>
          <ul class="plain-list">
            {prep.next.map((c) => (
              <li key={c.id}>
                <label class="check">
                  <input
                    type="checkbox"
                    checked={c.done}
                    onChange={() =>
                      updateParty(party.id, (p) => ({
                        ...p,
                        checklist: p.checklist.map((x) =>
                          x.id === c.id ? { ...x, done: !x.done } : x,
                        ),
                      }))
                    }
                  />
                  <span>{c.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
      {editing && <DetailsSheet party={party} onClose={() => setEditing(false)} />}
    </Screen>
  );
}
