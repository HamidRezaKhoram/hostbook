# Quantities Cheat Sheet

Rules of thumb for how much to buy. **These numbers are also the spec for the app's calculator** (see `docs/planning/product-spec.md` → Calculator). If you change a number here, change the calculator and its tests too.

Each rule is labelled with how solid it is:
- **[S]** = several independent sources agree (see `../research/research-notes.md`)
- **[H]** = a common planner heuristic or our own estimate. Reasonable, but not well sourced.

Inputs: `G` = expected guests (confirmed yes + 50% of maybe, see headcount below), `H` = hours of party, `hot` = above ~27 °C or outdoors in summer.

## Units: the Canadian way (app default)

Canada is officially metric, but grocery stores often show prices per lb, and recipes and party talk mix both. So the app:

| Thing | Shown as | Example |
|---|---|---|
| Weight (food, ice) | **kg / g first, lb in brackets** | "Ice: 25 kg (55 lb)" |
| Volume (drinks) | **L / mL** | "Water: 8 L", "341 mL beer" |
| Temperature | **°C** | "Hot day (27 °C+)" |
| Distance | **km** | "Cottage is 210 km away" |
| Time | 12-hour, en-CA style | "7:00 p.m." |
| Dates | en-CA long form | "Sat., Dec. 12" |
| Money (cost split) | **CAD $** | "$24.50" |

**Canadian standard drink** (Canada's Guidance on Alcohol and Health): 17.05 mL of pure alcohol, which is one **341 mL** beer at 5%, one **142 mL (5 oz)** glass of wine at 12%, or one **43 mL (1.5 oz)** shot at 40%.

Bags of store ice vary by brand (commonly about 2–5 kg). The bag size is a setting; check your local store.

---

## Headcount

| Rule | Value | Tag |
|---|---|---|
| Expected guests | `yes + 0.5 × maybe` (+ plus-ones as confirmed) | [H] |
| Friend-party no-show (of "yes") | 10–20% | [H] |
| Public/loose free RSVP no-show | ~28% median (37% for 10–49 people) | [S] |
| Food buffer on top | +10–15% | [S] |

The app cooks for **expected guests**, not invited guests.

## Drinks

| Rule | Value | Tag |
|---|---|---|
| Drinks per guest | 2 in first hour, then 1 per hour → `2 + (H − 1)` | [S] |
| Total drinks | `G × (2 + (H − 1))` | [S] |
| Share non-alcoholic | Plan ≥ 25% of drinks NA, more if many don't drink | [H] |
| Wine | 750 mL bottle ≈ 5 glasses (142 mL) | [S] |
| Liquor | 750 mL bottle ≈ 17 drinks (43 mL shots) | [S] |
| Beer / seltzer | 341 mL bottle or 355 mL can = 1 drink; 473 mL tall can ≈ 1.4 | [S] |
| Alcohol mix (if unsure) | ~45% wine, ~35% beer/cider/seltzer, ~20% spirits; adjust to your crowd | [H] |
| Water | ~0.5 L per guest per evening, double if hot | [H] |
| Coffee/tea at the end | ~1 cup for half the guests | [H] |

**Example:** 20 guests, 4 hours → 20 × 5 = 100 drinks → ~25 NA, ~75 alcoholic → e.g. 7 bottles of wine (35), a 24-case of beer (24), 1 bottle of liquor (17) = 76.

## Ice

| Rule | Value | Tag |
|---|---|---|
| Ice for drinks | 0.45–0.7 kg (1–1.5 lb) per guest | [S] |
| Hot / outdoors | Double it | [S] |
| Extra for chilling coolers/tubs | +0.45 kg (1 lb) per guest | [S] |

The app shows a bag count using the bag-size setting (default **4 kg**, [H]: change it to what your store sells), not just weight.

## Food

| Situation | Per person | Tag |
|---|---|---|
| Full meal, total food | 450–700 g (1–1.5 lb) | [S] |
| Main protein, dinner | 225–280 g (8–10 oz) as bought, less for boneless | [S] |
| Appetizers before a meal | 4–6 pieces (1–2 h) | [S] |
| Appetizers, no meal (2–3 h) | 6–8 pieces | [S] |
| Heavy appetizers replacing dinner | 12–15 pieces | [H] |
| Side dishes | ~110 g (4 oz) each, 2–3 sides | [H] |
| Bread / rolls | 1–2 per person | [H] |
| Dessert | 1 serving, +1 if it's the highlight | [H] |
| Buffet | add 10–15% to everything | [S] |

## Supplies

| Item | Per guest | Tag |
|---|---|---|
| Cups | 2 (people lose cups) | [H] |
| Plates | 1.5 per course served (a meal counts as 2: main + dessert) | [H] |
| Napkins | 3 | [H] |
| Cutlery sets | 1.5 (meals only) | [H] |
| Trash bags | 1 large per ~10 guests (at least 1), plus recycling | [H] |
| Seating (mingling party) | Seats for ~1/3 of guests | [H] |
| Seating (dinner) | Seat for everyone, obviously | — |
| Standing space | ~1 m² per person feels lively | [H] |

## Time

| Rule | Value | Tag |
|---|---|---|
| Setup helpers arrive | Start − 60 to 90 min | [H] |
| "Seed" friends arrive | Start − 15 to 30 min | [H] |
| Arrival spread of main guests | First 30–45 min | [H] |
| Dinner: arrive → eat buffer | 30–45 min | [H] |
| Stop serving alcohol | ≥ 1 h before end | [S] |
| Last call / wind-down | End − 30 min | [H] |
| Party music prepared | ~2× party length | [S] |
