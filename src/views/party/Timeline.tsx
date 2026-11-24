import { useState } from 'preact/hooks';
import { showToast } from '../../app/toast';
import { Field, Input, Segmented } from '../../components/fields';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { BUCKET_LABELS, BUCKET_ORDER, ROLE_LABELS } from '../../domain/constants';
import { arrivalOffset } from '../../domain/derive';
import { currentBucket } from '../../domain/progress';
import type { Bucket, Party, RunItem } from '../../domain/types';
import { formatDay, formatTime } from '../../lib/format';
import { addMinutes, isLocalIso, minutesBetween, nowLocal } from '../../lib/time';
import { putParty, updateParty } from '../../store/parties';
import { PartyKicker, type PartyProps } from './common';

const id = () => crypto.randomUUID();

/** A clock time on the party's first day → minutes from the start (after-midnight times roll over). */
function offsetFor(party: Party, time: string): number | null {
  const at = `${party.start.slice(0, 10)}T${time}`;
  if (!isLocalIso(at)) return null;
  const m = minutesBetween(party.start, at);
  return m < -12 * 60 ? m + 24 * 60 : m;
}

function Prep({ party }: PartyProps) {
  const [text, setText] = useState('');
  const [bucket, setBucket] = useState<Bucket>(currentBucket(party, nowLocal(party.tz)));
  const now = currentBucket(party, nowLocal(party.tz));
  const done = party.checklist.filter((c) => c.done).length;
  const toggle = (cid: string) =>
    updateParty(party.id, (p) => ({
      ...p,
      checklist: p.checklist.map((c) => (c.id === cid ? { ...c, done: !c.done } : c)),
    }));
  return (
    <>
      <p class="summary">
        <strong>
          {done}/{party.checklist.length} done
        </strong>{' '}
        · now: {BUCKET_LABELS[now]}
      </p>
      {BUCKET_ORDER.map((b) => {
        const items = party.checklist.filter((c) => c.bucket === b);
        if (!items.length) return null;
        return (
          <section key={b} class="stack-sm" aria-labelledby={`b-${b}`}>
            <h2 id={`b-${b}`} class="section-title">
              {BUCKET_LABELS[b]} {b === now && <span class="chip">Now</span>}
            </h2>
            <ul class="plain-list rows card">
              {items.map((c) => (
                <li key={c.id} class="row row--check">
                  <label class="check">
                    <input type="checkbox" checked={c.done} onChange={() => toggle(c.id)} />
                    <span>{c.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <form
        class="card stack-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          updateParty(party.id, (p) => ({
            ...p,
            checklist: [...p.checklist, { id: id(), bucket, text: text.trim(), done: false }],
          }));
          setText('');
        }}
      >
        <Field label="Add to the checklist">
          <Input value={text} onValue={setText} placeholder="Borrow folding chairs" />
        </Field>
        <Field label="When">
          <select
            class="input"
            value={bucket}
            onChange={(e) => setBucket(e.currentTarget.value as Bucket)}
          >
            {BUCKET_ORDER.map((b) => (
              <option key={b} value={b}>
                {BUCKET_LABELS[b]}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" class="btn" disabled={!text.trim()}>
          Add
        </button>
      </form>
    </>
  );
}

function StepSheet({
  party,
  item,
  onClose,
}: {
  party: Party;
  item: RunItem | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [time, setTime] = useState(addMinutes(party.start, item?.offsetMin ?? 0).slice(11));
  function save() {
    const offset = offsetFor(party, time);
    if (!title.trim() || offset === null) return;
    updateParty(party.id, (p) => ({
      ...p,
      runSheet: (item
        ? p.runSheet.map((r) =>
            r.id === item.id ? { ...r, title: title.trim(), offsetMin: offset } : r,
          )
        : [...p.runSheet, { id: id(), title: title.trim(), offsetMin: offset }]
      ).sort((a, b) => a.offsetMin - b.offsetMin),
    }));
    onClose();
  }
  return (
    <Sheet title={item ? 'Edit step' : 'Add a step'} onClose={onClose} doneLabel="Close">
      <form
        class="stack"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Time">
          <Input type="time" value={time} onValue={setTime} />
        </Field>
        <Field label="What happens">
          <Input value={title} onValue={setTitle} placeholder="Cake and toast" />
        </Field>
        <button type="submit" class="btn btn--block" disabled={!title.trim()}>
          Save
        </button>
        {item && (
          <button
            type="button"
            class="btn btn--danger btn--block"
            onClick={() => {
              const before = party;
              onClose();
              updateParty(party.id, (p) => ({
                ...p,
                runSheet: p.runSheet.filter((r) => r.id !== item.id),
              }));
              showToast(`Deleted "${item.title}"`, { label: 'Undo', run: () => putParty(before) });
            }}
          >
            Delete step
          </button>
        )}
      </form>
    </Sheet>
  );
}

type DayRow =
  | { kind: 'step'; at: number; item: RunItem }
  | { kind: 'arrival'; at: number; key: string; text: string };

function Day({ party }: PartyProps) {
  const [editing, setEditing] = useState<RunItem | null | 'new'>(null);
  const arrivals: DayRow[] = party.guests
    .filter(
      (g) =>
        (g.rsvp === 'yes' || g.rsvp === 'maybe') && (g.arrivalOverride || arrivalOffset(g) !== 0),
    )
    .map((g) => {
      const at = g.arrivalOverride
        ? minutesBetween(party.start, g.arrivalOverride)
        : arrivalOffset(g);
      const roles = g.roles.filter((r) => r !== 'regular').map((r) => ROLE_LABELS[r].toLowerCase());
      return {
        kind: 'arrival',
        at,
        key: g.id,
        text: `${g.name} arrives${roles.length ? ` (${roles.join(', ')})` : ''}`,
      };
    });
  const rows: DayRow[] = [
    ...party.runSheet.map((item) => ({ kind: 'step' as const, at: item.offsetMin, item })),
    ...arrivals,
  ].sort((a, b) => a.at - b.at || (a.kind === 'arrival' ? -1 : 1));
  let lastDay = '';
  return (
    <>
      <ul class="plain-list rows card">
        {rows.map((r) => {
          const at = addMinutes(party.start, r.at);
          const day = at.slice(0, 10);
          const showDay =
            day !== lastDay && party.end && party.end.slice(0, 10) !== party.start.slice(0, 10);
          lastDay = day;
          return (
            <li
              key={r.kind === 'step' ? r.item.id : r.key}
              class={`row row--time${r.kind === 'arrival' ? ' row--arrival' : ''}`}
            >
              {showDay && <span class="row__day">{formatDay(at)}</span>}
              <span class="row__time">{formatTime(at)}</span>
              {r.kind === 'step' ? (
                <>
                  <label class="check">
                    <input
                      type="checkbox"
                      checked={!!r.item.done}
                      onChange={() =>
                        updateParty(party.id, (p) => ({
                          ...p,
                          runSheet: p.runSheet.map((x) =>
                            x.id === r.item.id ? { ...x, done: !x.done } : x,
                          ),
                        }))
                      }
                    />
                    <span>{r.item.title}</span>
                  </label>
                  <button
                    type="button"
                    class="btn btn--ghost btn--small"
                    onClick={() => setEditing(r.item)}
                    aria-label={`Edit ${r.item.title}`}
                  >
                    Edit
                  </button>
                </>
              ) : (
                <span class="row__title muted">{r.text}</span>
              )}
            </li>
          );
        })}
      </ul>
      <button type="button" class="btn btn--block" onClick={() => setEditing('new')}>
        + Add a step
      </button>
      {editing && (
        <StepSheet
          party={party}
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

export function Timeline({ party }: PartyProps) {
  const [view, setView] = useState<'prep' | 'day'>('prep');
  return (
    <Screen
      title="Timeline"
      docTitle={`Timeline · ${party.name}`}
      kicker={<PartyKicker party={party} />}
    >
      <Segmented
        label="Show"
        options={[
          { value: 'prep', label: 'Prep checklist' },
          { value: 'day', label: 'On the day' },
        ]}
        value={view}
        onChange={setView}
      />
      {view === 'prep' ? <Prep party={party} /> : <Day party={party} />}
    </Screen>
  );
}
