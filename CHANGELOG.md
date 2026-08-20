# Changelog — MTG Sets Tracker & Discovery Hub

All notable changes, bug fixes, and feature additions to the Magic: The Gathering Set Tracker and Commander Intelligence Hub are documented in this file.

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
