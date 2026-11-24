import { partyHref } from '../app/router';
import { restoreBackup } from '../app/backup-actions';
import { EmptyState, Screen } from '../components/Screen';
import { PARTY_TYPE_LABELS } from '../domain/constants';
import { bringBoard, headcount } from '../domain/derive';
import type { Party } from '../domain/types';
import { formatWhen } from '../lib/format';
import { nowLocal } from '../lib/time';
import { parties } from '../store/parties';

const GUIDE_URL =
  'https://github.com/HamidRezaKhoram/hostbook/blob/main/docs/guide/hosting-guide.md';

function sortParties(list: Party[]): { upcoming: Party[]; past: Party[] } {
  const upcoming: Party[] = [];
  const past: Party[] = [];
  for (const p of list) {
    if ((p.end ?? p.start) >= nowLocal(p.tz)) upcoming.push(p);
    else past.push(p);
  }
  upcoming.sort((a, b) => a.start.localeCompare(b.start));
  past.sort((a, b) => b.start.localeCompare(a.start));
  return { upcoming, past };
}

function PartyCard({ party }: { party: Party }) {
  const h = headcount(party);
  const open = bringBoard(party).reduce((n, g) => n + g.open.length, 0);
  return (
    <li>
      <a class="card party-card" href={partyHref(party.id)}>
        <span class="party-card__type">{PARTY_TYPE_LABELS[party.type]}</span>
        <span class="party-card__name">{party.name}</span>
        <span class="party-card__when">{formatWhen(party.start, party.end)}</span>
        <span class="party-card__stats">
          {h.yes} coming{h.maybe ? ` · ${h.maybe} maybe` : ''}
          {open ? ` · ${open} to bring still open` : ''}
        </span>
      </a>
    </li>
  );
}

export function RestoreButton() {
  return (
    <label class="btn btn--ghost">
      Restore a backup
      <input
        type="file"
        accept="application/json,.json"
        class="visually-hidden"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (file) void restoreBackup(file);
          e.currentTarget.value = '';
        }}
      />
    </label>
  );
}

export function Home() {
  const { upcoming, past } = sortParties(parties.value);
  const none = !upcoming.length && !past.length;
  return (
    <main class="app">
      <Screen title="Your parties" docTitle="Hostbook" kicker={<span class="brand">Hostbook</span>}>
        <a class="btn btn--block" href="#/new">
          + New party
        </a>
        {none && (
          <EmptyState title="No parties yet">
            <p>
              Start one from a template: dinner, potluck, BBQ, game night, cottage weekend and more.
            </p>
            <RestoreButton />
          </EmptyState>
        )}
        {upcoming.length > 0 && (
          <section class="stack" aria-labelledby="upcoming">
            <h2 id="upcoming" class="section-title">
              Coming up
            </h2>
            <ul class="plain-list stack">
              {upcoming.map((p) => (
                <PartyCard key={p.id} party={p} />
              ))}
            </ul>
          </section>
        )}
        {past.length > 0 && (
          <section class="stack" aria-labelledby="past">
            <h2 id="past" class="section-title">
              Past
            </h2>
            <ul class="plain-list stack">
              {past.map((p) => (
                <PartyCard key={p.id} party={p} />
              ))}
            </ul>
          </section>
        )}
        <div class="card">
          <h2 class="card__title">Before your next party</h2>
          <p>Write one sentence: why are we gathering? It makes every other decision easier.</p>
          <a class="link" href={GUIDE_URL} target="_blank" rel="noopener">
            Read the hosting guide
          </a>
        </div>
      </Screen>
    </main>
  );
}
