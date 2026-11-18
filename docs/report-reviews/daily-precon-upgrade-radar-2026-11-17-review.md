# Review: Daily Precon Upgrade Radar — 2026-11-17

## Review status

This is a source-artifact review, not a live re-verification of every external claim in the pasted report. External prices, announcements, decklists, EDHREC percentages, and gameplay statistics remain pending until independently refreshed with exact URLs and timestamps.

## Executive verdict

The report is structurally useful and has a good separation between decision, change log, watchlist, deck clinics, budget candidates, and returning-card ledger. It is not, however, a Day 1 baseline for this tracker.

The report states that no prior reports, EDHREC snapshots, prediction records, or ownership records were accessible. Local tracker records contradict that statement:

- `client/src/data/marketPredictionLedger.json`: 158 prediction records.
- Latest stored prediction audit: 45 evaluated records, 113 unresolved records, and 148 records with post-entry prices.
- Latest stored directional accuracy: 31.11% across evaluated records.
- Latest stored up-call precision: 35.48%.
- Latest stored rise recall: 55.00%.
- Latest stored range containment: 11.11%.
- `client/src/data/journalArticles.json`: 26 Journal records.
- Daily price snapshots exist through the stored market-history window.
- Star Trek-specific market and price-watch artifacts are already present.

Therefore, the report should be classified as an external-source baseline or continuation with an incomplete continuity handoff, not as the tracker’s first baseline.

## What the report did well

1. It labeled the Hot-25 list as a working watchlist rather than pretending it was an official ranked list.
2. It separated announced, leaked, and released material.
3. It used a useful anchor / bridge / upgrade structure for deck clinics.
4. It included stock-list cuts, tradeoffs, prices, shipping caveats, and failure cases.
5. It avoided forcing speculative upcoming-product purchases into the buy-now section.
6. It included a returning-card ledger rather than pretending a first observation was a trend.
7. It preserved a default no-spend posture.

## What must be corrected before tracker promotion

### Continuity

Replace “Day 1 baseline” with:

> External-report baseline for the November 17 run; tracker history exists but was not successfully joined during report generation.

The next run must read the tracker’s prediction ledger, daily snapshots, Journal articles, Star Trek watch, and local ownership/reservation state before choosing new cards.

### Historical scoring

The current audit has a low evaluated directional hit rate and a large unresolved set. New reports should not use generic confidence language without linking to prior outcomes. Every repeated card needs a status of strengthened, weakened, invalidated, unresolved, or baseline-only.

### Exact printing

Several rows use a card name and set code but do not consistently provide collector number, treatment, finish, language, condition, and source URL. These rows should remain actionable only as provisional candidates until exact-printing identity is complete.

### Deck-fit versus market evidence

Early inclusion percentages, deck-guide recommendations, and precon win rates are useful deck-fit evidence, but they do not establish price appreciation, sales volume, liquidity, or resale demand. Keep these fields independent in the ledger.

### Tracker mapping

The current Star Trek control center has a six-card execution desk. The pasted report names a broader set of cards. New rows should not enter the control center until they have a deck route, functional slot, exact printing, floor-status input, and an owned / reserved / missing calculation.

## Signal disposition

| Signal class | Current disposition | Reason |
|---|---|---|
| Newly released Star Trek upgrade candidates | Research Watch / provisional action | Requires exact-printing refresh and post-release comparison against stored Star Trek observations. |
| Very cheap artifact and combat upgrades | Buy-for-play only when the named deck is confirmed owned or actively built | Function may be strong, but a low price alone is not a reason to buy. |
| Upcoming Merfolk or sea-monster speculation | Hold / watch | Decklists and exact reprint exposure must be confirmed before recommending purchases. |
| Early EDHREC inclusion percentages | Developing deck-fit evidence | Useful for adoption context; not a market confirmation. |
| Playgroup win-rate data | Deck diagnosis only | Can identify stock-list bottlenecks; does not establish singles demand. |
| Showcase or treatment premiums | Skip unless collector intent is explicit | Cosmetic premium is separate from gameplay utility. |

## Revised action queue policy

1. Join the report’s named cards to exact printings and current tracker history.
2. Remove any card already owned in sufficient unreserved quantity for the named deck.
3. Reserve owned copies before calculating a purchase gap.
4. Promote only cards with both a documented deck purpose and a verified price observation.
5. Keep all unverified leak-driven cards in Research Watch.
6. Bundle sub-dollar cards only when shipping or an existing cart makes the delivered price rational.
7. Preserve the default `$0` action when no timing edge is verified.

## Required next-run fields

Add these to every report row:

- `claim_id`
- exact Scryfall identity or explicit `unverified`
- prior tracker record ID, if any
- original thesis and original date
- current observation and comparison window
- deck-fit status
- market-confidence status
- owned quantity
- reserved quantity
- missing quantity
- action queue state
- invalidation condition
- next review month

## Monthly review seed

This report should enter the December thesis review as a mixed-confidence batch, not as a group of confirmed movers. Score separately:

- price direction;
- deck-demand validation;
- usefulness to the named precon;
- whether the card was already covered by the user’s collection;
- whether release-week supply invalidated the timing thesis.

## Publication decision

Do not publish this pasted report as a new Journal article yet. It contains useful research structure, but it needs a tracker continuity correction and exact-source refresh first. If the claims are re-verified, publish a shorter Market Desk update with the action queue and historical scorecard rather than reproducing the full report.
