import { useState } from 'preact/hooks';
import { go } from '../app/route';
import { partyHref } from '../app/router';
import { Field, Input, TextArea } from '../components/fields';
import { Screen } from '../components/Screen';
import { PARTY_TYPE_LABELS } from '../domain/constants';
import { newGuest, newParty, parseNameList } from '../domain/factories';
import { TEMPLATES } from '../domain/templates';
import type { PartyType } from '../domain/types';
import { deviceTimeZone } from '../lib/download';
import { addMinutes, isLocalIso } from '../lib/time';
import { putParty } from '../store/parties';
import { getPrefs, setPrefs } from '../store/prefs';

const TYPE_HINTS: Record<PartyType, string> = {
  dinner: '4–10 people, seated',
  potluck: 'Everyone brings a dish',
  cocktail: 'Short, mixing, name tags',
  bbq: 'Grill, sides, lawn games',
  'game-night': 'Games and snacks',
  'movie-night': 'Film, popcorn, blankets',
  'open-house': 'Drop in any time',
  holiday: 'Treats, toast, mingling',
  cottage: 'A weekend away, meal teams',
  custom: 'Start from scratch',
};

/** The next Saturday (or today if it's Saturday), as YYYY-MM-DD. */
function nextSaturday(today = new Date()): string {
  const d = new Date(today);
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function NewParty() {
  const [type, setType] = useState<PartyType | undefined>();
  const [name, setName] = useState('');
  const [date, setDate] = useState(nextSaturday);
  const [time, setTime] = useState('19:00');
  const [address, setAddress] = useState('');
  const [names, setNames] = useState('');
  const [hostName, setHostName] = useState(getPrefs().hostName ?? '');
  const [error, setError] = useState('');

  const people = parseNameList(names);
  const start = `${date}T${time}`;

  function create(e: Event) {
    e.preventDefault();
    if (!type) return setError('Pick what kind of party it is.');
    if (!name.trim()) return setError('Give the party a name.');
    if (!isLocalIso(start)) return setError('Pick a date and a start time.');
    const party = newParty({
      type,
      name,
      start: type === 'cottage' && time === '19:00' ? `${date}T18:00` : start,
      tz: deviceTimeZone(),
      hostName: hostName.trim() || 'Host',
    });
    party.location.address = address.trim() || undefined;
    party.guests = people.map((n) => newGuest(n));
    putParty(party);
    if (hostName.trim()) setPrefs({ hostName: hostName.trim() });
    go(partyHref(party.id), true);
  }

  const t = type && TEMPLATES[type];
  return (
    <main class="app">
      <Screen title="New party" kicker={<a href="#/">‹ Your parties</a>}>
        <form class="stack" onSubmit={create} noValidate>
          <fieldset class="field">
            <legend class="field__label">What kind of party?</legend>
            <div class="type-grid">
              {(Object.keys(PARTY_TYPE_LABELS) as PartyType[]).map((k) => (
                <label key={k} class="type-card">
                  <input
                    type="radio"
                    name="type"
                    value={k}
                    checked={type === k}
                    onChange={() => {
                      setType(k);
                      setError('');
                    }}
                  />
                  <span class="type-card__name">{PARTY_TYPE_LABELS[k]}</span>
                  <span class="type-card__hint">{TYPE_HINTS[k]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Name">
            <Input value={name} onValue={setName} placeholder="Dumpling Night" autoComplete="off" />
          </Field>
          <div class="row-2">
            <Field label="Date">
              <Input type="date" value={date} onValue={setDate} />
            </Field>
            <Field label="Starts">
              <Input type="time" value={time} onValue={setTime} />
            </Field>
          </div>
          {t && isLocalIso(start) && (
            <p class="hint">
              Ends around {addMinutes(start, t.durationMin).slice(11)} (
              {Math.round(t.durationMin / 60)} h). You can change it later.
            </p>
          )}
          <Field label="Where (optional)">
            <Input
              value={address}
              onValue={setAddress}
              placeholder="12 Birch Rd"
              autoComplete="street-address"
            />
          </Field>
          <Field
            label="Who's invited? (optional)"
            hint={
              people.length
                ? `${people.length} ${people.length === 1 ? 'person' : 'people'}`
                : 'Paste names, one per line'
            }
          >
            <TextArea value={names} onValue={setNames} rows={4} placeholder={'Maya\nLeo\nSam'} />
          </Field>
          <Field label="Your name">
            <Input value={hostName} onValue={setHostName} autoComplete="given-name" />
          </Field>
          {error && (
            <p class="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" class="btn btn--block">
            Create party
          </button>
        </form>
      </Screen>
    </main>
  );
}
