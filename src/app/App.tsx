import type { FunctionComponent } from 'preact';
import { BottomNav } from '../components/BottomNav';
import { UpdateToast } from '../components/UpdateToast';
import { Bring } from '../views/Bring';
import { Guests } from '../views/Guests';
import { More } from '../views/More';
import { Overview } from '../views/Overview';
import { Timeline } from '../views/Timeline';
import { route } from './route';
import type { Tab } from './router';

const VIEWS: Record<Tab, FunctionComponent> = {
  overview: Overview,
  guests: Guests,
  bring: Bring,
  timeline: Timeline,
  more: More,
};

export function App() {
  const { tab } = route.value;
  const View = VIEWS[tab];
  return (
    <>
      <main class="app">
        <View />
      </main>
      <UpdateToast />
      <BottomNav current={tab} />
    </>
  );
}
