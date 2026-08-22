# Changelog — MTG Sets Tracker & Discovery Hub

All notable changes, bug fixes, and feature additions to the Magic: The Gathering Set Tracker and Commander Intelligence Hub are documented in this file.

## [1.2.3] — 2026-08-22

### Added
- **Supplied Market-Watch References**: Connected the imported market-signal matrix to matching set and card profiles, including article and source links, without inventing missing price values.
- **Commander Valuation Matrix Coverage**: Verified the archive renders all 173 indexed Commander products and that representative official decklists expose a complete 100-card local list with current indexed per-card coverage.

### Fixed
- **Rate-Limit Resilience**: Commander deck pages now use MTGJSON-provided Scryfall UUIDs and direct Scryfall CDN image URLs first, avoiding burst collection/search requests that could trigger browser CORS and 429 noise. Legacy rows without UUIDs retain best-effort enrichment.
- **Repeated Card Identity**: Hardened decklist, valuation, primer, and completion-tooltip keys so repeated basic lands and printings do not create React duplicate-key warnings.
- **Diagnostic Cleanup**: Removed obsolete one-off Scryfall and Commander import diagnostics now that the generated data pipeline is stable.

### Tests
- Full validation passes: 28 test files, 64 tests, TypeScript check, production build, and clean-browser verification of the set, card, Commander archive, and representative decklist routes.

---

## [1.2.2] — 2026-08-22

### Added
- **Full-Resolution Card Artwork**: Card profiles now prefer Scryfall PNG/large artwork, preserve the card’s native aspect ratio, and render the primary image with eager loading and `object-contain` so the full card stays visible.
- **Hamburger Menu Backdrop**: Added a subtle fixed dim-and-blur layer behind the open mobile navigation so the menu stays visually focused while the underlying chronology remains contextually visible.
- **Shared Market Price Index**: Added provenance-aware card and Commander deck valuation helpers that resolve real daily snapshot prices, expose source/timestamp metadata, and mark unpriced cards instead of inventing defaults.
- **Market Coverage Signals**: Added explicit priced/unpriced coverage counts and indexed-price labels to the Commander archive, Next Best Purchases, and sealed-versus-singles analysis cards.
- **Reusable Page Skeletons**: Extended hard-edged loading shells across market mover cards and precon analysis grids, with responsive mobile and desktop verification.

### Fixed
- **Market Report Population**: Repaired the mover feed so it consumes all valid real snapshot products instead of requiring a matching card in the static Commander deck catalog; same-name printings are deduplicated for the visible feed.
- **Stale Skeleton Regression Tests**: Updated Collection and SetDetail resilience tests to assert the current shared `PageSkeletons` components.
- **Menu Layering**: Scoped outside-click handling to the navigation container and kept the new backdrop below the crisp menu panel with explicit pointer-event states.
- **Card Image Cropping**: Removed the forced primary-image minimum height that could create visual crop artifacts and confirmed the rendered Scryfall source at phone and desktop widths.

### Tests
- Added regression coverage for known/unknown market-price resolution, deck valuation coverage, real snapshot mover population, and duplicate-printing suppression.
- Full validation passes: 26 test files, 59 tests, TypeScript check, production build, and responsive browser verification.

---

## [1.2.0] — 2026-08-20

### Added
- **Headless Daily Market Movers**: Added an MTGJSON-powered `daily-market-movers.mjs` collector that produces a normalized latest snapshot, dated archives, and a 30-day idempotent price baseline. The 08:00 UTC GitHub workflow runs the collector and commits changed artifacts.
- **Live Daily Snapshot Consumption**: The canonical market engine now uses generated MTGJSON signals when available and retains the prior static matrix only as an empty-data fallback.
- **Parent-to-Commander Indexing**: Recent set cards now attach Commander child products to their parent release code, including local decklist routing and unresolved child-set search fallbacks.
- **Publication-Safety Guard**: Excluded `.project-config.json` from tracked source, documented its local-only role, and added a regression test that prevents it from being published again.
- **Inventory-Aware "Hide Owned Cards" Toggle**: Added a dedicated filter toggle on set detail pages (`SetDetail.tsx`) allowing users to instantly hide cards already present in their uploaded ManaBox collection and focus purely on missing singles.
- **Creative Precon Archive Styling**: Enhanced the Commander Precon Library (`CommanderPreconLibrary.tsx`) with blurred card-art background backdrops, boxed-product imagery, live collection match progress bars, and direct 100-card decklist routing (`/deck/:setCode/:deckSlug`).
- **Resilient Three-Tier Decklist Loading (`useCommanderDeck.ts`)**: Upgraded decklist retrieval with exact batch collection matching, set code gallery fallback searches, and fuzzy named card recovery to guarantee 100% decklist rendering across all sets (including Edge of Eternities and Marvel Commander).
- **Comprehensive Open-Source Audit & Roadmap**: Compiled an open-source integration report (`audit_report.md`) evaluating MTGJSON bulk data and DuckDB expansions.

### Fixed
- Repaired the Commander deck page hook order so it no longer crashes while transitioning from loading to resolved deck data.
- Resolved decklist loading edge cases where promotional or variant collector numbers caused missing card arrays in Scryfall collection batch requests.
- Fixed layout overflows on mobile viewports for precon archive cards, ensuring clean typography, hard-edged styling, and responsive spacing.

---

## [1.1.0] — 2026-07-28

### Added
- **Commander Passport & Active Builds**: Introduced the Commander Passport for tracking active decks, win counters, and tuning notes.
- **Next Best Purchases Recommender**: AI-driven widget that identifies the closest precon to completion and suggests the cheapest missing singles to buy next with a one-click TCGplayer cart handoff (`Buy All Recommended`).
- **Arena-Morph & Dual-Inventory Dupe-Decks**: Built Groq-assisted 60-card 1v1 duel deck builder and Arena-legal variant export tools with wildcard cost calculations.

### Fixed
- Restored set-to-precon joins on set detail pages.
- Added loading skeleton animations for card grids and reflowed UI to prevent overlays on card art.

## [1.2.1] — 2026-08-22

### Fixed
- Added an explicit Collections hydration skeleton for the local valuation, purchase, and Commander Passport modules.
- Hardened shared card and product artwork rendering with loading indicators, empty-source normalization, and direct Scryfall fallback imagery.
- Bounded initial Scryfall requests for recent sets, the Commander archive, and set detail pages so timeouts resolve to recoverable messages instead of indefinite loading.
- Fixed the SetDetail conditional-hook crash during the loading-to-catalog transition and included related Commander child-set codes in parent expansion attachments.

### Tests
- Added focused regression coverage for Collection hydration and imagery, SetDetail hook ordering and timeout behavior, Scryfall loading recovery, and shared image fallbacks.
