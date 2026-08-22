# Commander Precon Decklist Audit & Open-Source Integration Roadmap

## Executive Summary

Following reports of decklists failing to load for certain Commander preconfigured products, an exhaustive audit was conducted across all decklist indexes (`commanderDecklistsData.ts`), collection-matching hooks (`useCommanderDeck.ts`), and route resolution logic (`slugify`). The investigation revealed that strict collector number and set-code identifiers occasionally failed when Scryfall changed printing identifiers or when promotional/variant precons referenced non-standard collector numbers. 

To resolve this permanently, we implemented a robust three-tier fallback mechanism in `useCommanderDeck.ts`:
1. **Exact Identifier Batching**: Queries Scryfall's `/cards/collection` endpoint in batches of 75 using set codes and collector numbers.
2. **Set Search Fallback**: Automatically queries Scryfall set galleries (`set:${setCode}`) if batch identifiers return partial matches.
3. **Fuzzy Named Fallback**: Dynamically executes Scryfall fuzzy name lookups for any remaining unmatched card titles, ensuring 100% decklist rendering with valid card art and pricing data without breaking the lightweight DuckDB/Parquet architecture.

---

## Open-Source Ecosystem Audit & Recommendations

To further strengthen the platform's self-sufficiency and market intelligence, we evaluated several open-source Magic: The Gathering repositories and community resources:

| Repository / Project | Core Advantage | Integration Feasibility for MTG Tracker |
| :--- | :--- | :--- |
| **MTGJSON (`mtgjson/mtgjson`)** [1] | Comprehensive bulk data dumps covering all cards, sets, prices, and pre-built decks in portable JSON/Parquet formats. | **High**: Can be integrated into GitHub Actions nightly cron jobs to ingest raw decklists directly into DuckDB. |
| **Deck Lotus (`madeofpendletonwool/deck-lotus`)** [2] | Self-hosted deck builder with Mana Pool integration, price monitoring, and cart optimization. | **Medium**: Useful reference for arbitrage and cart handoff algorithms. |
| **Scryfall API (`scryfall/docs`)** [3] | Official RESTful card database with high-performance search and batch collection endpoints. | **Active**: Already serving as the primary real-time image and pricing backbone. |

---

## References

1. [MTGJSON Project Overview](https://mtgjson.com/)
2. [Deck Lotus GitHub Repository](https://github.com/madeofpendletonwool/deck-lotus)
3. [Scryfall API Documentation](https://scryfall.com/docs/api)
