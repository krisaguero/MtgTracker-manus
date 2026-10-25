# Daily Movers UI Performance Review — 2026-10-24

## Scope

This review measures the Priority 3 scanner-layer UI refactor on the `/movers` route. The change adds explicit cards for raw observations, the surfaced mover window, a deduplicated threshold shortlist, and the rising/falling split.

## Bundle impact

The production build completed successfully.

| Asset | Raw size | Gzip / encoded reference |
|---|---:|---:|
| `DailyMovers` route chunk | 97,869 bytes | approximately 23–30 KB transferred in the browser run |
| `dailyMarketSnapshot` data chunk | 8,375,029 bytes | 8,375,029 encoded bytes in the local production run |
| `dailyMoverHistory` data chunk | 2,210,438 bytes | 2,210,438 encoded bytes in the local production run |
| All observed route assets | — | 11,356,295 encoded bytes |

The new scanner summary logic and JSX together add approximately 3,688 source bytes and 1,036 gzip-compressed bytes before minification. No additional network request or generated data file was introduced by the refactor.

The dominant initial-load cost remains the asynchronously requested market data:

- `dailyMarketSnapshot`: approximately 8.38 MB
- `dailyMoverHistory`: approximately 2.21 MB
- Combined market data: approximately 10.59 MB before transport compression

The summary panel itself is negligible by comparison.

## Cold-render behavior

A fresh production-route browser run showed the intended progressive behavior:

1. The route shell appeared before the large snapshot was hydrated.
2. The title and scanner controls rendered while the data modules were still loading.
3. After the snapshot resolved, the summary showed:
   - 12,511 raw observations
   - 7,020 cards in the daily/rolling mover window
   - 34 deduplicated threshold-shortlist candidates
   - 3,460 rising / 3,560 falling cards

However, the completed table currently renders the entire 7,020-card mover window. The measured hydrated document contained approximately:

- 723,570 DOM nodes
- 2.68 MB of visible text content
- Approximately 112 MB of serialized HTML in the browser inspection

The browser measurement showed the shell available first, followed by a long render/hydration interval when the full mover table was materialized. This is the remaining cold-mobile risk, not the new scanner summary panel.

## Assessment

**Impact of the Priority 3 UI change: low.** The panel adds minimal JavaScript and no data payload. It improves information hierarchy without materially increasing network cost.

**Remaining route risk: high.** Rendering thousands of rows at once creates substantially more work than the scanner summary. The route is no longer blocked by synchronous module evaluation, but it can still become expensive after the large datasets resolve.

## Recommended next optimization

Keep the summary panel. The next performance change should be one of:

1. Render the first 50–100 surfaced movers and paginate the rest.
2. Virtualize the desktop table and mobile cards.
3. Use a smaller server-generated surfaced-movers JSON payload for the initial route, loading the full raw snapshot only from the provenance or export flow.

The best near-term option is pagination or virtualization because it preserves the current filters while reducing the initial DOM from hundreds of thousands of nodes to a few thousand or fewer.

## Validation

- `pnpm check` passed.
- Movers, Market Watch, and homepage navigation regression tests passed: 19 tests passed.
- Production build passed.
- `git diff --check` passed.
