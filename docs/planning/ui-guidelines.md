# UI & UX Guidelines

Hostbook is used **standing in a kitchen, one hand on a phone, the other holding a bag of ice.** Design for that.

## Layout

- **Target phones:** iPhone (Safari), Pixel 7 and newer (Chrome), Samsung Galaxy S22 and newer (Samsung Internet / Chrome). Design at **360 px** (Galaxy S22, the narrowest), check at 390 (iPhone) and 412 (Pixel), then let it center on desktop at a max width of ~560 px.
- Screen changes always start at the top, reset *before* the new screen renders (`src/app/route.ts`).
- **Bottom tab bar** (thumb zone), 5 tabs max:
  `Overview · Guests · Bring · Timeline · More` (More = Notes, Guide, Calculator, Backup, Settings).
- **Primary action button** bottom-right, above the tab bar ("+ Guest", "+ Item"...), context-dependent.
- Edit in **bottom sheets**, not new pages, so the host keeps their place.
- Respect safe areas: `padding-bottom: env(safe-area-inset-bottom)`.
- One scroll per screen; no nested scrolling areas.

## Touch & input

- Tap targets **≥ 48 × 48 px**, ≥ 8 px apart.
- Inputs at **≥ 16 px font**, or iOS zooms the page on focus.
- Use the right keyboards: `type="tel"`, `inputmode="numeric"`, `type="time"`, `type="date"`, `autocomplete="off"` for names.
- **Swipe is a shortcut, never the only way.** Every swipe action is also in a menu.
- Destructive actions use **undo toasts** (5 s) instead of "Are you sure?" dialogs, except deleting a whole party.
- Paste-to-add: a textarea that turns each line into a guest; strip numbering and bullets.

## Visual

- Warm, friendly, calm. It's a party, but the host is busy. Think: cream paper, one warm accent color, plenty of space.
- Design tokens in `src/styles/tokens.css` (colors, spacing scale 4/8/12/16/24/32, radius, type scale). No magic numbers in components.
- Light and dark themes from the start (tokens make this free); follow `prefers-color-scheme`.
- Contrast WCAG AA minimum (4.5:1 text, 3:1 large text and icons).
- Status colors are **never the only signal**: pair them with an icon or word (`open`, `asked ✉`, `confirmed ✓`, `done ✓✓`).
- System font stack; no web fonts (speed + offline).
- Inline SVG icons; no icon font.

## Key screens (wireframes)

**Overview**
```
┌───────────────────────────────┐
│ Dumpling Night        ⋯       │
│ Sat Dec 12 · 7–10 pm · 12 Birch│
│ "Mix the climbing & work crew" │
├───────────────────────────────┤
│ 14 yes · 3 maybe · 2 no → ~16 │
│ Bring: 9/12 covered  ⚠ 3 open │
│ Prep: 6/18 done   Next: 1 week│
├───────────────────────────────┤
│ ⚠ Nobody's bringing ice   Fix │
│ ℹ No one arrives early    Why?│
├───────────────────────────────┤
│ Run sheet preview: 5:45 setup…│
└─[Overview][Guests][Bring][Time][More]┘
```

**Guests**
```
│ Search…            [Paste list]│
│ ● Maya   helper 5:45  ✓ yes  🥜│
│ ● Leo    7:00   ice   ✉ asked │
│ ○ Sam    7:00         ? maybe │
│                     [+ Guest] │
```

**Bring board**
```
│ Diet: 3 veg · 1 nut allergy   │
│ ▾ Drinks (2/3)                │
│   Wine ×4 — Jo ✓              │
│   NA spritz — open  [Assign]  │
│ ▾ Ice (0/1) ⚠                 │
│   Ice 50 lb — open  [Assign]  │
```

**Guest view (from link)**
```
│ Hi Leo! 👋                     │
│ Dumpling Night                │
│ Sat Dec 12                    │
│ You: arrive 7:00 pm           │
│ Bring: 10 lb ice              │
│ 12 Birch Rd [Map]             │
│ Park on the street · Code 4412│
│ [👍 I'm in] [🤔 Swap?] [Can't]│
│ [Add to calendar]             │
```

## Microcopy

- Friendly, short, second person: "Who's bringing ice?" not "Ice: unassigned".
- Nudges explain *why* in one line and link to the guide section.
- Default share messages are editable and human: *"Hey Leo! Dumpling Night is Sat 7pm. Could you bring 10 lb of ice? Details: <link>"*.
- No guilt, no exclamation-point overload.

## Accessibility

- Semantic HTML first (`button`, `label`, `nav`, `main`, lists).
- Every input has a visible label.
- Focus is visible; bottom sheets trap focus and close on Esc/back.
- Supports 200% text zoom without breaking layout.
- `prefers-reduced-motion` turns off animations.
- Screen-reader text for status icons.

## Performance

- Time to interactive < 2 s on a mid-range Android over 4G.
- No layout shift on load; skeletons only if something takes > 300 ms.
- Lazy-load Guide and Calculator.
