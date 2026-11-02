# Portfolio precon 100-card validation simulation

**Run date:** 2026-11-01
**Archive tested:** `client/src/data/commanderDecklistsData.ts`
**Validator:** `client/src/lib/deckDiffBuilder.ts`

## Result

The validator was run across all **173 archived precon decklists** used by the portfolio workspace.

| Metric | Result |
|---|---:|
| Archived precons tested | 173 |
| Baseline lists with valid Commander size | 173 / 173 |
| Baseline lists with invalid size | 0 |
| Synthetic one-for-one upgrade tests passing | 173 / 173 |
| Total-card-size mismatches | 0 |
| Singleton review warnings | 1 |

The simulation initially exposed five false failures because the validator assumed every deck had exactly one commander. Those were legitimate two-commander products with 98-card mainboards:

- Blast from the Past (`who`)
- Paradox Power (`who`)
- Timey-Wimey (`who`)
- Food and Fellowship (`ltc`)
- Heads I Win, Tails You Lose (`sld`)

Phase 10 was corrected to accept one or two commander cards and calculate the mainboard target as `100 - commander count`.

## Synthetic upgrade test

Every archived deck received a synthetic one-for-one change:

```text
ADD: __Synthetic Bridge Addition__
CUT: first mainboard card
```

All 173 tests remained at exactly 100 cards after the simulated replacement. This confirms that the diff builder preserves deck size when additions and cuts are balanced.

## Remaining data warning

### Upgrades Unleashed (`nec`)

The archived list has the correct total size:

- 1 commander
- 99 mainboard cards
- 100 cards total

The validator reports one singleton review warning:

```text
Mossfire Valley (2)
```

This is not a size failure. It is a nonbasic duplicate requiring a source-data or legality review. The diff builder keeps the warning visible rather than silently accepting it.

## Validator rule now in effect

- One commander: 99-card mainboard
- Two commanders: 98-card mainboard
- Total must equal 100 cards
- Basic lands may repeat
- Nonbasic repeated names trigger a singleton review warning
- One-for-one additions and cuts must balance before a diff is marked ready

## Conclusion

The Phase 10 validator is safe to use across the full portfolio archive. All 173 precons pass size validation, all 173 pass a one-for-one diff simulation, and the only remaining issue is the explicitly surfaced `Mossfire Valley (2)` singleton warning in Upgrades Unleashed.
