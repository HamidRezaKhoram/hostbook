import { EmptyState, Screen } from '../components/Screen';

export function Guests() {
  return (
    <Screen title="Guests">
      <EmptyState title="Who's coming?">
        <p>Paste a list of names, track replies, and give each person their own arrival time.</p>
      </EmptyState>
    </Screen>
  );
}
