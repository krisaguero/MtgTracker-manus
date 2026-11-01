# Simic + Dimir Transfer-Lab Optimization

**Run date:** 2026-10-31
**Scope:** Commander precon archive, authoritative color-identity index, and the currently evidenced private inventory snapshot.

## Executive result

The current run is a valid dry run, but it cannot produce a physical transfer package yet. The workspace evidence carried into this session contains only two copies of `Giada, Font of Hope`; neither copy appears in any Simic or Dimir target precon list. The optimizer therefore assigns **zero cards**, producing **0 / 1,400 target copies covered (0%)**.

This is not a recommendation to buy 1,400 cards. It is the denominator for the target universe: fourteen indexed 100-card precon lists that match the requested color pairs. The missing-card count and transfer package will become meaningful after the full ManaBox export is imported.

## Target universe

The authoritative precon color index identifies:

- **8 Simic (UG) decks:** Quandrix Unlimited, Jump Scare!, Tricky Terrain, Explorers of the Deep, Elven Council, Quantum Quandrix, Reap the Tides, and Swell the Host.
- **6 Dimir (UB) decks:** Revenant Recon, Fae Dominion, Grave Danger, Mind Flayarrrs, Undead Unleashed, and Sneak Attack.
- **14 decks total**, each indexed at 100 cards, for **1,400 target card copies** before duplicate-aware allocation.

## Optimization rule

The transfer optimizer is deterministic and name-based for planning:

1. Build a required-copy map for every target deck.
2. Aggregate available copies from the scanned inventory.
3. Allocate each available copy only where the target still needs that name.
4. Prefer the largest normalized coverage gain and use current deck coverage as a balancing tie-breaker, preventing one color from absorbing every shared staple.
5. Report deck-level matched copies, coverage percentage, missing unique cards, unassigned inventory copies, and the exact target assignment for each transferable card.

Exact printing, condition, finish, language, and proxy status remain part of the ManaBox layer and must be checked before a physical move. The simulation intentionally does not silently merge differently printed cards.

## Current result

| Metric | Result |
|---|---:|
| Simic targets | 8 decks |
| Dimir targets | 6 decks |
| Target copies | 1,400 |
| Evidenced transferable copies | 0 |
| Optimized assignments | 0 |
| Weighted target coverage | 0% |
| Source inventory copies left unassigned | 2 Giada copies |

`Giada, Font of Hope` is white-aligned and does not occur in the Simic/Dimir target lists, so assigning it would be an invalid transfer rather than a useful optimization.

## What to import next

Import the complete ManaBox export, including the exact-printing fields where available:

- card name
- quantity
- set code
- collector number or Scryfall ID
- finish
- condition
- proxy flag
- trade quantity, if maintained

After import, rerun the command center. The resulting package will show, for each target deck:

- cards that can move from the scanned pool;
- whether a copy is already reserved or only available as a duplicate;
- the Simic-versus-Dimir balance after allocation;
- the highest-coverage target deck;
- cards still missing by unique name and required copies;
- cards that should remain in the source deck because moving them would reduce a completed or higher-priority build.

## Recommended decision policy once the export exists

Use a two-stage objective rather than blindly maximizing one deck:

1. First maximize the combined Simic + Dimir coverage from transferable duplicates.
2. Then maximize the lower-covered color’s percentage so Dimir or Simic does not become a permanent second-class pool.
3. Preserve cards that are the only copy in a source deck unless the user explicitly chooses to cannibalize that deck.
4. Prefer a target at 75%+ coverage when two options are close; it creates a playable deck sooner than spreading the same cards across many low-coverage lists.
5. For Fantastic Four upgrades, keep exact copies outside this color-gap run and evaluate them in a separate target so the Marvel project does not consume the cards earmarked for a Simic/Dimir build.

## Implementation

The reusable optimizer is in `client/src/lib/transferOptimization.ts`. It is intentionally separate from the sealed-precon ownership ledger and the automatic full-deck completion detector. This keeps the simulation advisory: it does not mark a deck owned, change inventory quantities, or move cards without an explicit future action.
