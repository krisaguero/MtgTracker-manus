# MTG Prediction Accuracy Audit — 2026-11-09

## Result

**61 matured predictions evaluated.** Historical movement before a prediction opened is excluded.

- History available: **2026-10-08 through 2026-11-09**
- Prediction records: **174**
- Post-entry price records: **156**
- Exact-printing matured records: **61**
- Directional accuracy: **32.79%**
- Range containment: **9.84%**

## Interpretation

Only records with an exact set code, collector number, post-entry price, and reached evaluation date are scored. Missing prices, unresolved treatments, thin listings, and future review dates remain **UNRESOLVED**. Duplicate canonical keys are tracked once for model scoring and separately as repeated mentions.

## Duplicate canonical keys

- Hinterland Harbor|fic|403: 3 mentions
- Gift of Immortality|soc|147: 2 mentions
- Yavimaya Coast|c19|287: 2 mentions
- Path of Ancestry|lcc|346: 2 mentions
- Reality Shift|drc|39: 2 mentions
- Path of Ancestry|blc|322: 2 mentions
- Goblin Electromancer|tdc|99: 2 mentions
- Pearl-Ear, Imperial Advisor|soc|160: 2 mentions
- Sai, Master Thopterist|drc|82: 2 mentions
- Command Tower|cmd|269: 3 mentions
- Preeminent Captain|m15|25: 2 mentions
- Counterspell|mh2|267: 2 mentions

## References

- Prediction ledger: `data/market/prediction-ledger.json`
- Daily price history: `data/market/daily-movers-history.json`
- Forecast model: `scripts/build-market-research-feed.mjs` (granular-v2 momentum bands)
