# Market report inventory

**Scope:** read-only inventory of the Notion `market watch database / Daily Reports` data source, cross-checked against the repository's dated market briefs and static snapshot. No Notion writes, publication, deployment, or app/blog edits were performed.

## Verified Notion Daily Reports inventory

The `Daily Reports` database was fetched and its data source was queried with SQL, then cross-checked with the `Report Archive` view in both active and archived partitions. The data source is `collection://784d9370-463b-43db-a913-f15e49d4dcf3`. The active query returned two rows; the archived view returned zero rows; pagination reported `has_more: false` in both cases.

**Exhaustive result: 2 posted rows, covering 2 report dates.**

| Report date | Exact title | Linked Notion page | Created | Data window | Status / regime | Publisher | Record count | Initialization | Linked records |
|---|---|---|---|---|---|---|---:|---|---|
| 2026-10-15 | MTG Market Movers — 2026-10-15 | [Notion page](https://app.notion.com/p/3fb01b50a800819683e0dea6245cbeeb) | 2026-10-16 18:56:47Z | Prior trading day; public pricing visible through 2026-10-14 | Spoiler-Driven; Commander-Driven, Spoiler-Driven, Precon-Driven, Reprint-Driven | Perplexity | 6 | Yes | 6 Card Signals; 6 Prediction Reviews; no Announcements |
| 2026-10-16 | MTG Market Movers — 2026-10-16 | [Notion page](https://app.notion.com/p/3fb01b50a800813d96d7ef31ee1a7949) | 2026-10-16 19:22:16Z | Public market and official announcement evidence visible through 2026-10-16 | Precon-Driven; Commander-Driven, Tournament-Driven, Precon-Driven, Collector-Driven | Perplexity | 5 | No | 5 Card Signals; 3 Announcements; 5 Prediction Reviews |

The row URLs returned by the data-source query are the same pages without the optional `?pvs=204` suffix:

- `https://app.notion.com/3fb01b50a800819683e0dea6245cbeeb`
- `https://app.notion.com/3fb01b50a800813d96d7ef31ee1a7949`

Both pages were fetched individually. Neither page reported truncation, unknown blocks, or omitted content. Their database `Report Body` property is empty, but the substantive article is present in page content. The 2026-10-15 page is explicitly an initialization-period signal brief, not a verified Top-250/24-hour feed. The 2026-10-16 page contains the Reality Fracture, Commander-demand, and Wizards product/supply analysis and preserves the source disagreement and verification caveats.

## Repository chronology versus actual Notion posts

The repository contains four dated market-brief routes/files, but only two of those dates are actual rows in the Notion `Daily Reports` data source:

| Date | Repository artifact | Notion Daily Reports row? | Coverage / boundary |
|---|---|---|---|
| 2026-10-05 | `client/src/data/marketBriefs/2026-10-05-daily-mtg-market-movers.md` and `october5WatchSignals` | **No** | Historical report with an approximate 2026-09-19–2026-10-01 source window; ten source categories and historical citations. Not a verified daily mover feed. |
| 2026-10-11 | `client/src/data/marketBriefs/2026-10-11-daily-mtg-market-movers.md` and `october11WatchSignals` | **No** | Visible price/Interests/Weekly Winners evidence through 2026-10-10; eight distinct source-reported multi-day price-watch signals. Not a verified 250-card prior-day feed. |
| 2026-10-15 | `client/src/data/marketBriefs/2026-10-15-daily-mtg-market-movers.md` | **Yes** | Matches the fetched Notion initialization-period brief. Keep its historical/source-reported caveats. |
| 2026-10-16 | `client/src/data/marketBriefs/2026-10-16-daily-mtg-market-movers.md` | **Yes** | Matches the fetched Notion report and the static snapshot; public evidence through 2026-10-16. |

Therefore **do not fill the gaps** (October 6–10, October 12–14, or any other date) with invented daily reports. October 5 and October 11 are repository historical research archives, not discoverable rows in the current Notion Daily Reports data source. The local journal dataset `client/src/data/marketJournalReports.json` now contains the two verified Daily Reports articles plus the separately retained September 14 standalone historical page; the standalone entry is included in the journal chronology but is not added to the Daily Reports database count.

## Static snapshot relationship

`client/src/data/notionMarketWatchSnapshot.json` is a separate static read-only capture:

- Captured: `2026-10-17T02:14:17Z`
- Evidence through: `2026-10-16`
- Contains exactly the same two Notion report records (October 15 and October 16), with their metadata and summaries.
- It is not a live feed and does not prove reports for dates absent from the database query.
- It intentionally excludes workspace IDs, relation URLs, collections, scans, order/proxy queues, and BYOK keys.

The local `data/market/daily/2026-10-15.json` nine-printing MTGJSON sample and `client/src/data/dailyMarketSnapshot.json` source-dated signals are separate market-data artifacts. They must not be counted as Notion Daily Reports or merged into the dated article chronology.

## Related historical Notion page outside Daily Reports

A separate page titled [Market movers 9-14-26](https://app.notion.com/p/3dc01b50a80080dda418d5aeccb48266) was found by workspace search and fetched. It is dated **2026-09-14**, but it is not under the `Daily Reports` data source (its ancestor is an untitled page). It is consequently **excluded from the exhaustive Daily Reports count**, while preserved in `client/src/data/marketJournalReports.json` as a standalone journal entry to prevent accidental loss of an older daily research page. Its historical source caveat remains explicit: embedded web-reference markers were not rehydrated into private/workspace links, and the page's price snapshots are not current quotes.

## Local journal dataset

`client/src/data/marketJournalReports.json` contains **3 dated entries**: October 15 and October 16 from the verified `Daily Reports` pages, plus September 14 from the standalone public page. Each entry has `date`, `title`, `summary`, a substantial Markdown `body`, a safe public `sourceUrl`, the source-reported `dataWindow`, and an explicit `caveat`. The journal count is therefore three entries, while the verified Daily Reports database count remains two rows. No workspace IDs, relation URLs, collection URLs, scans, queues, or private references are included in the dataset.

## Evidence and limitations

- Search for `Daily Reports`, exact October 5/11 titles, and `MTG Market Movers` did not surface October 5 or October 11 as Daily Reports rows; search surfaced only the October 15 and October 16 rows under that database.
- The active SQL query and active `Report Archive` view agree on the same two rows; the archived `Report Archive` partition is empty and has no next cursor.
- Notion timestamps are creation/last-edit context, not report-date substitutes. Inventory dates come from the explicit `Report Date` property and page content.
- Reported prices, percentages, volume, liquidity, and completed-sale claims retain each source's confidence level. Do not convert historical windows into current quotes or clean 24-hour moves.
- This document inventories evidence only. It does not claim that a date without a row had no private draft or an unsearchable external copy; it establishes that no such row is present in the accessible Daily Reports data source at query time.
