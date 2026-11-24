import { EmptyState, Screen } from '../components/Screen';

const GUIDE_URL =
  'https://github.com/HamidRezaKhoram/hostbook/blob/main/docs/guide/hosting-guide.md';

export function Overview() {
  return (
    <Screen title="Overview">
      <p class="lede">Your pocket planner for gatherings people remember.</p>
      <EmptyState title="No party yet">
        <p>
          Soon you'll start a party from a template: dinner, potluck, BBQ, game night, cottage
          weekend and more.
        </p>
      </EmptyState>
      <div class="card">
        <h2 class="card__title">Before your next party</h2>
        <p>Write one sentence: why are we gathering? It makes every other decision easier.</p>
        <a class="link" href={GUIDE_URL} target="_blank" rel="noopener">
          Read the hosting guide
        </a>
      </div>
    </Screen>
  );
}
