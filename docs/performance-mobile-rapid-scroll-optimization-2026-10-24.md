# Low-End Mobile Rapid-Scroll Optimization — 2026-10-24

## Changes implemented

The mover surfaces now use four low-end-device safeguards:

1. Scroll-mode markers are written directly to the scrolling surface instead of adding another React state update.
2. Entrance animations are disabled while rapid scrolling is active, avoiding opacity and transform animation work as virtualized cards are replaced.
3. Virtualized card surfaces use `contain: layout paint style`, `content-visibility: auto`, and an intrinsic size so off-window cards do not participate in unnecessary layout and paint work.
4. Card art uses lazy loading, asynchronous decoding, and low fetch priority to reduce competition between scrolling and image work.

The virtual window state was also tightened. React now rerenders only when scrolling crosses a card-window boundary, rather than updating the virtual slice on every animation frame.

## Matched 390px rapid-scroll battery

Both measurements used the production build at a 390 × 844 viewport and drove the primary card grid and detailed mobile table through 100 scroll positions.

| Metric | Before this pass | After this pass |
|---|---:|---:|
| Initial DOM nodes | 1,255 | 1,255 |
| Primary cards initially mounted | 11 | 11 |
| Table cards initially mounted | 15 | 15 |
| Scroll sweep elapsed | 3,922 ms | 3,677 ms |
| Animation-frame samples | 214 | 212 |
| p95 frame interval | 34 ms | 31 ms |
| p99 frame interval | 41 ms | 37 ms |
| Worst frame interval | 51 ms | 60 ms |
| Long Tasks API entries | 0 | 0 |
| DOM nodes at end of sweep | 891 | 891 |
| Primary cards mounted at end | 6 | 6 |
| Table cards mounted at end | 9 | 9 |

The elapsed sweep improved by approximately 6.2%. The p95 frame interval improved by approximately 8.8%, and p99 improved by approximately 9.8%. The worst single frame was slightly higher in the second run; that is a noisy tail metric and did not coincide with a Long Tasks API entry.

## Memory and layout assessment

Exact JavaScript heap bytes remain unavailable because the browser environment does not expose `performance.memory`. The virtualized surface continues to hold approximately 1,255 DOM nodes at initial render and fewer than 16 mover cards per surface. CSS containment keeps the active window isolated from unrelated layout and paint work, while `content-visibility` provides a browser-level skip opportunity for cards outside the viewport.

The prior unvirtualized control mounted 723,552 DOM nodes, 7,020 primary cards, 7,020 table cards, 7,020 images, and more than 35,000 buttons. The current implementation remains approximately 99.8% smaller by initial DOM size.

## Validation

- `pnpm check` passed.
- `MarketMoversTable.test.tsx`: 11 tests passed.
- `MarketResearchFeed.test.tsx`: 2 tests passed.
- Production build passed.
- Browser route completed with no console errors during the final measurement.

## Recommendation

Retain this pass. The measurable gains are positive, but the low-end path is now near the point where further improvements should be device-specific rather than broad. The next highest-value experiment would be replacing the two independent scroll-state windows with a shared virtualization coordinator or using an IntersectionObserver-driven window, then measuring on a throttled CPU profile.
