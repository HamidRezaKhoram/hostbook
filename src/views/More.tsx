import { Screen } from '../components/Screen';

const SOON = ['Notes', 'Hosting guide', 'How much to buy', 'Backup and restore', 'Settings'];

export function More() {
  const built = new Date(__BUILD_TIME__).toLocaleString('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return (
    <Screen title="More">
      <ul class="list card">
        {SOON.map((label) => (
          <li key={label} class="list__item">
            <span>{label}</span>
            <span class="chip">Soon</span>
          </li>
        ))}
      </ul>
      <div class="card">
        <h2 class="card__title">Install on your phone</h2>
        <p>
          iPhone: Share → <strong>Add to Home Screen</strong>. Android: menu ⋮ →{' '}
          <strong>Install app</strong>. It then works offline and keeps your data safer.
        </p>
      </div>
      <p class="fine">Built {built}</p>
    </Screen>
  );
}
