# Changelog — MTG Sets Tracker & Discovery Hub

All notable changes, bug fixes, and feature additions to the Magic: The Gathering Set Tracker and Commander Intelligence Hub are documented in this file.

## [1.2.0] — 2026-08-20

### Added
- **Inventory-Aware "Hide Owned Cards" Toggle**: Added a dedicated filter toggle on set detail pages (`SetDetail.tsx`) allowing users to instantly hide cards already present in their uploaded ManaBox collection and focus purely on missing singles.
- **Creative Precon Archive Styling**: Enhanced the Commander Precon Library (`CommanderPreconLibrary.tsx`) with blurred card-art background backdrops, boxed-product imagery, live collection match progress bars, and direct 100-card decklist routing (`/deck/:setCode/:deckSlug`).
- **Resilient Three-Tier Decklist Loading (`useCommanderDeck.ts`)**: Upgraded decklist retrieval with exact batch collection matching, set code gallery fallback searches, and fuzzy named card recovery to guarantee 100% decklist rendering across all sets (including Edge of Eternities and Marvel Commander).
- **Comprehensive Open-Source Audit & Roadmap**: Compiled an open-source integration report (`audit_report.md`) evaluating MTGJSON bulk data and DuckDB expansions.

### Fixed
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
