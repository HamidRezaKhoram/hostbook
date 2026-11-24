import type { Tab } from '../../app/router';
import { BottomNav } from '../../components/BottomNav';
import type { Party } from '../../domain/types';
import { Bring } from './Bring';
import { Guests } from './Guests';
import { More } from './More';
import { Overview } from './Overview';
import { Timeline } from './Timeline';

export function PartyScreen({ party, tab }: { party: Party; tab: Tab }) {
  const View = { overview: Overview, guests: Guests, bring: Bring, timeline: Timeline, more: More }[
    tab
  ];
  return (
    <>
      <main class="app app--tabs">
        <View party={party} />
      </main>
      <BottomNav partyId={party.id} current={tab} />
    </>
  );
}
