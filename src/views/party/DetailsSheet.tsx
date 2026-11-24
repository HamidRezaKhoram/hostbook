import { Field, Input, Segmented, TextArea } from '../../components/fields';
import { Sheet } from '../../components/Sheet';
import type { FoodStyle, Party, YesNoAsk } from '../../domain/types';
import { addMinutes, isLocalIso, minutesBetween } from '../../lib/time';
import { updateParty } from '../../store/parties';

const FOOD: { value: FoodStyle; label: string }[] = [
  { value: 'full-meal', label: 'Meal' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'potluck', label: 'Potluck' },
  { value: 'eat-first', label: 'Eat first' },
];
const YNA: { value: YesNoAsk; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'ask', label: 'Ask me' },
];

export function DetailsSheet({ party, onClose }: { party: Party; onClose: () => void }) {
  const set = (recipe: (p: Party) => Party) => updateParty(party.id, recipe);
  const text = (v: string) => (v.trim() ? v : undefined);

  /** Moving the start moves the end too, keeping the party length. */
  function setStart(next: string) {
    if (!isLocalIso(next)) return;
    set((p) => ({
      ...p,
      start: next,
      end: p.end ? addMinutes(next, minutesBetween(p.start, p.end)) : p.end,
    }));
  }
  function setEnd(next: string) {
    if (isLocalIso(next) && next > party.start) set((p) => ({ ...p, end: next }));
  }
  const endDate = party.end?.slice(0, 10) ?? party.start.slice(0, 10);
  const endTime = party.end?.slice(11) ?? '';

  return (
    <Sheet title="Party details" onClose={onClose}>
      <Field label="Name">
        <Input value={party.name} onValue={(v) => set((p) => ({ ...p, name: v }))} />
      </Field>
      <Field label="Why are we gathering?" hint="One sentence. It guides every other choice.">
        <TextArea
          rows={2}
          value={party.purpose ?? ''}
          onValue={(v) => set((p) => ({ ...p, purpose: text(v) }))}
        />
      </Field>
      <div class="row-2">
        <Field label="Date">
          <Input
            type="date"
            value={party.start.slice(0, 10)}
            onValue={(v) => setStart(`${v}T${party.start.slice(11)}`)}
          />
        </Field>
        <Field label="Starts">
          <Input
            type="time"
            value={party.start.slice(11)}
            onValue={(v) => setStart(`${party.start.slice(0, 10)}T${v}`)}
          />
        </Field>
      </div>
      <div class="row-2">
        <Field label="Ends (date)">
          <Input
            type="date"
            value={endDate}
            onValue={(v) => setEnd(`${v}T${endTime || party.start.slice(11)}`)}
          />
        </Field>
        <Field label="Ends">
          <Input type="time" value={endTime} onValue={(v) => setEnd(`${endDate}T${v}`)} />
        </Field>
      </div>

      <h3 class="sheet__section">Place</h3>
      <Field label="Address">
        <Input
          value={party.location.address ?? ''}
          onValue={(v) => set((p) => ({ ...p, location: { ...p.location, address: text(v) } }))}
        />
      </Field>
      <Field label="Map link">
        <Input
          type="url"
          value={party.location.mapsUrl ?? ''}
          onValue={(v) => set((p) => ({ ...p, location: { ...p.location, mapsUrl: text(v) } }))}
        />
      </Field>
      <Field label="Parking">
        <Input
          value={party.location.parking ?? ''}
          onValue={(v) => set((p) => ({ ...p, location: { ...p.location, parking: text(v) } }))}
        />
      </Field>
      <Field
        label="Door code, buzzer, which door"
        hint="Only invited guests see this, never the open bring board."
      >
        <Input
          value={party.location.access ?? ''}
          onValue={(v) => set((p) => ({ ...p, location: { ...p.location, access: text(v) } }))}
        />
      </Field>

      <h3 class="sheet__section">For guests</h3>
      <Segmented
        label="Food"
        options={FOOD}
        value={party.details.food}
        onChange={(v) => set((p) => ({ ...p, details: { ...p.details, food: v } }))}
      />
      <Segmented
        label="Alcohol"
        options={[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ]}
        value={party.details.alcohol === false ? 'no' : 'yes'}
        onChange={(v) => set((p) => ({ ...p, details: { ...p.details, alcohol: v === 'yes' } }))}
      />
      <Segmented
        label="Plus-ones"
        options={YNA}
        value={party.details.plusOnes}
        onChange={(v) => set((p) => ({ ...p, details: { ...p.details, plusOnes: v } }))}
      />
      <Segmented
        label="Kids"
        options={YNA}
        value={party.details.kids}
        onChange={(v) => set((p) => ({ ...p, details: { ...p.details, kids: v } }))}
      />
      <Field label="Dress or vibe">
        <Input
          value={party.details.dress ?? ''}
          onValue={(v) => set((p) => ({ ...p, details: { ...p.details, dress: text(v) } }))}
          placeholder="Jeans are fine; bring a warm layer"
        />
      </Field>
      <Field label="Note for every guest">
        <TextArea
          rows={2}
          value={party.details.guestNote ?? ''}
          onValue={(v) => set((p) => ({ ...p, details: { ...p.details, guestNote: text(v) } }))}
        />
      </Field>

      <h3 class="sheet__section">You</h3>
      <Field label="Your name">
        <Input
          value={party.host.name}
          onValue={(v) => set((p) => ({ ...p, host: { ...p.host, name: v } }))}
        />
      </Field>
      <Field label="Your phone" hint="Guests use it to text you back.">
        <Input
          type="tel"
          value={party.host.phone ?? ''}
          onValue={(v) => set((p) => ({ ...p, host: { ...p.host, phone: text(v) } }))}
        />
      </Field>
    </Sheet>
  );
}
