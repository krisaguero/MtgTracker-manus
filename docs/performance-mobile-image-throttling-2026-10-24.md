# Mobile Image Loading Under Network Pressure — 2026-10-24

## Scope and method

This audit compares the current virtualized mobile mover surface against a temporary control build with the same virtualized DOM but image attributes changed from `loading="lazy"`, `decoding="async"`, and `fetchPriority="low"` to eager loading, synchronous decoding, and high priority.

The available browser runner did not expose a Chromium CDP session, so it could not apply a true bandwidth throttle. Instead, both builds were tested with the same controlled mobile-latency simulation: every image request was delayed by 150 ms, fresh navigations were used, and both surfaces ran at a 390 × 844 viewport. The results should be interpreted as a matched request-pressure and latency experiment, not as a full 750 Kbps bandwidth emulation.

## Results

| Metric | Lazy / async / low | Eager / sync / high |
|---|---:|---:|
| Time to usable Market Watch shell | 534 ms | 521 ms |
| Image requests observed | 1 | 763 |
| Image responses observed | 1 | 261 |
| Images in DOM at usable shell | 11 | 11 |
| Loaded natural images at measurement points | 0 | 0 |
| Initial DOM nodes | 1,255 | 1,255 |
| Primary cards mounted | 11 | 11 |
| Detailed table cards mounted | 15 | 15 |
| 60-step scroll sweep | 2,457 ms | 2,573 ms |
| p95 frame interval | 27 ms | 28 ms |
| p99 frame interval | 38 ms | 33 ms |
| Worst frame interval | 41 ms | 36 ms |
| Long Tasks API entries | 0 | 0 |
| Image resources observed after sweep | 0 | 163 |

The eager/high-priority control generated approximately 763 image requests during the same interaction window, compared with one observed request for the lazy/low-priority build. Only 261 eager responses had arrived by the end of the measurement, showing that high-priority image work accumulated behind the simulated latency. The lazy build avoided this request pressure while maintaining comparable scroll frame metrics.

The frame-rate difference was small in this particular harness because the virtualized window keeps only a small number of image elements mounted and the runner did not enforce a constrained download pipe. The eager control was slightly slower for the complete scroll sweep, but the more important result is the 763-to-1 request-pressure difference and the large number of in-flight eager responses.

## Interpretation

Lazy loading and low fetch priority are still the correct defaults for this page. They prevent rapid scrolling from turning every newly mounted virtual card into an immediate high-priority network and decode task. Async decoding also prevents image decode work from blocking the main thread as aggressively as synchronous decoding.

The absence of Long Tasks API entries in both runs indicates that the optimized virtualized DOM remains healthy under this test. It does not prove that the eager control is harmless on real low-end phones: real devices with smaller memory budgets, slower image decoders, and constrained radio throughput are more likely to experience queueing, decode contention, and cache churn from the eager request burst.

## Recommendation

Keep `loading="lazy"`, `decoding="async"`, and `fetchPriority="low"` on mover artwork. Do not raise image priority globally. If a future product requirement needs faster first-card art, selectively prioritize only the first one or two visible primary cards rather than the complete virtualized window.
