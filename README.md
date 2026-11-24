# 🏡 Hostbook

**A phone-first, one-page app that helps you host better gatherings.** Track who's coming, who brings what, who arrives when, what's left to do, and how much to buy. Then send each guest a link with just their part.

It also includes a hosting guide built from research on what makes gatherings work.

> **Status:** M4 done: plan parties and send each guest a live link at **https://hamidrezakhoram.github.io/hostbook/** (iPhone, Pixel 7+, Galaxy S22+; installable, works offline). Next: the calculator screen and the built-in guide (M5); see the [Roadmap](docs/planning/roadmap.md).

---

## What it does (MVP)

- **Parties from templates**: dinner, potluck, 2-hour cocktail, BBQ, game night, movie night, open house, holiday, cottage weekend
- **Guests**: paste a list of names; RSVP; roles (helper, early "seed", cleanup, driver); **per-person arrival times**; dietary needs
- **Bring board**: who brings what, by category, with gaps highlighted ("nobody's bringing ice")
- **Tasks and run sheet**: host prep checklist from 6 weeks out to the thank-you; a timeline for the day
- **Calculator**: drinks, ice, food and supplies for your headcount and party length
- **Per-guest share links**: "Arrive 7:00 p.m. · bring 5 kg of ice · door code 4412". Guests RSVP and pick items live (Firebase); send by Share, text message or WhatsApp; offline links when there's no signal
- **Open bring board**: one link for a potluck where anyone picks what to bring
- **Directions**: Google Maps and Apple Maps buttons wherever there's an address; calendar file for guests
- **Canadian by default**: kg first (lb in brackets), °C, en-CA dates, CAD, Health Canada allergens
- **Notes and debrief**: so the next party is better
- **The Guide**, built in and available offline
- **Private and offline**: no accounts, no ads, no tracking; your full data stays on your phone; installable PWA

See the full [Product Spec](docs/planning/product-spec.md).

## Documentation map

| Doc | What's inside |
|---|---|
| 📖 [Hosting Guide](docs/guide/hosting-guide.md) | The guidebook: purpose, guests, invites, bring-lists, arrival times, food, space, opening, ending, safety, playbooks per party type |
| ✅ [Checklists](docs/guide/checklists.md) | Timeline checklists, 6 weeks out → after (also the app's templates) |
| 🧮 [Quantities](docs/guide/quantities.md) | How much food, drink, ice and supplies (also the calculator spec) |
| 🔬 [Research Notes](docs/research/research-notes.md) | Findings with sources and confidence, competitor scan, tech research |
| 🧭 [Product Spec](docs/planning/product-spec.md) | Vision, principles, features by phase, user stories, nudge rules |
| 🏗️ [Architecture](docs/planning/architecture.md) | ADRs: stack, storage, routing, sharing, PWA, privacy, folder layout |
| 🗂️ [Data Model](docs/planning/data-model.md) | Types, share-link payload, derived values |
| 📱 [UI Guidelines](docs/planning/ui-guidelines.md) | Mobile layout, touch, visuals, wireframes, accessibility, performance |
| 🗺️ [Roadmap](docs/planning/roadmap.md) | Milestones M1–M7 and open questions |
| 🛠️ [Implementation Guidelines](CONTRIBUTING.md) | How to build it: rules, testing, definition of done |

## Tech at a glance

| | |
|---|---|
| Hosting | GitHub Pages (static), deployed by GitHub Actions |
| App | Vite + Preact + TypeScript (strict), plain CSS with design tokens |
| Routing | Hash routes (`#/…`) |
| Storage | IndexedDB on the device; JSON export/import |
| Offline | PWA via `vite-plugin-pwa` |
| Sharing | Firebase Realtime DB (free plan, anonymous auth) for live RSVP and claiming; URL-fragment links as offline fallback |
| Tests | Vitest (domain), Playwright with real taps on iPhone 13 (WebKit), Pixel 7 and Galaxy S22 (Chromium), axe a11y |
| Tooling | Everything runs in the Playwright container: the host needs only podman or docker |

## Getting started

No Node or Java needed on your machine: the scripts run everything in a dev container (Playwright + Java for the Firebase emulators), built automatically from `scripts/Containerfile` with podman or docker.

```bash
scripts/dev.sh        # dev server: http://localhost:5173/hostbook/ (open it on your phone via your LAN IP too)
scripts/test-all.sh   # typecheck + lint + unit + build + e2e; must pass before and after every change
scripts/ct.sh npm run build   # run any command in the container
scripts/deploy-rules.sh       # test + deploy Firebase database rules (after a one-time scripts/firebase-login.sh)
python3 tools/make-icons.py   # redraw the app icons
```

## Deploying

Every push to `main` runs `.github/workflows/ci.yml`: all checks, then deploy to GitHub Pages **only if everything passes**. Pull requests run the checks without deploying.

On your phone: open the URL → Share → **Add to Home Screen** (iPhone) or ⋮ → **Install app** (Android). This also protects your data from storage eviction.

## Privacy

Your guest list, phone numbers, dietary notes and private notes **never leave your device**. When you share, only what guests are meant to see (party logistics, each guest's own time and tasks, the open bring-list) is published to Firebase, and guests' replies come back the same way. A guest's link never shows other guests' contacts, dietary info, or your notes.

## License

TBD (MIT suggested for the code; the guide could be CC BY 4.0).
