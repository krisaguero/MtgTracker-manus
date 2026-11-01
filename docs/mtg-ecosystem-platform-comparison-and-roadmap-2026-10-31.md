# MTG Ecosystem Platform Comparison and Product Roadmap

**Research date:** 2026-10-31

The existing MTG ecosystem is strong, but fragmented. Different platforms are best at recommendations, deck construction, scanning, inventory capture, marketplace purchasing, or card metadata. The clearest opportunity for this tracker is to become the layer that connects those workflows around actual ownership and decisions.

## What the major platforms already do well

### EDHREC — Commander discovery and recommendations

[EDHREC](https://edhrec.com) is strongest for Commander discovery, ranked commanders, popularity-versus-synergy analysis, role-based recommendations, precon upgrade guides, and quick clipboard/export workflows. Its documented model aggregates Commander decklists from sources such as Archidekt, Moxfield, and Scryfall, then presents statistical recommendations by commander, theme, color identity, set, card role, and synergy. [EDHREC’s FAQ](https://edhrec.com/faq) does not document a personal inventory ledger, card scanning, exact-printing ownership, condition tracking, acquisition history, or collection valuation workflow.

Your opportunity is to make recommendations ownership-aware. The tracker should distinguish “already owned,” “in another deck,” “inside an unopened precon,” “missing,” and “candidate recommendation.” It should also preserve the source, timestamp, legality state, printing assumptions, and price provenance behind each recommendation.

### Moxfield — modern deckbuilding and sharing

[Moxfield](https://www.moxfield.com) is strongest for modern deck presentation, Commander and precon discovery, deck statistics, public deck URLs, card/package exploration, and a first-class collection route. Its public deck pages make it easy to inspect a list, commander, format, mana statistics, and purchase-oriented information. [Moxfield’s help area](https://moxfield.com/help) does not establish a native camera scanner, acquisition ledger, location tracking, condition-aware valuation, or a complete physical-card transfer system.

The tracker should interoperate with Moxfield-style text and CSV workflows while specializing in the physical question Moxfield does not clearly solve: which copy should be assigned to which deck, and what happens to the source deck when that copy moves?

### Archidekt — flexible deck construction and collection import

[Archidekt](https://archidekt.com) is strongest for visual, text, and spreadsheet-style deck views; custom categories; Commander recommendations; collection import; printing optimization; vendor/cart export; playtesting; and collaborative deck editing. Its [FAQ](https://archidekt.com/faq) documents import and collection workflows, but I found no official confirmation of a built-in camera/OCR scanner, a universal import schema, or a research-grade price-history ledger.

The tracker can learn from its flexibility without copying the interface. A strong addition would be saved inventory filters such as “unallocated blue cards,” “owned but not in a deck,” “cards inside sealed products,” “trade candidates,” and “missing from Fantastic Four.”

### ManaBox — mobile collection, deck, and import workflow

[ManaBox](https://www.manabox.app) is the closest adjacent product to your collection work. It documents offline card search, camera scanning, collection and binder management, deckbuilding, deck simulation, Commander recommendations, preconstructed-deck discovery, deck registration, text/CSV import and export, and marketplace-linked sharing. Its [collection import guide](https://www.manabox.app/guides/collection/import-export/) documents quantity, foil, card number, language, condition, purchase price, currency, and Scryfall ID fields.

The key design lesson is to keep theoretical decklists, physical inventory, binders, and registered decks distinct. Your tracker can improve on this by also separating sealed precon ownership from opened card inventory and by recording reversible transfer events instead of merely changing a deck’s list.

### Dragon Shield MTG Scanner — fast physical intake

[Dragon Shield MTG Scanner](https://www.dragonshield.com/en-us/mtg-scanner) is strongest for camera-based intake, collection management, print-level card detail, Wishlist and Trade workflows, and marketplace-linked value views. Its [FAQ](https://www.dragonshield.com/pages/faqs) explicitly treats Inventory and Decks as separate, and notes that foil cards can be harder to scan and may require manual search.

Your opportunity is to add a correction queue. A scan should not silently become ownership. It should show the recognized name, set, collector number, finish, language, condition, and confidence, then require confirmation when the print is ambiguous. A precon should be able to produce expected cards, while scans should reconcile against that expected list.

### Delver Lens — scanner ecosystem and interoperability

[Delver Lens](https://www.delverlab.com) is strongest for Android-first camera intake, offline collection organization, deck/list/want workflows, price history, backup, and broad export compatibility. Its official product materials describe exports to many deck and collection services, including Archidekt, DeckStats, DeckBox, Moxfield, TappedOut, and others.

The lesson is portability. Your app should accept scanner exports and text lists from several ecosystems, show what parsed successfully, and clearly identify records that lost printing or quantity metadata. A user should be able to recover from a bad import without manually rebuilding a collection.

### TCGplayer — marketplace procurement and cart optimization

[TCGplayer](https://www.tcgplayer.com) is strongest for singles and sealed-product discovery, editorial Commander/precon guides, mobile scanning-to-list workflows, Mass Entry, list sharing, and seller/cart optimization. Its [scanning documentation](https://help.tcgplayer.com/hc/en-us/articles/23531246396183-How-to-Setup-and-Use-the-TCGplayer-App-for-Card-Scanning) covers quantity, set, foil, condition, language, and CSV export. Its [Cart Optimizer documentation](https://help.tcgplayer.com/hc/en-us/articles/201769673-How-does-the-Cart-Optimizer-work) covers seller, printing, condition, package count, and price preferences for singles.

The tracker should come before the marketplace cart. First calculate whether the card is already owned, available as a duplicate, inside a sealed precon, or recoverable from an inactive deck. Only then generate marketplace links or a purchase plan. The tracker should not treat a marketplace estimate as accounting truth.

### Scryfall — canonical card and printing metadata

[Scryfall](https://scryfall.com) is the strongest metadata and search layer. Its syntax supports Commander legality, color identity, partner status, EDHREC rank, product/set filters, printings, rarity, language, and price ranges. Its [card API](https://scryfall.com/docs/api/cards), [collection endpoint](https://scryfall.com/docs/api/cards/collection), and [rate-limit guidance](https://scryfall.com/docs/api/rate-limits) make it a valuable enrichment source.

Scryfall is not a personal inventory ledger, scanner, sealed-product accounting system, transaction history, or guaranteed live valuation service. The tracker should use Scryfall IDs, oracle IDs, set codes, collector numbers, images, legalities, and print metadata, then add the ownership, acquisition, condition, location, transfer, and audit layers itself. It must also respect Scryfall’s rate limits, attribution, image-use, no-paywall, and no-repackaging expectations.

## The strategic gap

The major platforms divide into five groups:

- **Recommendation:** EDHREC.
- **Deckbuilding and sharing:** Moxfield and Archidekt.
- **Mobile inventory and scanning:** ManaBox, Dragon Shield, and Delver Lens.
- **Marketplace procurement:** TCGplayer.
- **Card metadata:** Scryfall.

None of the verified products combines all of the following in one explainable workflow:

1. sealed precon ownership and cost basis;
2. opened-card inventory from scans;
3. exact-printing and condition-aware identity;
4. owned-aware Commander recommendations;
5. deck-to-deck transfer optimization;
6. market research with source, timestamp, confidence, and prediction history;
7. progressive disclosure that keeps the first screen readable.

That is the product position I would protect.

## Ranked product ideas

### 1. Sealed Precon-to-Collection Ownership Graph

Model a precon as a product that can be sealed, opened, partially inventoried, fully reconciled, or altered. When opened, create expected quantities and compare them against scans. Preserve missing, extra, damaged, substituted, and unresolved cards. This is the single clearest differentiator from ordinary decklists and scanners.

### 2. Exact-Printing Resolution and Confidence Queue

Every inventory and price decision should resolve, when possible, to card name, set, collector number, Scryfall ID, finish, language, condition, and quantity. Ambiguous scans and name-only imports should enter a review queue rather than silently becoming the wrong printing.

### 3. Owned-Aware Commander and Precon Upgrade Planner

Combine EDHREC-style recommendations with confirmed ownership, sealed-precon contents, legality, budget, and exact printing. Show incremental cost instead of replacement cost. This is especially useful for Invisible Woman: “already owned,” “available from Avengers Assemble,” “inside unopened product,” and “buy next” are materially different actions.

### 4. Physical Card Transfer Optimizer

Treat collection, decks, sealed products, binder, trade, sale, and wantlist as allocation states. Optimize transfers while protecting completed decks and only copies. Record every move as reversible history. The Simic/Dimir optimizer recently added to the project is the first slice of this system.

### 5. Research-Grade Market and Decision Audit Trail

Record the source, timestamp, currency, exact printing, finish, condition assumption, freshness, and confidence for every price or recommendation. Keep market estimate, replacement cost, acquisition cost, and collection value as separate numbers. Add an evidence bundle for each daily report and prediction review.

### 6. Progressive-Disclosure Inventory Workspace

The first view should answer: owned, missing, sealed, scanned, allocated, and next action. Expanding a row can reveal printing, condition, location, acquisition cost, price source, confidence, and transfer history. This gives casual users a simple app without sacrificing the accounting depth you want.

### 7. Scanner-Agnostic Intake Hub

Accept ManaBox, Dragon Shield, Delver Lens, TCGplayer, MTGA-style text, CSV, and generic decklists. Normalize them into one schema, show parsed/resolved/ambiguous/rejected counts, and preserve the original import. Native scanning can remain optional until the review workflow is proven.

### 8. Precon Upgrade and Substitution Ledger

Version an upgrade plan against a specific precon release and inventory snapshot. Track cards added, removed, borrowed, substituted, purchased, or returned. This makes an upgrade guide durable instead of turning it into a static article that ignores what the user already owns.

### 9. Transfer-First Procurement Planner

Before opening TCGplayer or another marketplace, compute internal availability, duplicate copies, sealed-precon availability, inactive-deck copies, and true external gaps. Then show seller, condition, printing, shipping/package, and price-source assumptions. The marketplace link becomes the final step rather than the first recommendation.

### 10. Portable Privacy-Aware Sharing

Create read-only links for decklists, precon ownership, missing-card lists, collection slices, and research snapshots. Let the owner hide quantities, locations, acquisition costs, or valuation. Include JSON, CSV, and text exports so users can leave without losing their data.

### 11. Three-Ledger Portfolio Views

Show three numbers separately: estimated current collection value, deck/precon replacement cost, and acquisition cost. Filter by sealed/opened, allocated/unallocated, exact/resolved, and owned/unresolved. This prevents marketplace estimates from being mistaken for a financial ledger.

### 12. Import Health and Interoperability Test Harness

Give users a migration report showing parsed, resolved, ambiguous, rejected, duplicate, and metadata-lost records for every supported import. This is a practical trust feature and a good way to differentiate from apps that simply report “import complete.”

## What I would build next

I would not build another generic deck editor first. I would build the **Precon Ownership Graph**, then connect it to the **Transfer Optimizer**, then add the **Owned-Aware Upgrade Planner**. Those three pieces reinforce the work already present in your tracker and create a distinct loop:

> acquire precon → open or keep sealed → reconcile cards → identify overlap → allocate cards → upgrade a deck → record cost and result → learn from the next recommendation.

The market-research system should sit across that loop, not beside it. A card signal should be able to say whether the user owns it, whether it is trapped inside a sealed precon, whether it belongs to a deck already, whether a reprint is likely, and whether the recommendation is based on a confirmed price move or only a Commander-demand signal.

## References

[1]: https://edhrec.com "EDHREC"
[2]: https://edhrec.com/faq "EDHREC FAQ"
[3]: https://moxfield.com "Moxfield"
[4]: https://moxfield.com/help "Moxfield Help"
[5]: https://archidekt.com "Archidekt"
[6]: https://archidekt.com/faq "Archidekt FAQ"
[7]: https://www.manabox.app "ManaBox"
[8]: https://www.manabox.app/guides/collection/import-export/ "ManaBox collection import and export"
[9]: https://www.dragonshield.com/en-us/mtg-scanner "Dragon Shield MTG Scanner"
[10]: https://www.dragonshield.com/pages/faqs "Dragon Shield FAQ"
[11]: https://www.delverlab.com "Delver Lens"
[12]: https://www.tcgplayer.com "TCGplayer"
[13]: https://help.tcgplayer.com/hc/en-us/articles/23531246396183-How-to-Setup-and-Use-the-TCGplayer-App-for-Card-Scanning "TCGplayer card scanning"
[14]: https://help.tcgplayer.com/hc/en-us/articles/201769673-How-does-the-Cart-Optimizer-work "TCGplayer Cart Optimizer"
[15]: https://scryfall.com "Scryfall"
[16]: https://scryfall.com/docs/api/cards "Scryfall card API"
[17]: https://scryfall.com/docs/api/cards/collection "Scryfall collection endpoint"
[18]: https://scryfall.com/docs/api/rate-limits "Scryfall API rate limits"
