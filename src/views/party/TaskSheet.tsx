import { useState } from 'preact/hooks';
import { showToast } from '../../app/toast';
import { Chips, Field, Input, options, Segmented, TextArea } from '../../components/fields';
import { Sheet } from '../../components/Sheet';
import { ALLERGEN_LABELS, CATEGORY_LABELS, CATEGORY_ORDER } from '../../domain/constants';
import { activeGuests } from '../../domain/derive';
import { newTask } from '../../domain/factories';
import type { Party, Task, TaskCategory, TaskKind, TaskStatus } from '../../domain/types';
import { putParty, updateParty } from '../../store/parties';

const FOOD: TaskCategory[] = ['main', 'side', 'salad', 'dessert', 'bread', 'snacks'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  asked: 'Asked',
  confirmed: 'Confirmed',
  done: 'Done',
  declined: 'Said no',
};

const KIND_OPTIONS: { value: TaskKind; label: string }[] = [
  { value: 'bring', label: 'Someone brings' },
  { value: 'do', label: 'A job' },
  { value: 'host', label: 'My to-do' },
];

const WHEN_OPTIONS = [
  { value: 'none', label: 'Any time' },
  { value: 'before', label: 'Before' },
  { value: 'arrival', label: 'On arrival' },
  { value: 'during', label: 'During' },
  { value: 'after', label: 'After' },
] as const;
type WhenValue = (typeof WHEN_OPTIONS)[number]['value'];

function CategorySelect({
  value,
  onChange,
}: {
  value: TaskCategory;
  onChange: (c: TaskCategory) => void;
}) {
  return (
    <Field label="Category">
      <select
        class="input"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value as TaskCategory)}
      >
        {CATEGORY_ORDER.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function TaskSheet({
  party,
  task,
  onClose,
}: {
  party: Party;
  task: Task;
  onClose: () => void;
}) {
  const set = (recipe: (t: Task) => Task) =>
    updateParty(party.id, (p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === task.id ? recipe(t) : t)),
    }));
  const text = (v: string) => (v.trim() ? v : undefined);
  const guests = activeGuests(party);
  const when: WhenValue = typeof task.when === 'string' ? task.when : 'none';

  function assign(ids: string[]) {
    set((t) => {
      let status = t.status;
      if (!ids.length) status = 'open';
      else if (t.status === 'open' || t.status === 'declined') status = 'asked';
      return { ...t, assigneeIds: ids, status };
    });
  }

  const statusOptions = (
    task.kind === 'host' ? ['open', 'done'] : (Object.keys(STATUS_LABELS) as TaskStatus[])
  ).map((value) => ({ value: value as TaskStatus, label: STATUS_LABELS[value as TaskStatus] }));

  return (
    <Sheet title={task.title || 'Item'} onClose={onClose}>
      <Field label="What">
        <Input value={task.title} onValue={(v) => set((t) => ({ ...t, title: v }))} />
      </Field>
      <Field label="How much" hint='For example "for 12", "5 kg", "2 bottles".'>
        <Input
          value={task.quantity ?? ''}
          onValue={(v) => set((t) => ({ ...t, quantity: text(v) }))}
        />
      </Field>
      {task.kind !== 'host' &&
        (guests.length ? (
          <Chips
            label={task.kind === 'bring' ? 'Who brings it?' : 'Who does it?'}
            options={guests.map((g) => ({ value: g.id, label: g.name }))}
            values={task.assigneeIds.filter((id) => guests.some((g) => g.id === id))}
            onChange={assign}
          />
        ) : (
          <p class="hint">Add guests to assign this.</p>
        ))}
      {(task.kind === 'host' || task.assigneeIds.length > 0) && (
        <Segmented
          label="Status"
          options={statusOptions}
          value={task.status}
          onChange={(v) => set((t) => ({ ...t, status: v }))}
        />
      )}
      <Segmented
        label="When"
        options={[...WHEN_OPTIONS]}
        value={when}
        onChange={(v) => set((t) => ({ ...t, when: v === 'none' ? undefined : v }))}
      />
      <CategorySelect value={task.category} onChange={(c) => set((t) => ({ ...t, category: c }))} />
      {task.kind !== 'host' && (
        <Field label="Note for them">
          <TextArea
            rows={2}
            value={task.note ?? ''}
            onValue={(v) => set((t) => ({ ...t, note: text(v) }))}
          />
        </Field>
      )}
      {FOOD.includes(task.category) && (
        <Chips
          label="This dish is free of"
          options={options(ALLERGEN_LABELS).filter((o) => o.value !== 'other')}
          values={task.safeFor?.allergenFree ?? []}
          onChange={(v) => set((t) => ({ ...t, safeFor: { ...t.safeFor, allergenFree: v } }))}
        />
      )}
      <button
        type="button"
        class="btn btn--danger btn--block"
        onClick={() => {
          const before = party;
          onClose();
          updateParty(party.id, (p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== task.id) }));
          showToast(`Deleted "${task.title}"`, { label: 'Undo', run: () => putParty(before) });
        }}
      >
        Delete
      </button>
    </Sheet>
  );
}

export function AddTaskSheet({
  party,
  kind: initialKind,
  onClose,
}: {
  party: Party;
  kind: TaskKind;
  onClose: (createdId?: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<TaskKind>(initialKind);
  const [category, setCategory] = useState<TaskCategory>(
    initialKind === 'bring' ? 'snacks' : 'other',
  );
  return (
    <Sheet title="Add" onClose={() => onClose()} doneLabel="Close">
      <form
        class="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const task = newTask(title, kind, category);
          updateParty(party.id, (p) => ({ ...p, tasks: [...p.tasks, task] }));
          onClose(task.id);
        }}
      >
        <Field label="What">
          <Input value={title} onValue={setTitle} placeholder="Chips and salsa" />
        </Field>
        <Segmented label="Kind" options={KIND_OPTIONS} value={kind} onChange={setKind} />
        <CategorySelect value={category} onChange={setCategory} />
        <button type="submit" class="btn btn--block" disabled={!title.trim()}>
          Add
        </button>
      </form>
    </Sheet>
  );
}
