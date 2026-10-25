# Mobile Mover Virtualization Benchmark — 2026-10-24

## Test setup

- Route: `/movers`
- Browser viewport: 390 × 844 CSS pixels
- Build: local production build served through the production preview
- Logical mover window: 7,020 cards
- Scroll sweep: 140 evenly spaced scroll positions through both mobile mover surfaces
- Instrumentation: DOM count, mounted-card count, scroll height, requestAnimationFrame interval sampling, and Long Tasks API

## Implementation covered

The mobile route now virtualizes both places that previously mounted the full mover list:

1. The primary mover-card grid.
2. The detailed mobile mover-card table.

The implementation preserves the full logical scroll height with top and bottom spacers, renders a small overscan window, and keeps the desktop table out of the mobile DOM.

## Results

| Metric | Result |
|---|---:|
| Initial DOM nodes | 1,255 |
| Primary cards mounted initially | 11 |
| Detailed table cards mounted initially | 15 |
| Primary logical scroll height | 2,250,007 px |
| Detailed table logical scroll height | 1,628,856 px |
| Final DOM nodes after full sweep | 850 |
| Primary cards mounted at end | 5 |
| Detailed table cards mounted at end | 9 |
| Scroll sweep elapsed time | 5,765 ms |
| Animation-frame samples | 292 |
| p95 frame interval | 35 ms |
| Worst observed frame interval | 188 ms |
| Long Tasks API entries | 0 |

The sweep reached the end of both virtualized surfaces. The large logical scroll heights are expected: they preserve the position of all 7,020 cards without mounting all of their markup.

## Before comparison

The previous mobile implementation mounted the entire primary mover-card grid even when the table itself was virtualized. In the prior benchmark, the page contained approximately:

- 288,665 DOM nodes
- 7,020 images and more than 7,000 buttons
- A 140-step table scroll sweep that took approximately 74 seconds in the browser measurement
- p95 frame intervals above 650 ms

The new implementation reduced the initial DOM to 1,255 nodes, a reduction of approximately 99.6% against that measured state. The benchmark completed the same logical full-feed sweep in approximately 5.8 seconds.

## Assessment

The virtualization change materially improves mobile scroll behavior and removes the severe full-list DOM bottleneck. No Long Tasks API entries were recorded during the final sweep, and the virtualized window stayed below 16 mounted mover cards per surface in the initial state.

The p95 frame interval of 35 ms and worst frame of 188 ms show that the result is substantially better but not perfectly 60 FPS under this synthetic full-range sweep. The remaining cost comes from React updates as the scroll position changes and from the two independently virtualized surfaces being driven simultaneously by the benchmark.

## Validation

- `pnpm check` passed.
- `MarketMoversTable.test.tsx`: 11 tests passed.
- `MarketResearchFeed.test.tsx`: 2 tests passed.
- Production build passed.
- Final route rendered without console errors during the benchmark.
