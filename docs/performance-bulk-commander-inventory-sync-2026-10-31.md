# Bulk Commander Inventory Sync Performance

**Date:** 2026-10-31  
**Scope:** Pure inventory-to-Commander-deck completion and cross-deck coverage calculations  
**Safety:** The benchmark used isolated in-memory records derived from the repository's real Commander archive. It did not read or modify browser localStorage, the signed-in account, Supabase, or any saved inventory.

## Test method

The benchmark ran against the merged Commander archive currently loaded by the application: **198 decks**. Inventory rows were constructed from real card entries in that archive, preserving card names, quantities, set codes, collector numbers, and UUIDs. The largest workload contained **17,247 inventory rows** representing **6,432 unique card names**.

Each bulk run measured:

- `detectInventoryDeckCompletions()` across the complete archive.
- `simulatePreconCoverage()` for the remaining decks after the first N decks were treated as owned.
- Median timing from eight samples, with p95 reported from the same sample set.

A separate stress case intentionally called the matcher once per deck to expose the cost of rebuilding the inventory index repeatedly. This is a control comparison, not the current page implementation.

## Results: current bulk path

| Owned-deck workload | Inventory rows | Unique names | Completion median | Coverage median | Combined median | Combined p95 | Complete decks detected |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 20 | 1,827 | 1,272 | 2.95 ms | 2.65 ms | **5.60 ms** | 9.03 ms | 28 / 198 |
| 50 | 4,558 | 2,619 | 3.16 ms | 2.60 ms | **5.75 ms** | 6.42 ms | 62 / 198 |
| 100 | 8,844 | 4,505 | 3.86 ms | 2.64 ms | **6.51 ms** | 7.41 ms | 116 / 198 |
| 198 | 17,247 | 6,432 | 5.30 ms | 2.43 ms | **7.72 ms** | 9.80 ms | 190 / 198 |

The completion count can exceed the number of explicitly selected source decks because shared card pools can fully cover additional decks. That behavior is expected for the inventory-completion detector.

## Repeated per-deck control

The current precon library calls the matcher once for the full deck archive (`CommanderPreconLibrary.tsx:128`). To test the less efficient alternative, the harness called the same matcher separately for each deck while keeping the full 17,247-row inventory in memory.

| Individual matcher calls | Typical elapsed time |
|---:|---:|
| 20 decks | 55–72 ms |
| 50 decks | 136–140 ms |
| 100 decks | 248–255 ms |

Twenty repeated 50-deck cycles averaged **123.15 ms per cycle**. The observed heap delta was **-7.13 MB** after garbage collection opportunity, so the test did not show retained heap growth. The work is CPU-heavy because each individual call rebuilds the same inventory-by-name map.

## Findings

The current implementation is performing well for the requested workload. A large inventory synced against all 198 archived decks completes in roughly **8 ms median** in the pure calculation layer, with a measured **9.8 ms p95** in this run. This is far below a frame budget and should not be the cause of visible loading or interaction delay by itself.

The main performance rule to preserve is the existing bulk call. Avoid changing the precon page to call `detectInventoryDeckCompletions([deck], inventory, ...)` inside a deck loop. That pattern is approximately 18–35 times slower in this benchmark at the 50–100 deck workloads because it reconstructs the inventory index for every deck.

## Recommendation

No immediate optimization is required for the current page. If a future feature needs per-deck incremental updates, extract and cache the normalized `inventoryByName` map once, then pass that index into a lower-level per-deck matcher. Keep the public bulk helper as the default path and add a regression benchmark around the 198-deck / 17k-row case so future changes do not accidentally reintroduce repeated indexing.
