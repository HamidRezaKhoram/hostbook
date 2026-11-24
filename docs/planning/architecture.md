# Architecture & Decisions

Decisions are written as short ADRs (Architecture Decision Records). Change a decision by adding a new ADR that supersedes the old one; don't silently edit history.

## Overview

```
 ┌─────────────── GitHub Pages (static) ───────────────┐
 │  index.html + hashed JS/CSS + manifest + service worker │
 └───────────────────────────────────────────────────────┘
            │ loads once, then works offline
            ▼
 ┌──────────── Host's phone (PWA) ────────────┐        share link (#fragment)
 │  UI (Preact)                                │ ───────────────────────────▶  Guest's phone
 │  domain/ (pure TS: models, rules, calc)     │      SMS / WhatsApp / share     opens same app,
 │  store/ (IndexedDB, versioned schema)       │ ◀───────────────────────────   guest view (read-only)
 └─────────────────────────────────────────────┘    reply = prefilled text msg
            │ publishes guest-visible projection only (ADR-010)
            ▼
   Firebase Realtime DB (free Spark plan) ─ live RSVP and claims ◀── guests' phones
```

## ADR-001: Static SPA on GitHub Pages
- **Decision:** Ship a static single-page app, built by GitHub Actions and deployed to GitHub Pages.
- **Why:** Free, no servers to run, HTTPS included (needed for PWA, Web Share, clipboard), matches the user's existing setup (Cabin Fever is on Pages).
- **Consequence:** No server code. Anything shared between devices needs either the URL or a third-party backend (ADR-005).

## ADR-002: Stack: Vite + Preact + TypeScript, plain CSS
- **Decision:** Vite build, Preact (with `@preact/signals` for state), TypeScript `strict`, hand-written CSS with custom properties. No CSS framework, no UI kit.
- **Why:** Preact is ~4 KB, React-like and familiar, fast on low-end phones. TypeScript catches data-model mistakes in a schema-heavy app. Plain CSS keeps the bundle tiny and the look custom.
- **Alternatives:** Vanilla JS (no build) is simpler at first but gets messy with many views. Svelte is also good, but less familiar. React is heavier for no gain here.
- **Budget:** initial JS ≤ 60 KB gzip, total first load ≤ 150 KB gzip (guide markdown is lazy-loaded).

## ADR-003: Hash routing
- **Decision:** Routes live in the hash: `#/`, `#/p/<partyId>/guests`, `#/g/<payload>`.
- **Why:** GitHub Pages can't rewrite unknown paths to `index.html`. Fragments never reach the server, so routing always works and **guest payloads in the URL are never logged by the server.**

## ADR-004: Local-first storage in IndexedDB
- **Decision:** All host data lives in IndexedDB (via the tiny `idb-keyval` or `idb` wrapper), one record per party, with `schemaVersion` and migration functions. `localStorage` is only for UI prefs.
- **Why:** Works offline, nothing leaves the device, survives reloads. IndexedDB is more durable and roomy than localStorage.
- **Risks:** iOS Safari can evict storage for sites not added to the home screen after ~7 days unused. **Mitigations:** prompt to "Add to Home Screen", call `navigator.storage.persist()`, and nudge to export a backup when a party has data and no recent backup.
- **Rule:** every persisted shape change needs a migration plus a test that loads a fixture of the old version.

## ADR-005: Sharing in phase 1 = per-guest URL payload; phase 2 = optional Firebase
- **Phase 1 decision:** A guest link carries a **compressed JSON snapshot** of only what that guest needs, in the fragment:
  `https://<user>.github.io/hostbook/#/g/<lz-string compressToEncodedURIComponent(json)>`
  - Contents: party name, time window, location fields, dress/food notes, the guest's own name, arrival time, role, their tasks, and the host's display name and contact for replies.
  - **Never included:** other guests' names, contacts, dietary data, host notes.
  - Size target: under ~1,500 characters so it survives SMS and WhatsApp. Use short keys in the payload schema (`v`, `n`, `t`...), versioned with `v`.
  - Guest replies: buttons open `sms:` / `https://wa.me/` with a prefilled message. The host updates status by hand. This is clunky but needs zero infrastructure, and it is honest about what a static app can do.
  - The link is a snapshot; if the host changes things, they resend. The guest page shows "Updated <date>".
- **Phase 2 decision (proposed, not final):** an optional sync adapter backed by **Firebase Realtime Database** (Spark free plan) with anonymous auth.
  - Why Firebase over Supabase: Supabase's free projects **pause after 7 days idle**, which breaks a party planned weeks ahead. Firebase Spark needs no card and is generous for this size.
  - Access model: each party gets an unguessable ID (128-bit random). Security rules allow guests to write **only** their own RSVP field and to claim open slots (`assignee` from null → their guestId). The host owns the rest via a host secret.
  - The app must still work fully with sync **off**. Sync is an adapter behind a `SyncPort` interface; the domain never imports Firebase.
- **Status:** superseded by ADR-010 (the owner approved Firebase on 2026-11-23). The URL-payload link stays as the **offline fallback** for when sync is off or Firebase is unreachable.

## ADR-006: PWA via vite-plugin-pwa
- **Decision:** `vite-plugin-pwa` in `generateSW` mode with `registerType: 'prompt'`. The whole app shell (HTML, hashed JS/CSS, icons) is precached as one versioned set, and navigations fall back to the cached `index.html`.
- **Why precache instead of network-first HTML:** it keeps HTML and assets from the same build together, so a half-updated app can't happen, and it opens instantly on bad cottage signal.
- **Base path:** `base: '/hostbook/'` in Vite config; manifest `start_url` and `scope` are `/hostbook/`. The plugin injects the `<link rel="manifest">`; don't add one by hand (the e2e test catches duplicates).
- **Updates:** a new version downloads in the background and waits. A "New version, Refresh" toast lets the host choose when, so nothing swaps mid-party.
- **Tested:** e2e loads once, goes offline, reloads and navigates (Chromium; Playwright's WebKit has no service workers).

## ADR-007: Pure domain layer
- **Decision:** `src/domain/` holds types, factories, the calculator, nudge rules, templates, the share-payload codec and migrations. It's pure TypeScript with **no DOM, no storage, no Preact**.
- **Why:** This is where bugs would hurt (wrong ice amount, leaked allergy data in a link). Pure functions are trivial to unit-test.

## ADR-008: Guide content lives in `docs/guide/` and is bundled
- **Decision:** The app imports the markdown from `docs/guide/` at build time (Vite `?raw`) and renders with a small markdown renderer (e.g. `marked` or `micromark`), lazy-loaded.
- **Why:** One source of truth: edit the guide once, and GitHub and the app both update.

## ADR-009: Privacy
- No analytics, no third-party fonts or CDNs (self-host everything; this is also needed for offline).
- Contact numbers and dietary info stay local unless sync is turned on.
- The share-link builder has a unit test asserting no other guest's data appears in the payload.

## ADR-010: Firebase for live sharing (accepted 2026-11-23)
- **Decision:** Guest links and potluck boards are backed by **Firebase Realtime Database** (Spark free plan) with **Anonymous Auth**. Guests can RSVP and claim open items live, and the host sees it instantly.
- **What goes to Firebase:** only what guests are meant to see, plus their replies:
  ```
  /shares/{partyId}/owner                      host's anonymous uid           set on creation, never changes
  /shares/{partyId}/info                       name, time, place, food, note  read: anyone with the party id
  /shares/{partyId}/board/{slotId}/slot        title, qty, category           read: anyone · write: owner
  /shares/{partyId}/board/{slotId}/claim       uid, name, at                  claim if open, release own · owner: any
  /shares/{partyId}/guests/{token}             time, roles, tasks, door code,  read: token holder · write: owner
                                               host phone
  /shares/{partyId}/replies/{token}            rsvp, plusOnes, note, at       read: token holder, owner · write: token holder
  ```
  The owner can read and delete the whole share. Nobody else can list `guests` or `replies`, so a token can't be discovered. The door code and host phone live in each guest record, not in `info`, so the public potluck board never shows them.
  The host's full party (contacts, dietary data, private notes) **stays on the host's device** in IndexedDB. The host app publishes a filtered projection to `/shares` and merges `/replies` back in.
- **IDs:** `partyId` and guest `token` are 128-bit random base64url strings. A link is `…/hostbook/#/g/{partyId}/{token}` (or `#/b/{partyId}` for the public potluck board).
- **Rules** (`database.rules.json`): only the owner writes `info`, `board/*/slot` and `guests`. A token holder writes only `replies/{token}`, and only for tokens the host issued. Anyone signed in can claim an open slot in their own uid, so a two-guest race has exactly one winner. Every value guests write is type- and length-checked, and unknown keys are rejected. `tests/emulator/rules.test.ts` covers each rule; `tests/emulator/firebase-sync.test.ts` runs the real adapter with host and guest "devices". Both run in CI.
- **Known limit:** ownership is the host's *anonymous* uid on one device. Clearing site data or switching phones loses edit rights to existing shares (the local party is safe in the backup; it can be republished under a new id). Fix planned with co-host support in M6: link the anonymous account to Google sign-in.
- **Isolation:** all Firebase code lives in `src/sync/firebase.ts` behind the `SyncPort` interface (`src/sync/port.ts`) and is lazy-loaded (modular SDK, only `app`, `auth`, `database`). Domain code never imports Firebase. With sync off, the app falls back to URL-payload links (ADR-005).
- **Config:** never in the repo. `src/sync/firebase-config.ts` reads `VITE_FIREBASE_*` from `.env.local` (git-ignored; template in `.env.example`) locally and from GitHub repository secrets in CI. Note: any Firebase web app ships these values inside its built JavaScript to every visitor. Keeping them out of git avoids publishing them in the source, and the real protection is the database rules plus restricting the API key to the site's domain in Google Cloud. The adapter publishes with multi-path `update()`s, never `set()` on the share, so republishing keeps guests' replies and claims. Security comes from the rules, plus App Check (reCAPTCHA Enterprise) once traffic warrants it.
- **Region:** RTDB has no Canadian region, so use `us-central1` (the closest). Privacy note in the app: guest-visible party info is stored by Google in the US.
- **Free-tier fit:** about 100 simultaneous connections and 1 GB stored is plenty for personal parties. Verify on firebase.google.com/pricing before launch.

## ADR-011: Canadian locale by default (accepted 2026-11-23)
- `en-CA` formatting via `Intl`: 12-hour "7:00 p.m.", "Sat., Dec. 12", CAD currency.
- Metric first with lb in brackets for weights (see `docs/guide/quantities.md` → Units). °C, km, mL/L.
- Canadian standard drink (17.05 mL alcohol), Health Canada priority allergens, provincial drinking ages in the guide.
- All formatting goes through `src/lib/format.ts` so another locale can be added later.

## Proposed folder structure

```
hostbook/
├── index.html
├── public/                # icons, manifest assets
├── src/
│   ├── main.tsx
│   ├── app/               # shell, router, layout, bottom nav
│   ├── views/             # Overview, Guests, Bring, Timeline, Notes, Guide, GuestView
│   ├── components/        # Button, Sheet, ListItem, Chip, TimePicker...
│   ├── domain/            # types.ts, factories.ts, calc.ts, nudges.ts, templates/, share.ts, migrations.ts
│   ├── store/             # db.ts (IndexedDB), parties.ts (signals), backup.ts
│   ├── sync/              # port.ts (SyncPort), firebase.ts, firebase-config.ts, rules tests
│   ├── styles/            # tokens.css, base.css, components.css
│   └── lib/               # dates, ids, format, share (Web Share API), markdown
├── tests/
│   ├── unit/              # vitest: domain/*
│   └── e2e/               # playwright: mobile device profiles
├── docs/                  # guide, research, planning (this folder)
└── .github/workflows/     # ci.yml (test), deploy.yml (Pages)
```
