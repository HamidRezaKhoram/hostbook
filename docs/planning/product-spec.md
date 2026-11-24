# Product Spec

## Vision

**Hostbook is the host's pocket cockpit for a gathering.** One page, phone-first. In a few taps you know who's coming, who brings what, who arrives when, what you still have to do, and what to buy. Then you send each guest a link with exactly their part.

It also carries the [Hosting Guide](../guide/hosting-guide.md), so good hosting habits are built into the flow rather than buried in a doc.

## Principles

1. **Host-first.** The host is the main user. Guests get a simple, read-mostly view.
2. **Phone-first, one-handed.** Designed at 375 px wide, works up to desktop.
3. **No accounts, no ads, no tracking.** The host's full data stays on their device. Only what guests are meant to see is shared, through Firebase (ADR-010).
4. **Works offline.** At a cottage with one bar of signal it still works (PWA).
5. **Fast entry.** Paste a list of names. Use templates. Never make the host type the same thing twice.
6. **Teach gently.** Suggestions from the guide appear in context ("Nobody's assigned ice yet").
7. **Free to run.** Static hosting on GitHub Pages; any backend must fit a free tier.
8. **Canadian by default.** Metric with lb in brackets, °C, en-CA dates, CAD, Health Canada allergens (ADR-011).

## Users

| Persona | Needs |
|---|---|
| **Host** (primary) | Plan, assign, track, remind, run the day, remember for next time |
| **Co-host** | Same view as the host, helps run it (phase 2: shared editing) |
| **Guest** | "When do I arrive, where, what do I bring, what's my job?" plus a way to say yes/no/swap |

## Core concepts

- **Party**: one gathering (or a multi-day trip). Has a name, purpose, type, date/time window, location, notes.
- **Guest**: a person invited, with RSVP, their own arrival time, role, dietary needs, notes.
- **Task**: anything someone must do or bring. Kinds: `bring` (item), `do` (job), `host` (host's own prep to-do). Has an assignee, quantity, a "when", and a status.
- **Run sheet**: a timeline of the day (time → what happens → who).
- **Notes**: free-form host notes plus a structured post-party debrief.
- **Template**: a preset of tasks, run sheet and checklist for a party type.

## Features by phase

Priorities: **P0** = MVP must-have, **P1** = soon after, **P2** = later.

### Phase 1 — MVP (local-only, static)

| # | Feature | Pri | Notes |
|---|---|---|---|
| 1 | Create / edit / duplicate / delete a party | P0 | Duplicate = "same party next year" |
| 2 | Party details: name, purpose sentence, type, start, **end**, address + map link, parking, door code, dress/vibe, food expectation, plus-ones and kids policy | P0 | Purpose prompt: "Why are we gathering?" |
| 3 | Guest list with **paste-to-add** (one name per line) | P0 | Optional phone for share links |
| 4 | RSVP status per guest: invited / yes / maybe / no / came | P0 | Host sets it manually in phase 1 |
| 5 | Per-guest **arrival time** and **role** (helper, seed, regular, cleanup, driver) | P0 | Defaults from party start; role presets apply offsets (§7 of the guide) |
| 6 | Dietary per guest: allergies (8 majors + sesame + mustard + other), diet, religious, notes | P0 | Three separate fields |
| 7 | Tasks: bring / do / host-prep; assign to 0–n guests; quantity; when (before / on arrival / during / after or a time); status open → asked → confirmed → done | P0 | |
| 8 | **Bring board**: tasks by category with gaps highlighted (unassigned) | P0 | Categories from the guide: mains, sides, salads, desserts, drinks, ice, bread, supplies, equipment |
| 9 | Run sheet / timeline for the day | P0 | Prefilled from template and the party start |
| 10 | Notes (free text, markdown-lite) | P0 | |
| 11 | **Per-guest share link** with that guest's time, job(s), what to bring, and the party logistics | P0 | Data encoded in URL fragment (see architecture) |
| 12 | Guest page: "Reply" buttons open SMS/WhatsApp to the host with a prefilled message ("Yes, I'll bring the ice") | P0 | No backend needed |
| 13 | **Share via the native share sheet** (Web Share API), fall back to copy | P0 | |
| 14 | Templates: dinner, potluck, cocktail (2-hour), BBQ, game night, open house, holiday, **cottage weekend** | P0 | From `docs/guide/checklists.md` and the guide playbooks |
| 15 | Host prep checklist with timeline buckets (3–6 wk, 2–3 wk, 1 wk, 1–2 d, day of, 5 min, during, close, after) | P0 | |
| 16 | **Quantities calculator** (drinks, ice, food, supplies) from expected headcount and hours | P0 | Spec: `docs/guide/quantities.md`; can turn results into tasks or a shopping list |
| 17 | Dietary summary: "3 vegetarian, 1 nut allergy (Sam), 1 gluten-free" | P0 | Shown on the Bring board and the menu |
| 18 | Built-in **Guide** tab (rendered from `docs/guide/*.md`) | P0 | Offline, searchable later |
| 19 | Export / import a party as JSON; full backup | P0 | Single device = backup matters |
| 20 | PWA: installable, offline | P0 | |
| 21 | Reminder message composer: "1 week" and "day before" drafts per guest or for all, copy/share | P1 | Uses each guest's tasks and time |
| 22 | Shopping list (from host tasks + calculator) with checkboxes | P1 | |
| 23 | "Smart nudges" from guide rules (no ice assigned, no NA drink, guest with allergy and no safe dish, no end time, no cleanup help) | P1 | Rule engine, see below |
| 24 | Debrief after the party: what worked / change / who clicked; marks who actually came | P1 | Builds the host's own no-show history |
| 25 | Dish tracker: whose dish/container is left behind | P1 | |
| 26 | Dark mode | P1 | |
| 27 | Party "day mode": big-text run sheet with "now / next" | P1 | |
| 28 | `.ics` calendar file in the guest link | P1 | Client-generated download |

### Phase 2 — Live sharing (Firebase, approved; roadmap M4)

| # | Feature | Pri |
|---|---|---|
| 30 | Guests RSVP and **claim open bring-slots themselves** from their link | P1 |
| 31 | Host sees updates live; no manual typing of replies | P1 |
| 32 | Co-host editing | P2 |
| 33 | Public "bring board" link for a potluck (anyone with link can claim) | P1 |
| 34 | Optional guest questions (dietary, ride needed) answered via the link | P1 |

### Phase 3 — Cottage / multi-day and extras

| # | Feature | Pri |
|---|---|---|
| 40 | Multi-day parties: days → meals; assign meal teams (shop, cook, clean) | P1 (can start in phase 1 as tasks) |
| 41 | Carpools: drivers, seats, riders, departure times | P2 |
| 42 | Rooms and beds | P2 |
| 43 | Shared costs / split (who paid what, who owes) | P2 |
| 44 | Guest packing list | P2 |
| 45 | Contact Picker API on Android to add guests | P2 |
| 46 | Photos and memories link | P2 |
| 47 | Translations (i18n) | P2 |

## Key user stories (MVP acceptance)

1. **Create in under 2 minutes.** As a host, I pick "Potluck", enter name, date, time, and address, paste 15 names, and get a party with a prefilled bring board, run sheet and checklist.
2. **Assign.** I tap an open "Ice (10 lb)" slot, pick Leo, and it's marked *asked*. When Leo texts back I mark it *confirmed*.
3. **Arrival times.** I mark Maya and Jo as *helpers*; their arrival time becomes start − 75 min automatically, and I can override it.
4. **Share.** I tap Leo → "Send Leo's link". The share sheet opens with a short message and the link. Leo opens it on his phone, sees *"Arrive 7:00 · Bring 10 lb ice · 12 Birch Rd · park on the street · door code 4412"*, and taps "👍 I'm in" to text me back.
5. **Gaps.** The Bring board shows "2 open: dessert, cups" in red at the top.
6. **Dietary.** I see "Sam: tree-nut allergy" next to the dessert slot.
7. **Calculator.** 18 expected guests, 4 h, hot → it says 90 drinks (≥ 23 NA) and 54–72 lb of ice in total (36–54 lb for drinks plus 18 lb for chilling), so 6–8 bags of 10 lb. I tap "Add as tasks."
8. **Day of.** I open day mode and see "Now: setup crew arrives · Next 6:45: seed friends."
9. **After.** I mark who came, write my debrief, and duplicate the party for next year.
10. **Offline.** On airplane mode, everything above (except sending) still works.

## Smart nudges (rule engine, P1)

Each rule is `(party) → Nudge | null`, pure and unit-tested. A nudge has a severity, text, a link to a guide section, and an optional quick-fix action.

| Rule | Severity | Guide § |
|---|---|---|
| No end time set | info | 4 |
| No purpose sentence | info | 1 |
| Drinks or ice not covered (no task, or unassigned) | warn | 8 |
| No non-alcoholic drink task | warn | 8, 13 |
| Guest with allergy and no dish marked safe for it | warn | 8 |
| No one arrives before start (no seed or helper) | info | 7 |
| No cleanup help and > 10 guests | info | 6 |
| Party within 7 days and tasks still in *asked* | warn | 5 |
| Expected guests > capacity (if set) | warn | 9 |
| Alcohol served and no rides plan note | info | 13 |
| Bring tasks > 60% of food (host not providing an anchor) | info | 6 |

## Non-goals (for now)

- Public event ticketing or payments
- Social feed, comments, likes
- Accounts and passwords
- Fancy invitation card designer (Partiful does this well; we link out or keep it simple)
- Native iOS/Android apps (the PWA is enough)
