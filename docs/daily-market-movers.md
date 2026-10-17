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

## Public snapshot labeling (2026-10-16)

The public UI keeps these datasets distinct: the displayed user-provided CSV has 250 rows dated 2026-08-25; the MTGJSON research sample contains nine printings dated 2026-10-15; the daily source-signal snapshot contains 14 records with observation dates from 2026-10-08 through 2026-10-16; and the Commander price index is the MTGJSON AllPricesToday snapshot dated 2026-10-16, with USD coverage counts shown separately. A file-generation timestamp is not used as a substitute for each market observation date.

The legacy morning report is paused because its prior generator re-dated embedded sample movements and created unsupported sentiment/percentage claims. Empty source feeds now yield no canonical mover rows. Existing browser-local archive data is neither cleared nor rewritten; personal collection and scan data are not part of the public market snapshot.


### Separate historical research reports

- The **October 5** report uses a stated approximate September 19–October 1 data window and keeps its ten source categories and citations. Its Top 10 high-profile watcher list is selected from historical price-signal categories; each item carries its own source window and verification caveat. Repeated mentions are not unique-card counts.
- The **October 11** report is dated, with visible price/Interests/Weekly Winners evidence through October 10. It is not a 250-mover feed: prior-day price/move verification is incomplete, category entries may repeat cards/printings, and market observations are kept separate from format and spoiler signals. Prompt/template references are labeled as workflow-only, with their text and URLs omitted.
- The October 11 page shows only the **eight** distinct source-reported multi-day price-watch signals in the report; catalyst-only and metagame-only candidates are not added to reach ten.
- The **October 15 30-signal brief** is a separate catalyst/metagame research report, not 30 verified price movers. It is not the same dataset as the nine-printing MTGJSON sample dated October 15.
- The **October 16 Notion capture** is a separate static, read-only snapshot. The archive does not write to Notion or merge its records with the October 5, October 11, or October 15 report.
- These report archives are historical editorial records, not inputs to the current price index, current quote labels, or canonical mover counts.
