// Loads the real database rules into the emulator namespace the test build uses, so the phone
// tests exercise sharing exactly as production would.
import { readFileSync } from 'node:fs';

export default async function globalSetup() {
  const url = 'http://127.0.0.1:9000/.settings/rules.json?ns=demo-hostbook-default-rtdb';
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: 'Bearer owner' },
      body: readFileSync('database.rules.json', 'utf8'),
    });
  } catch {
    throw new Error(
      'Firebase emulators are not running. Use `npm run test:e2e` (or scripts/test-all.sh).',
    );
  }
  if (!res.ok) throw new Error(`Couldn't load database rules into the emulator: ${res.status}`);
}
