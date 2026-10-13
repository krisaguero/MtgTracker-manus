# Marketplace links and prediction ledger

## Marketplace links

Commander precon cards and detail pages now expose Amazon, TCGplayer, Card Kingdom, and eBay search links. Precons whose release date is in the future receive a `Preorder watch` label.

Amazon links are ordinary search links unless the deployment defines:

```text
VITE_AMAZON_ASSOCIATE_TAG=your-associate-tag
```

When that value is present, the Amazon link receives the `tag` query parameter and is marked `rel="sponsored"`. No affiliate identifier is hard-coded or guessed. TCGplayer, Card Kingdom, and eBay links are not presented as affiliate links.

## Prediction ledger

`data/market/prediction-ledger.json` is append-only in normal operation and is committed by the daily GitHub workflow. Each record stores:

- The exact prompt used for the pick
- Set code and collector number when available
- Entry price and action
- A 14-day directional range
- Model label and confidence
- Evaluation date
- Later exact-printing outcome when the same identity reappears

The current generator deliberately labels the forecast as a **rule-based momentum screen; not a verified AI forecast**. This keeps the history honest until a real AI research pass supplies cited evidence. Outcomes are only scored when the same printing can be matched; missing exact-printing data is marked unresolved rather than counted as a hit or miss.
