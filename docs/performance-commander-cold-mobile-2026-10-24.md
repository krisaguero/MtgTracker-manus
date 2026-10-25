# Commander Cold Mobile Performance Report

**Date:** 2026-10-24  
**Scope:** Commander archive lazy-loading optimization  
**Route focus:** `/commander` (Commander Library), with a secondary `/precons` check

## Method

This comparison used two isolated production builds served through the same environment and browser forwarding layer:

- **Baseline:** repository `HEAD` before the archive optimization.
- **Optimized:** current working tree with `useCommanderArchive()` and `useCommanderArchiveIndex()`.

The browser viewport was set to **390 × 844**. Each route was opened for the first time on its separate origin with a cache-busting query parameter. Measurements came from the browser Performance API, including navigation timing and resource transfer sizes. This is a real cold first-load comparison, but it is not a Lighthouse score: CPU and network throttling were not artificially imposed.

## Primary result: `/commander`

| Metric | Baseline | Optimized | Change |
|---|---:|---:|---:|
| Total resource transfer | 3,943,883 bytes | 698,926 bytes | **-3,244,957 bytes (-82.28%)** |
| Encoded resource bytes | 3,938,183 bytes | 693,526 bytes | **-3,244,657 bytes (-82.39%)** |
| Full Commander archive transfer | 2,864,115 bytes | 0 bytes | **-2,864,115 bytes (-100%)** |
| Metadata index transfer | 0 bytes | 57,460 bytes | +57,460 bytes |
| `DOMContentLoaded` | 199 ms | 576 ms | +377 ms in this run |
| `loadEventEnd` | 445 ms | 576 ms | +131 ms in this run |

The archive-specific payload improved from the 2.86 MB full card archive to a 57 KB metadata index: **2,806,655 bytes saved**, or **97.99% less archive data**.

### Interpretation

The byte reduction is the reliable performance win. The one-run browser timing did not show a lower `DOMContentLoaded` or `loadEventEnd` on `/commander`; the optimized run was slower by 377 ms and 131 ms respectively. That timing result is not evidence of a regression in archive loading. The Commander page also performs live Scryfall/API work, and the two isolated origins had different response timing during this run. The optimization removes 2.86 MB from the route’s cold transfer path; it does not control upstream API latency or browser scheduling.

## Secondary result: `/precons`

The precon library requires full card lists for valuations, so it eventually downloads the full archive in both versions. The optimization still improves the early route shell because the archive is deferred.

| Metric | Baseline | Optimized | Change |
|---|---:|---:|---:|
| Early transfer before deferred work | 1,198,183 bytes | 765,593 bytes | **-432,590 bytes (-36.10%)** |
| Early navigation `loadEventEnd` | 223 ms | 137 ms | **-86 ms (-38.57%)** |
| Full archive after deferred load | 2,864,115 bytes | 2,864,115 bytes | No change; required by this feature |
| Transfer after approximately 1.2 s | 17,942,239 bytes | 18,395,564 bytes | Not comparable as a pure archive metric; image/API work dominates |

## Bundle structure after optimization

The optimized production build contains:

- `commanderDeckIndex`: approximately **57 KB**
- `commanderDecklistsData`: approximately **2.86 MB**, isolated in the deferred full-archive path
- Commander Library route chunk: approximately **23 KB**
- Commander Precon Library route chunk: approximately **46 KB**
- Commander Market Index route chunk: approximately **17 KB**

Commander Library no longer references the full archive in its route chunk. It requests the lightweight index instead. Full card-list consumers retain access to the deferred archive through the shared cached loader.

## Conclusion

For the metadata-only Commander Library route, the optimization removes approximately **3.24 MB from the first-load transfer**, reducing measured resource bytes by **82.28%**. The specific archive payload reduction is **97.99%**. For the precon valuation route, the full archive remains necessary, but it is deferred and the early shell was **36.10% lighter** and **86 ms faster** in the matched run.

The next meaningful measurement improvement would be a throttled Lighthouse run on a fixed Chromium profile with controlled CPU/network settings. The current environment did not have the Lighthouse CLI installed, so this report intentionally does not claim Lighthouse performance scores.
