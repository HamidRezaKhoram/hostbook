import { ToastHost } from '../components/ToastHost';
import { UpdateToast } from '../components/UpdateToast';
import { parties, ready } from '../store/parties';
import { BoardPage } from '../views/guest/BoardPage';
import { GuestPage } from '../views/guest/GuestPage';
import { InvitePage } from '../views/guest/InvitePage';
import { Home } from '../views/Home';
import { NewParty } from '../views/NewParty';
import { PartyScreen } from '../views/party/PartyScreen';
import { route } from './route';

function Body() {
  const r = route.value;
  if (!ready.value) return <main class="app" aria-busy="true" />;
  if (r.name === 'new') return <NewParty />;
  if (r.name === 'guest') return <GuestPage shareId={r.shareId} token={r.token} />;
  if (r.name === 'board') return <BoardPage shareId={r.shareId} />;
  if (r.name === 'invite') return <InvitePage payload={r.payload} />;
  if (r.name === 'party') {
    const party = parties.value.find((p) => p.id === r.id);
    if (party) return <PartyScreen party={party} tab={r.tab} />;
    return (
      <main class="app">
        <section class="screen">
          <h1 class="screen__title">Party not found</h1>
          <p>
            This party isn't saved on this device. It may have been deleted, or made on another
            phone.
          </p>
          <a class="btn btn--block" href="#/">
            Your parties
          </a>
        </section>
      </main>
    );
  }
  return <Home />;
}

export function App() {
  return (
    <>
      <Body />
      <ToastHost />
      <UpdateToast />
    </>
  );
}
