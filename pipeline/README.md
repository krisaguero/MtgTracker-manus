# MTGJSON & DuckDB Data Pipeline · Implementation & Query Pack

This directory contains the automated data ingestion pipeline and analytical SQL query pack for the **MTG Set Tracker and Discovery Hub**.

---

## 1. Architecture Overview

```
[ MTGJSON CDN / Scryfall API ] 
         │ (Weekly GitHub Actions Cron)
         ▼
[ pipeline/ingest.py ] 
         │ (Parses & Loads Delta Data)
         ▼
[ DuckDB Relational Store: data/mtg_market.db ]
         │ 
         ├──► v_daily_movers (7-day trailing spike detector)
         ├──► v_oldschool_spikes (Alpha/Beta/Reserve List liquidity)
         └──► v_land_watchlist (Duals, Fetchlands, Shocklands)
```

---

## 2. GitHub Actions Workflow

The automated cron job runs every Monday at 6:00 UTC (defined in `.github/workflows/mtg-data-pipeline.yml`). It executes `pipeline/ingest.py`, compiles the latest price history into DuckDB and Parquet files, and commits the state back to the repository.

---

## 3. Analytical SQL Query Pack

### A. Detect Daily Old-School Spikes
```sql
SELECT name, set_code, current_price, past_price, pct_change
FROM v_oldschool_spikes
ORDER BY pct_change DESC
LIMIT 25;
```

### B. Land Watchlist Spread & Liquidity
```sql
SELECT land_category, name, current_price, pct_change
FROM v_land_watchlist
ORDER BY current_price DESC;
```

## Recent price history for table sparklines

The ingestion step preserves every dated observation in `price_history`. The Parquet projections add a `recent_prices` JSON array ordered from oldest to newest for each mover row. The tRPC market router parses that field into `recent_prices: number[]`, and the frontend renders a multi-point inline SVG sparkline when at least three observations are available. Rows with fewer than three observations show a neutral `History pending` fallback rather than implying a trend from insufficient data. Future scheduled runs accumulate additional dated observations automatically.
