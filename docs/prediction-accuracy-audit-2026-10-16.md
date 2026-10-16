# MTG Prediction Accuracy Audit — 2026-10-16

## Result

**No matured prediction can be scored yet.** Historical movement before a prediction opened is excluded.

- History available: **2026-09-09 through 2026-10-08**
- Prediction records: **15**
- Post-entry price records: **0**
- Exact-printing matured records: **0**
- Directional accuracy: **N/A**
- Range containment: **N/A**

## Interpretation

Only records with an exact set code, collector number, post-entry price, and reached evaluation date are scored. Missing prices, unresolved treatments, thin listings, and future review dates remain **UNRESOLVED**. Duplicate canonical keys are tracked once for model scoring and separately as repeated mentions.

## Duplicate canonical keys

- Preeminent Captain|m15|25: 2 mentions
- Counterspell|mh2|267: 2 mentions
- Command Tower|cmd|269: 2 mentions

## References

- Prediction ledger: `data/market/prediction-ledger.json`
- Daily price history: `data/market/daily-movers-history.json`
- Forecast model: `scripts/build-market-research-feed.mjs` (granular-v2 momentum bands)
