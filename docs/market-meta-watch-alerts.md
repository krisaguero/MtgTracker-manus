# Market and Meta Watch Alerts

The `market-meta-watch-daily.yml` workflow opens or updates a pull request when the repository detects qualifying card price movement, a measured EDHREC Commander shift, or changed representation in the curated Brawl strategy corpus.

## Optional webhook notification

The workflow can send a compact summary to any JSON webhook endpoint after it creates or updates a review pull request. This works with Slack Incoming Webhooks, Discord Webhooks, or a small custom relay.

Add this repository secret in GitHub:

```text
MARKET_META_WEBHOOK_URL
```

GitHub path:

```text
Repository → Settings → Secrets and variables → Actions → New repository secret
```

The payload includes both `text` and `content` fields for compatibility:

```json
{
  "text": "MTG Market/Meta Watch 2026-10-16: price signals: Command Tower 18.6% day / 2% 7d; Commander shifts: none; Brawl corpus: 3 strategy documents.",
  "content": "MTG Market/Meta Watch 2026-10-16: ...",
  "summary": "...",
  "pullRequestUrl": "https://github.com/krisaguero/MtgTracker-manus/pull/123",
  "asOf": "2026-10-16"
}
```

If `MARKET_META_WEBHOOK_URL` is not configured, the workflow succeeds and reports that notifications were skipped. The alert step only runs when a market/meta review pull request was created or updated.

## Email option

GitHub already sends notification emails for pull requests to users who watch the repository or are requested as reviewers. For a separate email destination, point `MARKET_META_WEBHOOK_URL` at a private relay such as an approved automation endpoint that accepts JSON and sends email. Do not commit SMTP credentials or private recipient addresses to the repository.

## Signal boundaries

- Price signals are derived from dated repository snapshots and should be checked against exact printings, liquidity, and completed sales.
- EDHREC records are a past-month demand snapshot. A shift is not calculated until a prior snapshot exists.
- Brawl output is a curated strategy-document proxy, not tournament prevalence, win rate, or a claim about the full platform meta.
