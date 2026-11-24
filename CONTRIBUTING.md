# Implementation Guidelines

Rules for anyone (human or AI) building Hostbook. Read the [Product Spec](docs/planning/product-spec.md), [Architecture](docs/planning/architecture.md), [Data Model](docs/planning/data-model.md) and [UI Guidelines](docs/planning/ui-guidelines.md) first.

## Golden rules

1. **Phone first.** Build and check every screen at 375 px wide before anything else.
2. **Test before and after every change.** Run `./scripts/test-all.sh` before you start (to know the baseline) and after (it must pass). Never commit red.
3. **UI fixes are proven with a failing test first.** Write a Playwright test on a phone profile that fails on the old code, then fix it, then watch it pass. Tests drive the real UI with taps, not by calling functions.
4. **Domain logic is pure** (`src/domain/`): no DOM, storage, Preact or network imports. All of it is unit-tested.
5. **Privacy by default.** Nothing leaves the device except a share link the host sends on purpose. No analytics, no CDNs, no third-party fonts.
6. **Offline always works.** Any feature except "send" must work in airplane mode.
7. **Schema changes need a migration** plus a fixture test of the previous version. Never break a host's saved party.
8. **Guide is the source of truth for numbers.** Calculator constants, role offsets and templates come from `docs/guide/`. Change the doc and the code together.
9. **Small, boring, readable.** Prefer plain functions and plain CSS. Add a dependency only if it saves real work and fits the bundle budget.

## Code conventions

- TypeScript `strict`, no `any` (use `unknown` and narrow).
- File names `kebab-case.ts`, components `PascalCase.tsx`.
- State: `@preact/signals`; one store module per root (`parties`), with views reading derived signals.
- CSS: tokens only (`var(--space-3)`, `var(--color-accent)`); component styles co-located or in `components.css`; no inline magic numbers.
- Dates: use one small helper module (`src/lib/dates.ts`) built on `Intl` and plain arithmetic; consider `date-fns` only if needed. Always respect `party.tz`.
- IDs via `src/lib/ids.ts`, never `Math.random()` for anything shareable.
- User-facing strings in one place per view (keeps future i18n possible).

## Testing

| Layer | Tool | What |
|---|---|---|
| Domain | Vitest + v8 coverage (≥ 90% lines enforced) | Calculator, headcount, arrival offsets, nudges, templates, share projections, link codec, migrations |
| Store | Vitest + `fake-indexeddb` | Save/load, migration on load, export/import round-trip |
| Firebase rules + sync | Vitest in the auth + database emulators (`npm run test:emulator`) | Every rule allows what it should and denies what it shouldn't; the real adapter works across host/guest "devices" |
| UI / flows | Playwright, `iPhone 13` + `Pixel 7` device profiles, touch enabled | User stories in the spec, one test each |
| Offline | Playwright `context.setOffline(true)` | Create/edit after going offline, reload |
| Visual sanity | Playwright screenshots at 360 / 375 / 430 widths | Catch overflow, clipped buttons |
| a11y | `@axe-core/playwright` | No serious violations on each main screen |

**Must-have tests:**
- Share payload contains **no other guest's data and no private notes** (data-model.md lists the assertions).
- The calculator matches the worked examples in `docs/guide/quantities.md`.
- Moving the party start shifts every guest's arrival time.
- Loading a v(N−1) fixture migrates cleanly.

`scripts/test-all.sh` runs, inside the Playwright container: `tsc --noEmit` → `eslint` + `prettier --check` → `vitest run` → `vite build` → `playwright test` (against `vite preview` with the production base path, so the service worker and `/hostbook/` base are exercised). CI (`.github/workflows/ci.yml`) runs the same steps in the same image. Keep `@playwright/test`, the `playwright-core` override in `package.json`, `scripts/ct.sh` and the CI image on **one** Playwright version.

Playwright's WebKit can't run service workers, so offline tests run on the Pixel (Chromium) profile only.

## Definition of done (per feature)

- [ ] Matches the spec (or the spec was updated in the same change)
- [ ] Unit tests for new domain logic; Playwright test for the user-visible flow on both phone profiles
- [ ] Works offline
- [ ] Works in light and dark, at 360 px, and at 200% text zoom
- [ ] Tap targets ≥ 48 px, inputs ≥ 16 px font
- [ ] No new console errors; bundle budget respected (JS ≤ 60 KB gz initial)
- [ ] `./scripts/test-all.sh` green
- [ ] Docs updated (README feature list, roadmap checkbox)

## Git & deploy

- `main` is always deployable; GitHub Actions deploys it to Pages.
- Small commits, imperative messages ("Add bring board gap highlighting").
- Work on branches for anything bigger than a small fix; CI must pass before merge.
- **Never commit secrets or keys**, including the Firebase config: it lives in `.env.local` (git-ignored, template `.env.example`) and in GitHub repository secrets (`VITE_FIREBASE_*`) for CI. Before every commit, check `git diff --cached` for keys.
- Even with the config out of git, security comes from `database.rules.json`, which must have emulator tests for every rule before it is deployed.
- Changing `database.rules.json`: add or adjust tests in `tests/emulator/rules.test.ts`, prove a loosened rule fails them, then deploy with `scripts/deploy-rules.sh` (tests first, then deploy). CI does not deploy rules.

## Adding a party template

1. Add the playbook to `docs/guide/hosting-guide.md` §15 (and checklists if needed).
2. Add `src/domain/templates/<type>.ts` exporting tasks, run sheet and checklist (offsets relative to start).
3. Add a unit test that the template produces a valid party and a Playwright test that it can be created.

## Adding a nudge

1. Add a row to the nudge table in `product-spec.md`.
2. Implement it as a pure `(party, now) => Nudge | null` in `src/domain/nudges.ts`, with a guide section reference.
3. Unit test both the firing and the non-firing case.
