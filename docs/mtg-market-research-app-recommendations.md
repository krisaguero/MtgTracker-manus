# MTG market research app recommendations

## Current assessment

The app already has the right product surfaces: a chronological set hub, a Commander precon library, collection import, owned-precon tracking, precon sealed-vs-singles analysis, daily movers, historical snapshots, and editorial market pages. The next improvement should be **provenance and decision quality**, not another generic dashboard.

## Highest-priority improvements

### 1. Add a research-run ledger

Create an immutable `market_research_runs` record for every daily brief:

- `runDate`, `windowStart`, `windowEnd`, `marketStatus`
- `sourceCount`, `distinctDomainCount`, `generatedAt`
- report markdown/JSON, model/version, and validation status
- links to every `market_evidence` row

Each evidence row should include `claim`, `sourceUrl`, `sourceName`, `sourceType`, `verifiedAt`, `exactPrinting`, `confidence`, `riskFlags`, and `notes`. This makes the AI brief auditable rather than just readable.

### 2. Preserve exact printing identity

The current market engine deduplicates spikes by card name in `client/src/lib/marketIntelligence.ts`. That can merge materially different printings and treatments. Use a key such as:

`setCode + collectorNumber + finish + language + condition`

Keep `oracle_id` for cross-printing utility analysis, but never use it as the price identity. This is essential for Secret Lair, foil, borderless, showcase, and serialized comparisons.

### 3. Correct precon MSRP and sealed economics

`analyzePreconSealedEconomics()` currently derives `sealedMsrp` from `deck.approxValue` when no MSRP is present. That is useful as a fallback for a UI estimate, but it should not be presented as MSRP or used as an investment conclusion.

Recommended fields:

- `officialMsrpUsd`: nullable, source-backed only
- `observedSealedUsd`: marketplace range with timestamp
- `estimatedCardValueUsd`: derived from exact printing prices
- `sealedEconomicsConfidence`: confirmed / developing / unverified
- `recommendationReason`: structured evidence and failure case

If official MSRP is absent, label the result `MSRP unverified` and switch the decision to a market-price comparison.

### 4. Add a precon opportunity matrix

Extend the precon library with sortable columns for:

- sealed price versus exact singles value;
- top-five concentration risk;
- new-card ratio;
- portable-single ratio;
- duplicate overlap with the collection;
- reprint exposure;
- supply status: announced, released, restocked, or reprint-confirmed;
- recommendation: buy sealed, buy singles, wait for dip, or skip/monitor.

The most useful view is not “highest deck value.” It is **best next dollar for this collection**.

### 5. Upgrade bulk collection management

The current browser-local collection flow is a strong privacy-first starting point, but bulk management needs a normalized inventory model. Add:

- Scryfall card ID / oracle ID;
- set, collector number, finish, language, condition;
- quantity, acquisition cost, acquisition date, source, and storage location;
- unresolved-name queue from ManaBox/Moxfield/Archidekt imports;
- import batch ID and original raw row;
- `playable`, `precon-overlap`, `trade`, `sell`, and `bulk` classifications.

For bulk, show a range instead of a single value:

`gross buylist estimate - fees - shipping - sorting labor = net liquidation estimate`

Add a confidence band and a “do not sort” threshold so the user does not spend an hour processing cards worth less than the labor.

### 6. Make AI suggestions collection-aware and explainable

The existing `NextBestPurchases` and precon recommendation surfaces should consume a shared decision object:

```ts
{
  action: 'BUY_SEALED' | 'BUY_SINGLES' | 'WAIT_FOR_DIP' | 'SKIP_OR_MONITOR',
  exactPrinting: { setCode, collectorNumber, finish },
  evidenceScore: 0,
  liquidityScore: 0,
  reprintRisk: 'low' | 'medium' | 'high' | 'unknown',
  collectionOverlapPct: 0,
  catalyst: 'commander' | 'constructed' | 'product' | 'policy' | 'none',
  failureCase: '',
  confidence: 'Confirmed' | 'Developing' | 'Speculative' | 'Unverified',
  verifiedAt: ''
}
```

Render the evidence, failure case, and missing-data warning beside the action. Never show a naked “buy” badge.

## Medium-priority improvements

### 7. Add a 21-day streak and prediction-resolution view

Use the existing daily history files to show:

- repeated confirmed movers;
- cards that moved for three or more sessions;
- resolved predictions: validated, mixed, invalidated, expired;
- recurring catalysts: precon, spoiler, tournament, rule, reprint, collector;
- false-positive patterns such as thin inventory and single-listing spikes.

This directly supports the user’s request to track streaks without turning streaks into guarantees.

### 8. Separate research facts from editorial prose

Keep the existing article pages, but store structured facts underneath them. Suggested flow:

`source capture → normalized evidence → scored signal → editorial article`

The article should be a rendering of validated facts, not the only place where facts exist. Add a “show evidence” drawer on each card entry.

### 9. Improve bulk-to-precon matching

When an imported collection matches a precon, show three counts:

- cards owned;
- playable copies available after deck reservations;
- missing cards by priority and estimated replacement cost.

The current 50% coverage heuristic is useful for a quick owned/not-owned filter but should not be the only ownership state. Use `owned`, `partial`, `upgrade-ready`, and `not-owned`.

### 10. Add a daily brief control panel

A focused `/market-research` page could expose:

- last successful run and source count;
- current market status;
- unresolved evidence items;
- cards on a streak;
- penny watchlist;
- precon supply events;
- “do not chase” warnings;
- export to Markdown/CSV/JSON.

Keep the existing Daily Movers page as the fast browse view and make this the audit/workbench view.

## Suggested implementation order

1. Add exact-printing identity and provenance types.
2. Correct the sealed MSRP fallback and visibly label unverified values.
3. Add research-run/evidence storage and a JSON report contract.
4. Add collection metadata and unresolved-import review.
5. Build the precon opportunity matrix and collection-aware recommendations.
6. Add the 21-day streak/prediction-resolution view.
7. Add bulk liquidation ranges and export tools.

## Guardrails

- Never infer official MSRP from aggregate singles value.
- Never treat EDHREC inclusion as proof of price appreciation.
- Never call a buyout from active listings alone.
- Never merge treatments when comparing prices.
- Never hide missing data behind a numeric score.
- Always show timestamp, source, confidence, risk, and failure case.
- Keep the final disclaimer: market research and hobby commentary, not financial advice.
