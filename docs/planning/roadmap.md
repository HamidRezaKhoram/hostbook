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

## M2: Domain core (no UI) ✅ (2026-11-24)
- [x] `types.ts`, factories (incl. paste-a-list name parser), constants
- [x] `src/lib/format.ts`: en-CA dates/times, kg-first weights with lb, mL/L, CAD (ADR-011); `src/lib/time.ts` wall-clock arithmetic
- [x] Role → arrival/leave offsets, `arrivalTime`, `leaveTime`
- [x] `headcount`, `bringBoard` (gaps by category), `dietarySummary`, `allergiesWithoutSafeDish`
- [x] Calculator per `quantities.md` (worked examples are tests)
- [x] Templates for 8 party types + custom, from the guide's playbooks and checklists
- [x] Share projections `shareInfo`, `guestShare`, `boardSlots`, `buildPublish` + privacy tests (no private data in any share)
- [x] Offline link codec (`#/i/<payload>`, < 1,500 chars)
- [x] Migrations framework + v1 fixture test
- **Result:** 107 unit tests, 100% line coverage of `src/domain/` and `src/lib/` (CI fails below 90%).

## M3: MVP host app ✅ (2026-11-24)
- [x] Party list, create from template (one form, paste names), edit details, duplicate, delete with undo
- [x] Guests (paste-to-add, RSVP, plus-ones, roles, arrival override, dietary, private note, remove with undo)
- [x] Bring board with open count, dietary summary, jobs and host to-dos; task sheet (assign, status, when, note, "free of" allergens)
- [x] Timeline: prep checklist by stage ("Now" marked) and the day's run sheet with guest arrivals
- [x] Notes and after-party debrief (who came, what worked)
- [x] IndexedDB persistence, `storage.persist()`, backup file save/restore
- [x] Target phones: iPhone 13 (WebKit), Pixel 7 and Galaxy S22 (Chromium) profiles in every e2e run
- **Result:** user stories 1–3, 5, 6, 9, 10 pass as Playwright tests on all three phones, plus undo, backup/restore, screen-switch and accessibility checks.

## M4: Live sharing with Firebase (ADR-010) ✅ (2026-11-24, pending a real-phone check)
- [x] **Owner step:** Firebase project created (anonymous auth, RTDB us-central1); rules deployed
- [x] `SyncPort` interface + lazy-loaded Firebase adapter (anonymous auth, multi-path publish, race-safe claims)
- [x] `database.rules.json` + rules tests and adapter tests in the emulators (local + CI)
- [x] Guest link `#/g/{share}/{token}`: their time, part, place (Google/Apple Maps), door code, calendar file
- [x] Guest RSVP (+ plus-ones, note) and "I'll bring it" claims, merged into the host's party live
- [x] Open bring board `#/b/{share}`: anyone picks an item with their name; new people join the guest list
- [x] Share sheet: message presets (invite, 1 week, day before), Share…, copy, text message, WhatsApp
- [x] Offline fallback links `#/i/{payload}` when there's no connection
- [x] Auto-republish after host edits; stop sharing turns links off
- [x] Two-phone e2e on all three phones through the emulators (story 4, board, stop sharing, offline link)
- [ ] **Owner check:** send a real link over WhatsApp and SMS and RSVP from a second phone
- [ ] Later: guest "can we swap?" request for host-assigned items (today guests can text the host)

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
6. Paste the `firebaseConfig` into the chat (it's not secret). ✅ Done 2026-11-23.
Never paste the config into a tracked file: it goes in `.env.local` (git-ignored) and GitHub secrets.
7. In your own terminal, run `scripts/firebase-login.sh` once (interactive). Then `scripts/deploy-rules.sh` tests the rules and deploys them. Run it again whenever `database.rules.json` changes.
