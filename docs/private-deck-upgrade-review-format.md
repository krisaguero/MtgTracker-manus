# Private Deck Upgrade Review Format

Use this repeatable process to turn a half-built list into one or more deliberate deck directions. It is designed to read like a precon review: explain what the deck is trying to do, how its card packages work, how it can win, and what still needs checking.

## Keep the source safe

1. Start with the newest source record and its completeness notes. Keep the imported list, order, quantities, commander/sideboard markers, and metadata unchanged.
2. Create a separate draft for every direction. Label each draft with the source record ID, branch format, and version. Never treat a suggestion as an edit to the original.
3. If the export is partial, hidden, or count-incompatible, resolve that first. Do not turn missing rows into cuts, additions, or an assumed planning gap.
4. Keep source records, full decklists, individualized card recommendations, and private test fixtures in the owner's private area. GitHub may hold generic code, templates, tests without private lists, schemas, and this public process guide.

## Review in this order

1. **Commander and identity.** Name the proposed commander only when the source marks it or a separate draft explicitly chooses it. Verify commander eligibility, color identity, and any partner/background rules from current card text and format rules. Do not assume the first legendary card is the commander.
2. **List status and count.** Show source status, exported main and sideboard counts, completeness caveats, and the format target being considered. A matching count is not proof of a finished, legal, or playtested deck.
3. **Subtype, tribe, and themes.** State the primary theme and any secondary theme. Confirm creature subtypes from current card text; title or card-name patterns are only hypotheses. Explain which themes are central and which are support packages.
4. **Card bundles and their jobs.** Map source cards in the separate review to enablers/setup, payoffs/value, ramp/card flow, interaction/protection, recovery, and finishers. Explain how each bundle advances the plan. Do not claim a card's role from its name alone.
5. **Game plan and turn sequence.** Describe early, middle, and closing turns. Show how the deck moves from setup to repeatable value or pressure to a finish, and include a backup line if the main engine is answered.
6. **Mana and lands.** Choose a land target only after identity, curve, speed, ramp, and fixing needs are understood. Check early colored costs, tapped-land trade-offs, and utility lands. Count lands as part of the deck total.
7. **Role balance.** Record actual source/draft counts for ramp, draw and selection, removal/counters, protection, board recovery, finishers, and lands. Adjust to the chosen format and playtest results rather than relying on a universal quota.
8. **Notable synergies.** For each interaction, name the enabler, payoff, rules/text basis, and backup if a piece is removed. Verify the interaction against current Oracle text and rules.
9. **Optional EDHREC comparison.** If useful, link the exact EDHREC page and describe its date/context. Treat its cards as optional alternatives, never as owned cards or automatic additions.
10. **Playtest.** Check opening colors, early plays, theme consistency, setup-to-payoff links, interaction, recovery, and closing speed. Record observed misses and strengths; do not mark testing complete without games.
11. **Choose a separate branch.** Keep the source intact while creating a full Commander draft, a custom Brawlternative, or a non-Commander Battle Box deck.

## Branch rules to state clearly

- **Full Commander:** 100 cards total: one eligible commander plus 99 other cards, including lands. Check singleton rules, color identity, and the current ban list. Do not silently cut source cards; preserve unused ideas in a separate candidate pool if desired.
- **Custom 60-card Brawlternative:** normally one commander plus 59 other cards under the collection's explicitly stated house rules. This is a custom format, not official MTG Arena Brawl. Write down the singleton, commander, and land rules used.
- **60-card Battle Box:** a separate non-Commander deck. Tune it for the box's shared speed and matchup balance; replace commander-only dependencies with ordinary-card roles.

## Evidence labels

Use these labels throughout the review so readers can tell facts from judgment:

- **Source:** directly present in the imported record or linked source. Preserve the source and link when possible.
- **Analysis:** a reasoned interpretation, role assignment, theme read, or proposed strategy. Explain the evidence and keep it separate from the source list.
- **Unverified:** anything not yet checked, including ownership, playtesting, current legality, price/budget, export completeness, or a rules interaction. Do not word it as a fact.

## Required page format

Use these headings in this order for every private deck entry:

1. `Commander & color identity`
2. `List status & count`
3. `Subtype, tribe & theme`
4. `Card bundles & strategic jobs`
5. `Game plan & turn sequence`
6. `Mana base & land reasoning`
7. `Role balance: ramp, draw, answers & finishers`
8. `Notable synergies & backup lines`
9. `Optional EDHREC alternatives`
10. `Playtest checklist`
11. `Separate build directions`

For each heading, show the evidence label and concise supporting facts or a specific “not recorded / needs verification” note. Do not use a placeholder as if it were a completed analysis. Keep sections readable on a phone: short paragraphs, small lists, and no wide tables. Include the source-status summary near the top and a closing note that recommendations never rewrite the source.

## Reusable blank review

```text
# [Private deck title] — [Draft direction]
Source record: [private source ID]
Version: [draft version]

## Commander & color identity
Source: [what the source explicitly says]
Analysis: [chosen commander and why it fits]
Unverified: [eligibility, identity, companion rules]

## List status & count
Source: [export status, main count, sideboard count, caveats]
Analysis: [format target and gap/pool treatment]
Unverified: [completeness and legality checks]

## Subtype, tribe & theme
Source: [verified type/subtype facts]
Analysis: [primary theme, supporting theme, what is cut from focus]
Unverified: [any name-only guesses]

## Card bundles & strategic jobs
Enablers/setup:
Payoffs/value:
Ramp/card flow:
Interaction/protection:
Recovery/finishers:

## Game plan & turn sequence
Early:
Middle:
Closing:
Backup plan:

## Mana base & land reasoning
Identity and curve:
Land count and fixing:
Trade-offs:

## Role balance: ramp, draw, answers & finishers
[Actual counts in this separate draft; explain any gaps]

## Notable synergies & backup lines
[Enabler → payoff → rules basis → backup]

## Optional EDHREC alternatives
[Source link and context, or “none attached”; alternatives stay separate]

## Playtest checklist
[Games/matchups, observed issues, next changes]

## Separate build directions
[Commander / custom Brawlternative / Battle Box; each remains a separate version]

Unverified: ownership, playtesting, budget, legality, and any unchecked rules text.
```
