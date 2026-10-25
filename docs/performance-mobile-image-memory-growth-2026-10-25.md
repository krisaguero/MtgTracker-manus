# Continuous Mobile Scroll Memory-Growth Audit — 2026-10-25

## Test design

The current virtualized mover page was tested against a temporary control build with identical virtualization and layout, but image behavior changed from `loading="lazy"`, `decoding="async"`, and `fetchPriority="low"` to eager loading, synchronous decoding, and high priority.

Each build ran at 390 × 844 CSS pixels through 20 continuous rapid-scroll passes. Each pass moved both mobile mover surfaces through 50 positions from one end of the feed to the other and back. After every pass, the test recorded DOM nodes, mounted images, loaded images, resource entries, image requests and responses, and frame intervals.

The browser environment did not expose either `performance.memory` or `performance.measureUserAgentSpecificMemory()`. Therefore, exact JavaScript heap growth could not be reported. The test uses retained DOM/image counts, resource-entry growth, request accumulation, frame-tail growth, and Long Tasks API entries as observable memory-pressure proxies.

## Aggregate results

| Metric | Lazy / async / low | Eager / sync / high |
|---|---:|---:|
| Scroll passes | 20 | 20 |
| Image requests | 1 | 8,827 |
| Image responses | 1 | 8,768 |
| Final DOM nodes | 1,255 | 1,251 |
| Final images in DOM | 11 | 11 |
| Final loaded natural images | 0 | 1 |
| Resource entries | 19, stable | 250, stable after pass 2 |
| Long Tasks API entries | 0 | 0 |
| Mean per-pass p95 frame interval | 29.8 ms | 34.1 ms |
| First 10-pass p95 mean | 30.0 ms | 34.5 ms |
| Last 10-pass p95 mean | 29.6 ms | 33.6 ms |
| Mean worst frame interval | 49.0 ms | 59.5 ms |
| Maximum worst frame | 57 ms | 118 ms |
| Maximum per-pass p95 | 43 ms | 48 ms |

## Growth behavior

The lazy strategy reached a stable state immediately. Across all 20 passes, the DOM remained at 1,255 nodes, the mounted image count remained 11, the resource-entry count remained 19, and image requests remained at one. There was no observable retained-resource growth and no upward frame-tail trend.

The eager strategy accumulated image network activity continuously. Requests increased from 631 after the first pass to 8,827 after the twentieth pass, with 8,768 responses observed. The DOM and mounted-image counts stayed bounded because virtualization still worked, but the network and image pipeline continued to process new art as cards were recycled through the window. The eager run produced 189 browser console warnings, compared with one warning during the lazy run, consistent with substantially higher image request pressure.

The eager strategy also showed worse frame tails. Its mean p95 frame interval was approximately 14.3% higher than lazy loading, and its mean worst frame was approximately 21.5% higher. The maximum observed frame delay reached 118 ms for eager loading versus 57 ms for lazy loading. The eager p95 did not monotonically increase across every pass, but it remained noisier and showed larger spikes while image requests accumulated.

## Memory interpretation

Because the browser did not expose heap measurement APIs, this audit cannot claim an exact megabyte increase. The bounded DOM counts show that virtualization prevents retained card markup from growing under either strategy. However, the eager strategy creates a continuously growing stream of image requests and responses, which is the relevant memory and bandwidth risk on lower-end devices: decoded image surfaces, network buffers, and browser cache entries can create pressure even when the React DOM remains small.

The lazy strategy showed no observable request accumulation, resource growth, or frame degradation over the 20-pass run. The eager strategy completed the run without Long Tasks API entries in this environment, but its larger frame spikes and high request count indicate a materially less conservative resource profile.

## Conclusion

Keep lazy loading, asynchronous decoding, and low image priority. The continuous test confirms that the current strategy prevents image-request growth during repeated rapid scrolling and keeps frame behavior stable. Virtualization bounds the DOM, while lazy image behavior bounds the image pipeline.

The temporary eager control server was stopped after the test. Future device-level validation could add Chrome’s memory instrumentation on a physical low-end Android device, but no code change is recommended based on this audit.
