# Morning Daily Movers Refresh investigation

The latest failed workflow run is [32949821549](https://github.com/krisaguero/MtgTracker-manus/actions/runs/32949821549), created 2026-08-26 at 08:50 UTC on `main`. The failing job stops inside `pnpm/action-setup@v4` before dependency installation or `scripts/daily-market-movers.mjs` runs.

The runner log reports a version conflict: the workflow requests `version: 10`, while `package.json` declares a hashed `packageManager` pin for `pnpm@10.4.1`. The action says both versions are declared and advises removing one to avoid `ERR_PNPM_BAD_PM_VERSION`. The repository’s weekly Scryfall workflow already uses `version: 10.4.1`; the morning refresh and publication-safety workflows used `version: 10`.

The morning workflow is `.github/workflows/daily-movers-morning-refresh.yml`, scheduled for `0 8 * * *` UTC, and runs `pnpm install --frozen-lockfile` followed by `node scripts/daily-market-movers.mjs`. Its generated artifacts are `client/src/data/dailyMarketSnapshot.json`, `data/market/daily`, and `data/market/daily-movers-history.json`.

The current GitHub PR is [PR #1](https://github.com/krisaguero/MtgTracker-manus/pull/1), branch `fix/pnpm-lockfile-wouter-vercel`, with latest remote commit `2ec7ee0`. The active WebDev preview before this task was `https://mtg-tracker-manus-current-d007dt83u-toferais-projects.vercel.app/`; the final verified API responses there were HTTP 200 for `/api/trpc/auth.me` and `/api/trpc/market.getMovers`.
