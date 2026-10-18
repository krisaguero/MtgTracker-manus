# MTG Tracker — public project and product history

## How to read this history

This document records the public product direction, approved ideas, workflows, design rationale, historical market-report boundaries, and release decisions visible in this repository. It is an editorial history, not a private handoff or an ownership ledger.

Three kinds of evidence are kept separate:

- **Historical observation:** a dated report, source window, archived snapshot, or source-reported movement. It is not a current quote.
- **Current lookup:** a value or card record resolved from the app’s current public data path at lookup time. Retailer links open a search and require the reader to choose the exact printing, finish, condition, quantity, and shipping.
- **Prediction or simulation:** an unresolved thesis, forecast range, or calibration exercise. A backtest is not proof that current predictions succeeded.

The app does not turn missing prices into zero, historical windows into live movers, or successful text export into format legality. This separation is the central trust rule of the market and deck workflows.

## Product origin and design language

The original product was a chronological Magic: The Gathering set and Commander-precon tracker. The README describes a React/Tailwind application using Scryfall for public set, card, symbol, and image data, with newest-first chronology, set identity, precon entries, dedicated decklist pages, Scryfall links, responsive layouts, and Arena/Moxfield-oriented text exports ([README](../README.md)).

The visual direction is the **Minimalist Card Collector Interface**: hard edges, strong typography, card-centric composition, deep indigo actions and timeline markers, and a reverse-chronological narrative. The intent is to frame card art and useful metadata without making the interface compete with the cards ([ideas.md](../ideas.md)). Loading states evolved toward card-shaped, branded shells rather than generic centered spinners. The same principle informs the later journal and deck shelves: make the primary object readable first, then expose the next action.

## Public product timeline

### Foundation: catalog before analysis

The first public concept was a focused set catalog: recent sets, symbols, release dates, card counts, and associated Commander products. A full deck route then added grouped 100-card lists, commander identification, card imagery, and copyable exports. The early README intentionally listed price tracking, collection tracking, filtering, and dark mode as potential enhancements rather than pretending they already existed.

The product subsequently expanded into a discovery hub. The changelog records, among other milestones:

- **July 28, 2026 — 1.1.0:** Commander Passport and active-build ideas, a Next Best Purchases recommender with a TCGplayer handoff, and Arena-oriented 60-card deck tooling.
- **August 20, 2026 — 1.2.0:** MTGJSON-powered daily market movers, dated archives, a 30-day baseline, parent-to-Commander indexing, an inventory-aware “Hide Owned Cards” control, and stronger precon/decklist loading.
- **August 22, 2026 — 1.2.1–1.2.3:** hydration and image fallbacks, bounded requests, provenance-aware pricing, unpriced coverage signals, full-resolution card artwork, duplicate-printing protection, and validation across the archive and representative deck routes.
- **October 16, 2026 — 1.2.4:** provenance labels, a read-only Market Watch snapshot, separated historical reports, paused synthetic morning-report behavior, source-dated mover rows, and tests for distinct dates and empty feeds ([CHANGELOG.md](../CHANGELOG.md)).
- **October 16–18, 2026:** privacy-first Battle Box tools, prediction calibration notes, audited historical replay, a chronological market hub, Brawlternative deck pages and strategy packages, and the journal/deck-export baseline. The public commit history records these milestones, including `c397ea0`, `d396b41`, `81ba59b`, `67f0a5b`, `650f8b7`, `551b365`, `81f33dd`, `4f07b4c`, and the baseline `d49e74e`.

### The deck-shelf ideas

The deck features are deliberately different products rather than one blended collection page:

- **Retro Battle Box:** nine non-Commander, casual 1v1, 60-card deck concepts. Its index emphasizes visual deck art and a quick browse path; a detail page supplies the readable list, strategy notes, card inspection, print/download tools, and optional local planning controls. The art-first index is useful because the Battle Box is a set of game-night identities, not a commander catalog. Physical-card purchase/search is primary; proxy-print help is secondary and optional.
- **Brawlternatives:** custom, self-built 60-card Commander-preview decks, explicitly not official Brawl and not regulation 100-card Commander. The index leads with each primary commander and readable printed Oracle text so readers can understand the rules anchor before opening a visual spoiler or detail route. Identity, legality, unresolved names, source totals, and work-in-progress labels remain visible rather than being silently “fixed” ([BrawlBox.tsx](../client/src/pages/BrawlBox.tsx), [BrawlDeckCard.tsx](../client/src/components/BrawlDeckCard.tsx)).
- **Deck detail:** remains unchanged as a product decision in this UX pass. Detail pages continue to be the place for complete lists, grouped roles, visual/list switching, rules notes, source audits, and export/purchase actions. The journal and index surfaces link into that detail experience instead of duplicating it.

The approved Brawlternative editorial proposals preserve source history while separating proposed finishes: The Wise Mothman corrects names, removes off-identity Abzan Falconer, and adds Fathom Mage plus Inspiring Call to reach 60; Rakdos keeps its 60 cards and 21 lands while repairing the timing explanation; Karlov keeps its 20-land shell with the approved Crested Sunmare and Daxos the Returned corrections. These are hypotheses for testing, not claims of tuning or playtest success ([brawlternative-completion-review.md](../docs/brawlternative-completion-review.md)).

### Journal and reading workflow

The journal separates reading-heavy prose from chart dashboards. Articles have a short-version overview, table of contents, related reading, and contextual links to deck pages. The intended workflow is **read the idea → inspect the rules/card context → export or test → buy physical cards only after review**. Export buttons copy or download text; they do not launch a client, join a room, create a cart, spend wildcards, or certify legality. The format-specific behavior and verification boundaries are documented in [deck-export-review.md](../docs/deck-export-review.md).

The public article set connects remote-play testing, the seven-deck Brawlternative shelf, and the nine-deck Battle Box recap. The guidance treats opening-hand tests as diagnostics, not proof of balance; it keeps platform claims tied to each platform’s public documentation. The source article copy and its dates remain in [editorial-review-copy.md](../docs/editorial-review-copy.md).

## Market research history and source windows

The following records are intentionally not one continuous live feed. Dates and windows are preserved so a reader can tell what was observed, when, and from which public source.

| Record | Date or capture | Window / meaning | Public sources and boundary |
|---|---|---|---|
| Hobbit / Dwarf mover screen | Source data **2026-08-18**, retrieved **2026-08-19 UTC** | Historical MTGStocks `average/regular` Interests screen; the article calls it a 500-printing screen, not an independently ranked leaderboard | MTGStocks, Wizards product/format material, and Scryfall reference fields; see [MarketWatchArticle.tsx](../client/src/pages/MarketWatchArticle.tsx). It is not a current quote. |
| Imported market matrix | Snapshot dated **2026-08-25** | A distinct user-provided 250-row CSV import | Historical data only; it is not refreshed by the page and is not silently merged into the daily feed ([market-data-lineage.md](../docs/market-data-lineage.md)). |
| Standalone Market Watch page | **2026-09-14** | Older standalone journal research page, outside the verified Daily Reports data source | Retained as a separate dated article; prices are snapshots, not current quotes. The inventory documents its public-source caveat ([market-report-inventory.md](../docs/market-report-inventory.md)). |
| Historical report archive | Report **2026-10-05** | Approximate source window **2026-09-19–2026-10-01** | Ten source categories and citations; historical price-watch signals, not verified daily movers. Repeated mentions are not unique-card counts. |
| Historical report archive | Report **2026-10-11** | Visible price/Interests/Weekly Winners evidence through **2026-10-10** | Eight source-reported multi-day price-watch signals; it explicitly does not verify 250 distinct prior-day movers. Catalyst/spoiler material is separate. |
| MTGJSON sample | **2026-10-15** | Nine-printing sample; its first observation is a baseline, not movement | Separate from the article/report archive and canonical mover feed. |
| Verified Daily Reports row | **2026-10-15** | Prior trading day; public pricing visible through **2026-10-14** | One of two verified rows in the accessible Daily Reports source; initialization-period signal brief, not a verified Top-250/24-hour feed. |
| Verified Daily Reports row | **2026-10-16** | Public market and official-announcement evidence through **2026-10-16** | Second verified row; source links and disagreement/caveats are preserved. Public research includes TCGplayer, TCGIndex, MTGStocks, and Wizards announcements as catalogued in [market-research-2026-10-16.md](../docs/market-research-2026-10-16.md). |
| Source-dated daily signals | **2026-10-08–2026-10-16** | Fourteen records whose observation dates remain attached to each row | `client/src/data/dailyMarketSnapshot.json`; generation time is not substituted for observation date. |
| Read-only research capture | Captured **2026-10-17T02:14:17Z**, evidence through **2026-10-16** | Static snapshot of the two verified October Daily Reports rows | Public citations and uncertainty labels only; it is not a live feed. |

The market report inventory confirms that the accessible Daily Reports database contains exactly two posted rows, October 15 and October 16. It does not justify filling October 6–10, October 12–14, or other gaps with invented reports. The chronological hub may make separate records discoverable in one place, but it preserves each report’s source, verification label, URL, data window, and caveat ([market-report-inventory.md](../docs/market-report-inventory.md)).

The October 16 research record also preserves disagreement rather than averaging it away: TCGplayer and TCGIndex report different Jace/The Theorist prices. The record labels this as a data-quality issue; Haliya has no clean percentage baseline, exact Reality Fracture collector numbers were unresolved in that pass, and sealed/precon announcements are kept separate from portable single-card demand ([market-research-2026-10-16.md](../docs/market-research-2026-10-16.md)).

## Current lookup, prediction, and simulation boundaries

The public Commander index uses the **2026-10-16** MTGJSON price snapshot: 13,323 printings total, 13,061 resolved USD quotes, and 262 unresolved. TCGplayer USD is preferred and Card Kingdom USD is the fallback; Cardmarket EUR is excluded from USD coverage. This is a current indexed lookup as of the stated snapshot, not a promise of live retailer price or stock ([market-data-lineage.md](../docs/market-data-lineage.md)).

Prediction records are unresolved until an exact printing has a post-entry observation and reaches its evaluation date. The October audit recorded no matured predictions. The October 17 simulation used 72 historical 14-day windows to calibrate range behavior; it found a narrower, more precise but less conservative interval model. That is a simulation/backtest finding, not evidence that the current October theses have succeeded or failed ([prediction-accuracy-audit-2026-10-16.md](../docs/prediction-accuracy-audit-2026-10-16.md), [prediction-range-simulation-2026-10-17.md](../docs/prediction-range-simulation-2026-10-17.md)).

## Approved current UX release rationale

The approved review is based on baseline commit **`d49e74e`**. It is a release candidate review, not a deployment announcement. The approved UX change makes market research readable inside the journal without turning an article into a dashboard:

1. **Reusable full-card/full-height market embeds.** A market mention can show a representative full card, preserve the article context, and expose research links without rewriting the source paragraph.
2. **Full-width mobile behavior.** On narrow screens the embed fills the available article width; from 640px upward it becomes a two-column card-and-context layout. The card image uses `object-fit: contain`, so the card is not cropped.
3. **Zoom and internal navigation.** The image preview remains tappable/enlargeable, while the details link to the internal card profile, dated market history, and alternate printings. A Scryfall verification link remains external.
4. **Primary retailer CTAs.** The physical-card action is clearly **Buy on TCGplayer** and **Buy on Card Kingdom**. These are name searches, not carts, checkout, or live-price guarantees.
5. **Surface-specific visual hierarchy.** Battle Box keeps an art-only index; Brawlternative keeps the primary commander and readable Oracle index; deck detail stays the complete inspection/export surface.
6. **Trust-preserving article rendering.** Historical source dates remain attached to embeds, historical reports remain separate from current lookup data, and invalid/unsafe embed payloads fall back to ordinary text instead of accepting URLs or scripts.

### Quick embed syntax from the implementation

Authors can add a fenced `mtg-card` block to a market article. The JSON parser accepts a required card name and optional validated `setCode`, ISO `sourceDate`, and short `kicker`; it accepts no URL or script field ([MarketPostMarkdown.tsx](../client/src/components/MarketPostMarkdown.tsx)).

````md
```mtg-card
{"name":"Rhystic Study","setCode":"cmm","sourceDate":"2026-10-16","kicker":"Historical card spotlight"}
```
````

The equivalent JSX shortcut is:

```tsx
<MarketPostCard name="Rhystic Study" sourceDate="2026-10-16" />
```

The actual implementation builds internal links as `/card/<name>#market-history` and `/card/<name>#printings`, and retailer searches at TCGplayer and Card Kingdom ([MarketPostCard.tsx](../client/src/components/MarketPostCard.tsx)). The source date is rendered as historical context, not a live quote.

## Release and test decision

The October 18, 2026 release rerun passed **372 tests across 91 test files**, the TypeScript check (`pnpm check`), and the production build (`pnpm build`). The reviewed UX baseline is `d49e74e`. The build retained a non-blocking chunk-size advisory; it did not fail a release gate.

The approved release decision is to commit only this public history and the reviewed UX changes, push to `main` without rewriting remote history, and publish the same commit to the two existing MTG Tracker production projects. Phantasy Codex is excluded. Production deployment readiness and representative page checks must be verified separately after the push; passing local checks alone is not deployment evidence.

The decision standard is intentionally conservative: rerun the approved test/type/build set before release, retain historical/source-date labels, keep public and private data paths separate, and do not replace unresolved evidence with a polished but stronger claim. Previously published historical dates and source caveats are preserved.

## Public source index

- [README](../README.md) — original product scope, architecture, and public data sources.
- [Design philosophy](../ideas.md) — hard-edge, card-centric, chronological visual rationale.
- [CHANGELOG](../CHANGELOG.md) — dated release and test history.
- [Market data lineage](../docs/market-data-lineage.md) — provenance, dates, coverage, and separation rules.
- [Market report inventory](../docs/market-report-inventory.md) — verified report dates, windows, and source boundaries.
- [October 16 market research](../docs/market-research-2026-10-16.md) — public market and announcement sources.
- [Brawlternative completion review](../docs/brawlternative-completion-review.md) — proposed-list rationale and exact format caveats.
- [Deck export review](../docs/deck-export-review.md) — copy/download, platform, shopping, and verification boundaries.
- [Prediction accuracy audit](../docs/prediction-accuracy-audit-2026-10-16.md) and [range simulation](../docs/prediction-range-simulation-2026-10-17.md) — unresolved prediction and simulation distinctions.
