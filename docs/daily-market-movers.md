# Daily Market Movers Job

The repository includes a headless daily market job at `scripts/daily-market-movers.mjs`. It uses public MTGJSON set payloads to obtain paper-price observations for the Commander decklist and market-matrix watch universe. It uses Scryfall only for stable card-image URLs; it does not scrape retail pages.

## Outputs

| Output | Purpose |
| --- | --- |
| `client/src/data/dailyMarketSnapshot.json` | Latest normalized signals consumable by the front end. |
| `data/market/daily/YYYY-MM-DD.json` | Immutable daily market report archive. |
| `data/market/daily-movers-history.json` | Rolling 30-day price-baseline history used to calculate daily changes. |

## Signal Rules

The first successful run establishes a pricing baseline with zero movement. Subsequent runs compare the same card-printing price against the prior stored daily snapshot. The script retains the actual price sources returned by MTGJSON and never invents prices for a missing provider.

## Running Locally

```bash
node scripts/daily-market-movers.mjs
```

The script is designed for scheduled repository automation and exits nonzero if it cannot collect any priced cards, preventing an empty snapshot from replacing a valid previous result.

## Sources

MTGJSON provides downloadable card, deck, and historical price data, including current and 90-day price datasets. Scryfall provides daily card-data exports and card imagery, but its own documentation cautions that bulk pricing is appropriate for trend tracking and general valuation rather than storefront-grade real-time pricing. [1] [2]

## Optional Commercial Sources

TCGplayer can be added only when existing developer credentials are available. Its documentation states that new API access is no longer being issued. Do not place credentials in source files; use repository secrets instead. [3]

## References

[1]: https://mtgjson.com/downloads/all-files/ "MTGJSON — All Files"
[2]: https://scryfall.com/docs/api/bulk-data "Scryfall — Bulk Data Files"
[3]: https://docs.tcgplayer.com/docs/getting-started "TCGplayer — Getting Started"
