# Roadmap

Each milestone ends with: `scripts/test-all.sh` green, deployed to GitHub Pages, tried on a real phone.

## M0: Planning ✅ (2026-11-23)
- [x] Research (`docs/research/research-notes.md`)
- [x] Hosting guide, checklists, quantities
- [x] Product spec, architecture, data model, UI guidelines
- [x] README and implementation guidelines

## M1: Skeleton ✅ (2026-11-23)
- [x] Vite + Preact + TS strict, ESLint + Prettier
- [x] Vitest + Playwright (iPhone 13 WebKit and Pixel 7 Chromium profiles, real taps)
- [x] `scripts/test-all.sh` (typecheck, lint, unit, build, e2e), all in a container (`scripts/ct.sh`)
- [x] GitHub Actions: CI on every push and PR; deploy to Pages from `main` only when green
- [x] Hash router, bottom tab bar, design tokens, light/dark
- [x] PWA manifest + service worker, installable, works offline (e2e-tested)
- [x] axe accessibility checks on every tab, light and dark

## M2: Domain core (no UI)
- [ ] `types.ts`, factories, constants
- [ ] `src/lib/format.ts`: en-CA dates/times, kg-first weights with lb, mL/L, CAD (ADR-011)
- [ ] Role → arrival offsets, `arrivalTime`
- [ ] `expectedHeadcount`, `gapsByCategory`, `dietarySummary` (Health Canada allergens)
- [ ] Calculator per `quantities.md` (Canadian standard drink, ice bag size setting)
- [ ] Templates (8 party types) from the guide and checklists
- [ ] Share projection: `guestView(party, guestId)` and `boardView(party)` + privacy tests
- [ ] URL-payload codec (offline fallback links)
- [ ] Migrations framework + fixture test
- **Done when:** ≥ 90% line coverage on `src/domain/`.

## M3: MVP host app
- [ ] Party list, create from template, edit, duplicate, delete
- [ ] Guests (paste-to-add, RSVP, roles, arrival, dietary)
- [ ] Bring board + tasks + assignment sheet
- [ ] Timeline (run sheet) and host checklist
- [ ] Notes
- [ ] IndexedDB persistence, `storage.persist()`, export/import JSON
- **Done when:** user stories 1–3, 5, 6, 9, 10 in `product-spec.md` pass as Playwright tests on both phone profiles.

## M4: Live sharing with Firebase (ADR-010)
- [ ] **Owner step:** create the Firebase project (see "Firebase setup" below)
- [ ] `SyncPort` interface + lazy-loaded Firebase adapter (anonymous auth)
- [ ] `database.rules.json` + rules tests in the Firebase emulator (CI)
- [ ] Publish guest projections; guest view `#/g/{partyId}/{token}` reads live
- [ ] Guest RSVP and "I'll bring it" / swap request, merged into the host's party
- [ ] Public potluck board `#/b/{partyId}`: claim open slots
- [ ] Share sheet / copy; SMS and WhatsApp share text
- [ ] Fallback URL-payload links when sync is off or offline
- [ ] `.ics` download; reminder composer (1 week, day before)
- **Done when:** story 4 passes against the emulator, and a real link sent over WhatsApp and SMS lets a real second phone RSVP and claim live.

## M5: Smarts and polish
- [ ] Calculator UI → "Add as tasks / shopping list"
- [ ] Nudge engine + UI
- [ ] Built-in Guide tab
- [ ] Day mode (now/next)
- [ ] Debrief + attended tracking + personal no-show rate
- [ ] Dish tracker

## M6: Cottage / multi-day
- [ ] Days and meals, meal teams
- [ ] Shared grocery list
- [ ] Carpools, rooms
- [ ] Cost split (CAD)
- [ ] Co-host editing (needs Google sign-in on top of anonymous auth)

## Decisions (owner, 2026-11-23)

| Question | Answer |
|---|---|
| Live guest RSVP and claiming via Firebase? | **Yes.** Moved up from "optional M7" to M4 (ADR-010) |
| Public GitHub repo? | **Yes**, needed for free Pages; repo holds code only, never party data |
| Units | **Canadian way**: metric first, lb in brackets for weights, °C, en-CA dates and times, CAD (ADR-011) |
| Name | "Hostbook" (unchanged; rename means updating `BASE` in `vite.config.ts`) |
| Languages | English (en-CA) for now |

## Firebase setup (owner, about 5 minutes, before M4)

1. Go to <https://console.firebase.google.com>, then **Add project** → name it `hostbook`. Google Analytics: **off**.
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable.**
3. **Build → Realtime Database → Create database** → location **us-central1** → start in **locked mode** (we deploy real rules).
4. **Project settings (⚙) → Your apps → Web (`</>`)** → nickname `hostbook-web`, no Firebase Hosting → copy the `firebaseConfig` object.
5. **Authentication → Settings → Authorized domains → Add** `hamidrezakhoram.github.io`.
6. Paste the `firebaseConfig` into the chat (it's not secret). For deploying rules from this machine, also run `! npx firebase-tools login` once.
