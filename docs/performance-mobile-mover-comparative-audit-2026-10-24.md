# Comparative Mobile Mover Audit — Virtualized vs. Unvirtualized

## Test setup

- Route: `/movers`
- Viewport: 390 × 844 CSS pixels
- Builds: matched local production builds
  - Virtualized build on port 3002
  - Temporary unvirtualized control build on port 3001
- Logical feed: 7,020 mover cards
- Browser: Playwright Chromium mobile viewport
- Battery: initial DOM and memory proxies, mounted cards, logical scroll height, scroll frame sampling, and Long Tasks API

The browser did not expose `performance.memory` in this environment, so exact JavaScript heap bytes were unavailable. DOM size, serialized HTML, mounted component count, image count, and button count are used as memory-pressure proxies.

## Initial surface comparison

| Metric | Virtualized | Unvirtualized | Change |
|---|---:|---:|---:|
| DOM nodes | 1,255 | 723,552 | 99.83% lower |
| Serialized HTML | 200,351 bytes | 112,549,328 bytes | 99.82% lower |
| Body text | 7,643 bytes | 2,676,461 bytes | 99.71% lower |
| Primary mover cards mounted | 11 | 7,020 | 99.84% fewer |
| Detailed mobile table cards mounted | 15 | 7,020 | 99.79% fewer |
| Images mounted | not separately counted in final virtualized sample | 7,020 | full unvirtualized image list |
| Buttons mounted | not separately counted in final virtualized sample | 35,123 | full unvirtualized control set |

The virtualized page preserves the full logical scroll heights while mounting only the visible window plus overscan:

- Primary card grid logical scroll height: 2,250,007 px
- Detailed mobile table logical scroll height: 1,628,856 px

## Scroll battery

### Virtualized

A 60-step sweep drove both mobile surfaces from the top to the end of the logical feed.

- Sweep elapsed time: 2,451 ms
- Animation-frame samples: 136
- p95 frame interval: 27 ms
- Worst frame interval: 35 ms
- Long Tasks API entries: 0
- Mounted primary cards at end: 5
- Mounted table cards at end: 9
- DOM nodes at end: 850

### Unvirtualized control

The unvirtualized page mounted all 7,020 primary cards and all 7,020 detailed mobile cards. The full initial readiness wait exceeded 120 seconds in the browser harness before the page became inspectable. After the page completed mounting, a reduced 10-step sweep was run to avoid extending the control run indefinitely.

- Reduced sweep elapsed time: 7,904 ms
- Animation-frame samples: 18
- p95 frame interval: 627 ms
- Worst frame interval: 627 ms
- Primary cards mounted: 7,020
- Detailed table cards mounted: 7,020
- DOM nodes: 723,552
- Long Tasks API values were not retained after the timed navigation run, so no exact control-build long-task total is reported.

## Interpretation

The virtualized implementation removes the dominant mobile memory and layout pressure. The initial DOM and serialized HTML are both approximately 99.8% smaller, while all 7,020 logical cards remain reachable through preserved scroll height.

The optimized scroll sweep completed in roughly 2.45 seconds with no Long Tasks API entries and a 27 ms p95 frame interval. The unvirtualized control could not sustain the same battery: its page needed more than two minutes to become ready in the harness, and even a reduced post-load scroll sweep produced 627 ms frame intervals.

Exact heap consumption could not be measured because this Chromium environment does not expose `performance.memory`. The DOM and mounted-resource reductions are nevertheless direct indicators of lower retained UI memory pressure.

## Conclusion

The virtualized mobile mover surfaces are a substantial performance improvement and should be retained. The remaining p95 interval above 16.7 ms is caused by React window updates and synthetic simultaneous scrolling of both surfaces, not by full-list DOM mounting. Further optimization, if needed, should focus on reducing scroll-state update frequency or using a shared virtualizer rather than reverting to full rendering.
