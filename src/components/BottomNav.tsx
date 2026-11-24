import type { FunctionComponent } from 'preact';
import { hrefFor, type Tab } from '../app/router';
import { BasketIcon, ClockIcon, GuestsIcon, HomeIcon, MoreIcon } from './icons';

const ITEMS: { tab: Tab; label: string; Icon: FunctionComponent }[] = [
  { tab: 'overview', label: 'Overview', Icon: HomeIcon },
  { tab: 'guests', label: 'Guests', Icon: GuestsIcon },
  { tab: 'bring', label: 'Bring', Icon: BasketIcon },
  { tab: 'timeline', label: 'Timeline', Icon: ClockIcon },
  { tab: 'more', label: 'More', Icon: MoreIcon },
];

export function BottomNav({ current }: { current: Tab }) {
  return (
    <nav class="bottom-nav" aria-label="Main">
      {ITEMS.map(({ tab, label, Icon }) => (
        <a
          key={tab}
          href={hrefFor(tab)}
          class="bottom-nav__item"
          aria-current={tab === current ? 'page' : undefined}
        >
          <Icon />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
