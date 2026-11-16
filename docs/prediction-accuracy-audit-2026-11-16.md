# MTG Prediction Accuracy Audit — 2026-11-16

## Result

**116 matured predictions evaluated.** Historical movement before a prediction opened is excluded.

- History available: **2026-10-15 through 2026-11-16**
- Prediction records: **309**
- Post-entry price records: **274**
- Exact-printing matured records: **116**
- Directional accuracy: **21.55%**
- Range containment: **10.34%**

## Interpretation

Only records with an exact set code, collector number, post-entry price, and reached evaluation date are scored. Missing prices, unresolved treatments, thin listings, and future review dates remain **UNRESOLVED**. Duplicate canonical keys are tracked once for model scoring and separately as repeated mentions.

## Duplicate canonical keys

- Grave Peril|c15|128: 2 mentions
- Plains|cm2|285: 2 mentions
- Island|cm2|291: 2 mentions
- Hour of Reckoning|pip|161: 2 mentions
- Woe Strider|soc|231: 2 mentions
- Vile Redeemer|m3c|251: 2 mentions
- Axebane Guardian|tdc|248: 2 mentions
- Morbid Opportunist|soc|219: 2 mentions
- Reality Shift|drc|39: 4 mentions
- Mangara, the Diplomat|tdc|124: 2 mentions
- Gerrard, Weatherlight Hero|c19|41: 2 mentions
- Colossus Hammer|fic|338: 2 mentions
- Swamp|fin|300: 2 mentions
- Mire in Misery|c19|19: 2 mentions
- Frostboil Snarl|drc|158: 2 mentions
- Terminate|msc|189: 2 mentions
- Convert to Slime|dsc|37: 2 mentions
- Myriad Landscape|pip|274: 2 mentions
- Exotic Orchard|blc|131: 3 mentions
- Dispatch|pip|159: 2 mentions
- Island|c15|330: 2 mentions
- Temple of Abandon|blc|338: 2 mentions
- Hour of Reckoning|tdc|120: 2 mentions
- Explore|blc|216: 2 mentions
- Sulfur Falls|drc|173: 2 mentions
- Nightshade Harvester|dsc|150: 2 mentions
- Chaos Warp|fic|291: 2 mentions
- Exotic Orchard|soc|369: 2 mentions
- Talisman of Conviction|pip|243: 2 mentions
- Buried Ruin|pip|254: 2 mentions
- Tomb of the Spirit Dragon|m3c|397: 2 mentions
- Canopy Vista|msc|227: 2 mentions
- Velomachus Lorehold|tdc|309: 2 mentions
- Adarkar Wastes|m3c|316: 2 mentions
- Hinterland Harbor|fic|403: 3 mentions
- Gift of Immortality|soc|147: 2 mentions
- Yavimaya Coast|c19|287: 2 mentions
- Path of Ancestry|lcc|346: 2 mentions
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
