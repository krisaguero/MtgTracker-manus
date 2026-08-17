# Market and product-art findings

The official Wizards Edge of Eternities Commander decklists page confirms that the products are ready-to-play 100-card Commander decks and provides official product/decklist image-gallery links. The Wizards product page is the preferred provenance for shelf-style packaging references.

The TCGplayer Seller Blog publishes dated price-trend reports based on market-price increases and sales counts. These reports are useful as external research context, but they should be linked as commentary rather than treated as a direct per-card live quote unless the card is explicitly present in the report.

MTGStocks describes itself as a Magic price tracker with price analysis. Its application is JavaScript-rendered, so the tracker should link to it for external chart/context rather than scrape it in the client.

Implementation boundary: observed movement is computed from repeated Scryfall USD snapshots. External MTGStocks, TCGplayer trend, EDHREC, and official Wizards links should be labeled as research context or speculation watch; the UI must not present those links as guaranteed signals or purchase advice.

Sources:
- https://magic.wizards.com/en/products/edge-of-eternities
- https://magic.wizards.com/en/news/announcements/edge-of-eternities-commander-decklists
- https://www.mtgstocks.com/
- https://seller.tcgplayer.com/blog/price-trends-magic-the-gathering-cards-climbing-in-price-03-24-2026
