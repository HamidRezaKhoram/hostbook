import { Chips, Field, Input, options, Segmented, TextArea } from '../../components/fields';
import { Sheet } from '../../components/Sheet';
import {
  ALLERGEN_LABELS,
  DIET_LABELS,
  RELIGIOUS_LABELS,
  ROLE_LABELS,
} from '../../domain/constants';
import { arrivalTime, leaveTime, tasksFor } from '../../domain/derive';
import type { Guest, Party, Role, Rsvp } from '../../domain/types';
import { formatTime } from '../../lib/format';
import { isLocalIso } from '../../lib/time';
import { updateParty } from '../../store/parties';
import { removeGuest, RSVP_LABELS } from './guest-actions';

const ROLE_OPTIONS = options(ROLE_LABELS).filter((o) => o.value !== 'regular');
const RSVP_OPTIONS = (['yes', 'maybe', 'invited', 'no'] as Rsvp[]).map((value) => ({
  value,
  label: RSVP_LABELS[value],
}));

export function GuestSheet({
  party,
  guest,
  onClose,
}: {
  party: Party;
  guest: Guest;
  onClose: () => void;
}) {
  const set = (recipe: (g: Guest) => Guest) =>
    updateParty(party.id, (p) => ({
      ...p,
      guests: p.guests.map((g) => (g.id === guest.id ? recipe(g) : g)),
    }));
  const text = (v: string) => (v.trim() ? v : undefined);
  const arrives = arrivalTime(party, guest);
  const leaves = leaveTime(party, guest);
  const custom = guest.arrivalOverride !== undefined || guest.arrivalOffsetMin !== undefined;
  const tasks = tasksFor(party, guest.id);

  return (
    <Sheet title={guest.name || 'Guest'} onClose={onClose}>
      <Field label="Name">
        <Input value={guest.name} onValue={(v) => set((g) => ({ ...g, name: v }))} />
      </Field>
      <Segmented
        label="Coming?"
        options={RSVP_OPTIONS}
        value={guest.rsvp}
        onChange={(v) => set((g) => ({ ...g, rsvp: v }))}
      />
      <Field label="Bringing extra people (plus-ones)">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={10}
          value={String(guest.plusOnes)}
          onValue={(v) =>
            set((g) => ({ ...g, plusOnes: Math.max(0, Math.min(10, Math.floor(Number(v) || 0))) }))
          }
        />
      </Field>
      <Chips
        label="Role"
        options={ROLE_OPTIONS}
        values={guest.roles.filter((r) => r !== 'regular')}
        onChange={(roles: Role[]) =>
          set((g) => ({ ...g, roles: roles.length ? roles : ['regular'] }))
        }
      />

      <div class="arrival card">
        <p>
          <strong>Arrives {formatTime(arrives)}</strong>
          {leaves && <> · stays until {formatTime(leaves)}</>}
        </p>
        <Field label="Change arrival time">
          <Input
            type="time"
            value={arrives.slice(11)}
            onValue={(v) => {
              const at = `${arrives.slice(0, 10)}T${v}`;
              if (isLocalIso(at))
                set((g) => ({ ...g, arrivalOverride: at, arrivalOffsetMin: undefined }));
            }}
          />
        </Field>
        {custom && (
          <button
            type="button"
            class="link link--button"
            onClick={() =>
              set((g) => ({ ...g, arrivalOverride: undefined, arrivalOffsetMin: undefined }))
            }
          >
            Use the time for their role
          </button>
        )}
      </div>

      <Field label="Phone" hint="Only on this device; used to send their link.">
        <Input
          type="tel"
          value={guest.phone ?? ''}
          onValue={(v) => set((g) => ({ ...g, phone: text(v) }))}
          autoComplete="off"
        />
      </Field>

      <h3 class="sheet__section">Food needs</h3>
      <Chips
        label="Allergies"
        options={options(ALLERGEN_LABELS)}
        values={guest.dietary.allergies}
        onChange={(v) => set((g) => ({ ...g, dietary: { ...g.dietary, allergies: v } }))}
      />
      <Chips
        label="Diet"
        options={options(DIET_LABELS)}
        values={guest.dietary.diets}
        onChange={(v) => set((g) => ({ ...g, dietary: { ...g.dietary, diets: v } }))}
      />
      <Chips
        label="Religious"
        options={options(RELIGIOUS_LABELS)}
        values={guest.dietary.religious}
        onChange={(v) => set((g) => ({ ...g, dietary: { ...g.dietary, religious: v } }))}
      />
      <Field label="Food note">
        <Input
          value={guest.dietary.note ?? ''}
          onValue={(v) => set((g) => ({ ...g, dietary: { ...g.dietary, note: text(v) } }))}
          placeholder="EpiPen in bag"
        />
      </Field>

      <Field label="Private note" hint="Only you see this.">
        <TextArea
          rows={2}
          value={guest.note ?? ''}
          onValue={(v) => set((g) => ({ ...g, note: text(v) }))}
        />
      </Field>

      {tasks.length > 0 && (
        <div>
          <h3 class="sheet__section">Their jobs</h3>
          <ul>
            {tasks.map((t) => (
              <li key={t.id}>{t.title}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        class="btn btn--danger btn--block"
        onClick={() => {
          onClose();
          removeGuest(party, guest);
        }}
      >
        Remove {guest.name || 'guest'}
      </button>
    </Sheet>
  );
}
