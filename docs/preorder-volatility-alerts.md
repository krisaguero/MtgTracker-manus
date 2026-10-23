# Star Trek and Mystery Booster Commander Preorder Volatility Alerts

The repository now has a guarded daily alert rule for high-risk Q4 preorder coverage. It evaluates daily market snapshots for:

- Star Trek main-set records: `TRK`
- Star Trek Commander records: `TRC`
- Mystery Booster Commander records: `MBC`
- Name matches for `Star Trek` and `Mystery Booster Commander` when a future upstream feed uses a different set code

The detector is implemented in `scripts/build-preorder-volatility-alert.mjs` and can be run locally with:

```bash
pnpm market:preorder-volatility
```

It writes `data/market/preorder-volatility-alert.json` and intentionally returns `awaiting-coverage` when no matching target prices exist. This is the current expected state until the live price collector begins emitting preorder records for these products; it does not fabricate alerts from release-calendar dates alone.

## Thresholds

An alert is emitted when any target record crosses one of these conditions:

- Absolute one-day move of at least **8%**;
- Absolute seven-day move of at least **15%**;
- Marketplace spread of at least **12%** between the available TCGplayer Market and Card Kingdom prices.

The report also records the release date, whether the latest observation is still inside the preorder window, exact collector number when available, source count, and the evidence dates used for comparison.

## Daily GitHub Action

`.github/workflows/preorder-volatility-alert-daily.yml` runs at **12:30 UTC every day** and can also be dispatched manually. It:

1. Builds and validates the alert report;
2. Runs the focused Vitest regression suite;
3. Opens or updates a review PR only when at least one target alert exists;
4. Optionally sends a compact JSON webhook notification.

Add this repository secret if you want Slack, Discord, or a private relay notification:

```text
PREORDER_VOLATILITY_WEBHOOK_URL
```

The workflow remains successful without the secret and reports that notification delivery was skipped.

## Interpretation boundaries

This rule detects volatility and cross-market disagreement. It does not identify profitable trades, prove demand, or distinguish a temporary supply shortage from durable adoption. Review exact printings, regional Star Trek product delays, preorder inventory, completed sales, and post-release supply before acting.
