# Jund Transfer-Lab Optimization Simulation — 2026-10-31

## Scope

This simulation exercises the existing deterministic transfer optimizer against the Jund color combination. It uses four archived Commander precon decklists from the local MTGJSON-derived archive:

- **Blight Curse** — ECC
- **World Shaper** — EOC
- **Graveyard Overdrive** — M3C
- **Riveteers Rampage** — NCC

The authoritative color-identity index classifies all four as Jund (`BRG`). The optimizer now accepts `Jund` as an explicit transfer target label alongside Simic and Dimir.

## Baseline with no scanned inventory

The four target decks contain **400 total cards by quantity**. With an empty inventory, the optimizer reports:

- Matched copies: **0**
- Weighted coverage: **0%**
- Unassigned copies: **0**
- Per-deck coverage: **0%** for all four targets

This is the expected no-export baseline. It does not infer ownership from sealed precon records or from the existence of a decklist.

## Synthetic inventory test

A synthetic inventory of **20 copies** was built from cards shared across the target universe plus the first cards in the archived lists. The optimizer reported:

- Matched copies: **20**
- Total target copies: **400**
- Weighted coverage: **5%**
- Unassigned copies: **0**
- Blight Curse: **11%** coverage
- World Shaper: **3%** coverage
- Graveyard Overdrive: **3%** coverage
- Riveteers Rampage: **3%** coverage

The result is deterministic and all available synthetic copies were allocated.

## What the simulation reveals

The utility is working as designed for a coverage-only dry run. It maximizes normalized marginal coverage and uses a small balance tie-breaker so one target does not absorb every shared card.

However, the result also identifies the next optimization boundary. Because the current planner intentionally matches by normalized card name, basic lands and shared staples can dominate a synthetic or incomplete inventory. It does not yet distinguish:

- a card that is portable across every Jund deck from a card that is theme-specific;
- a card already allocated to an active deck from an unallocated duplicate;
- exact printings, finishes, conditions, or languages;
- a sealed precon copy that has not been opened;
- a high-value transfer from a low-impact basic land transfer;
- a target’s strategic priority or user-selected primary deck.

The next useful improvement is a weighted transfer score with configurable priorities: protect active decks, prefer exact-printing matches, exclude basics by default, favor cards that unlock an upgrade package, and optionally spread shared staples across multiple targets. That should be added after the full ManaBox export is available.

## Regression coverage

`client/src/lib/transferOptimization.test.ts` now includes a Jund scenario verifying that:

- Jund is accepted as a first-class color-group label;
- shared cards remain deterministically allocated;
- total matched copies and weighted coverage remain correct;
- irrelevant inventory remains unassigned.

This report is a planning simulation, not evidence that the user owns any of the synthetic cards.
