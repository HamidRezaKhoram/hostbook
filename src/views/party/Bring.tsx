import { useState } from 'preact/hooks';
import { Screen } from '../../components/Screen';
import { CATEGORY_LABELS } from '../../domain/constants';
import { bringBoard, dietarySummary, isCovered } from '../../domain/derive';
import type { Party, Task } from '../../domain/types';
import { updateParty } from '../../store/parties';
import { PartyKicker, type PartyProps } from './common';
import { AddTaskSheet, STATUS_LABELS, TaskSheet } from './TaskSheet';

function TaskRow({ party, task, onOpen }: { party: Party; task: Task; onOpen: () => void }) {
  const names = task.assigneeIds
    .map((id) => party.guests.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .join(', ');
  const covered = isCovered(task);
  return (
    <li>
      <button type="button" class="row" onClick={onOpen}>
        <span class="row__main">
          <span class="row__title">
            {task.title}
            {task.quantity && <span class="muted"> · {task.quantity}</span>}
          </span>
          <span class={`row__sub${covered ? '' : ' warn'}`}>
            {covered
              ? names
              : task.status === 'declined'
                ? `${names} said no: tap to reassign`
                : 'Open: tap to assign'}
          </span>
        </span>
        {covered && <span class={`badge badge--${task.status}`}>{STATUS_LABELS[task.status]}</span>}
      </button>
    </li>
  );
}

export function Bring({ party }: PartyProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState<Task['kind'] | null>(null);
  const board = bringBoard(party);
  const open = board.reduce((n, g) => n + g.open.length, 0);
  const jobs = party.tasks.filter((t) => t.kind === 'do');
  const mine = party.tasks.filter((t) => t.kind === 'host');
  const diet = dietarySummary(party).line;
  const current = party.tasks.find((t) => t.id === editing);

  return (
    <Screen title="Bring" docTitle={`Bring · ${party.name}`} kicker={<PartyKicker party={party} />}>
      <p class={`banner ${open ? 'banner--warn' : 'banner--ok'}`}>
        {open ? `${open} still open` : 'Everything is covered'}
      </p>
      {diet && (
        <p class="card diet-line">
          <strong>Dietary:</strong> {diet}
        </p>
      )}
      <button type="button" class="btn btn--block" onClick={() => setAdding('bring')}>
        + Add
      </button>

      {board.map((g) => (
        <section key={g.category} class="stack-sm" aria-labelledby={`cat-${g.category}`}>
          <h2 id={`cat-${g.category}`} class="section-title">
            {CATEGORY_LABELS[g.category]}{' '}
            <span class="muted">
              {g.covered}/{g.tasks.length}
            </span>
          </h2>
          <ul class="plain-list rows card">
            {g.tasks.map((t) => (
              <TaskRow key={t.id} party={party} task={t} onOpen={() => setEditing(t.id)} />
            ))}
          </ul>
        </section>
      ))}

      {jobs.length > 0 && (
        <section class="stack-sm" aria-labelledby="jobs">
          <h2 id="jobs" class="section-title">
            Jobs
          </h2>
          <ul class="plain-list rows card">
            {jobs.map((t) => (
              <TaskRow key={t.id} party={party} task={t} onOpen={() => setEditing(t.id)} />
            ))}
          </ul>
        </section>
      )}

      {mine.length > 0 && (
        <section class="stack-sm" aria-labelledby="mine">
          <h2 id="mine" class="section-title">
            Your own to-dos
          </h2>
          <ul class="plain-list rows card">
            {mine.map((t) => (
              <li key={t.id} class="row row--check">
                <label class="check">
                  <input
                    type="checkbox"
                    checked={t.status === 'done'}
                    onChange={() =>
                      updateParty(party.id, (p) => ({
                        ...p,
                        tasks: p.tasks.map((x) =>
                          x.id === t.id
                            ? { ...x, status: x.status === 'done' ? 'open' : 'done' }
                            : x,
                        ),
                      }))
                    }
                  />
                  <span>{t.title}</span>
                </label>
                <button
                  type="button"
                  class="btn btn--ghost btn--small"
                  onClick={() => setEditing(t.id)}
                  aria-label={`Edit ${t.title}`}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {current && <TaskSheet party={party} task={current} onClose={() => setEditing(null)} />}
      {adding && (
        <AddTaskSheet
          party={party}
          kind={adding}
          onClose={(id) => {
            setAdding(null);
            if (id) setEditing(id);
          }}
        />
      )}
    </Screen>
  );
}
