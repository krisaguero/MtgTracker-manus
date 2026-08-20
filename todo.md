# ManaBox Collection Integration Roadmap

- [ ] Verify ManaBox CSV / text export structure (quantity, name, set, collector number).
- [x] Build a headless daily GitHub market-movers job that ingests MTG price sources, calculates normalized fluctuation signals, and commits a dated machine-readable snapshot.
- [x] Add a scheduled GitHub workflow for the daily market-movers job with a manual-dispatch path, safe idempotent output handling, and documented API source configuration.
- [ ] Validate representative Commander precon decklist and card-detail routes end to end, then repair any route or Scryfall-resolution failures.
- [x] Reconcile homepage recent-set indexing so each set surfaces every related Commander product with a direct decklist or archive route.
- [ ] Add tests for set-to-precon indexing, slug route generation, and daily market snapshot validation.
- [ ] Build local collection storage and parser supporting ManaBox exports.
- [ ] Build owned-card matching logic for set cards and Commander decklists.
- [ ] Build deck completion guidance UI showing owned percentage and missing cards.
- [x] Verify build health, responsiveness, and save checkpoint.
- [ ] Highlight owned Commander decklist cards with green checkmarks and make missing cards stand out.
- [ ] Add missing-card shopping list and retailer batch export formats.
- [ ] Add collection equity totals across sets.
- [ ] Add Commander deck recommendations ranked by owned-card coverage percentage.
- [ ] Add historical collection-value line chart and snapshot persistence to CollectionOverview.
- [ ] Add CSV and plain-text download buttons to the missing card shopping list.
- [ ] Add exclude-basic-lands toggle to missing-card shopping list and all export formats.
- [ ] Show estimated missing-card acquisition cost on Commander completion summaries.
- [ ] Add hover/focus tooltip with individual missing-card prices to completion cost tile.
- [ ] Add summary-card toggle to exclude basic lands from estimated completion cost and tooltip.
- [ ] Expand historical Commander precons by a few years.
- [ ] Improve filtering and display tag styling without hovering/obscuring cards.
- [ ] Utilize full page width and provide mobile-friendly image zoom.
- [ ] Add iOS PWA installation reminder banner.
- [ ] Compact the global home header and the Commander/set catalog headers to increase above-the-fold content density.
- [ ] Verify desktop and mobile header height, build health, and save a checkpoint.
- [ ] Add a sticky set-page anchor bar for overview, precons, market signals, and card filters.
- [ ] Verify anchor navigation on desktop and mobile, then save a checkpoint.
- [ ] Reduce the sticky anchor bar to a minimal utility strip with tighter controls.
- [ ] Verify the reduced nav height and save a checkpoint.
- [ ] Refine the mobile home hero composition from the supplied screenshot, especially CTA width, branding row, and live-index copy.
- [ ] Verify screenshot-driven mobile and desktop layouts, then save a checkpoint.
- [ ] Remove home hero wording and leave only the logo mark on mobile and desktop.
- [ ] Set the mobile home hero viewport to 70vh and verify responsive behavior.
- [ ] Review the full mobile UI flow for hierarchy, spacing, and interaction issues across home, Commander archive, set detail, and catalog routes.
- [ ] Refine mobile layouts and verify the revised experience before saving a checkpoint.
- [ ] Add a mobile-only collapsible hero toggle with local persistence and accessible state.
- [ ] Verify expanded/collapsed mobile states, desktop behavior, build health, and save a checkpoint.
- [ ] Make recent sets the main homepage content and move collection import/analytics to an internal route.
- [ ] Preserve internal navigation to collection tools and Commander discovery while simplifying mobile hierarchy.
- [ ] Verify homepage, collection route, archive route, responsive behavior, and save a checkpoint.
- [ ] Add locally persisted set favorites with bookmark controls and a homepage saved-only filter.
- [ ] Verify favorite add/remove/filter behavior on mobile and desktop, then save a checkpoint.
- [ ] Build the daily market intelligence report workspace with price-spike momentum, precon-vs-singles break-even math, user-owned coverage adjustments, and source-linked release articles.
- [ ] Implement local storage price alerts and format filters (Commander vs. Standard) on the market report.
- [ ] Add MTGO and Archidekt deck export formats with copy and download controls.
- [ ] Configure weekly market-digest automation and document email-delivery setup.
- [ ] Verify build health, alerts, filters, and exports, then save a checkpoint.
- [ ] Add a local weekly digest delivery log with send status, recipient, subject, refresh, and clear controls.
- [ ] Verify delivery logging and save a checkpoint.
- [ ] Add search, status, and date-window filters to the weekly digest delivery log.
- [ ] Verify filtered dispatch history on responsive layouts and save a checkpoint.
- [ ] Build the Daily Movers & Sentiment Hub with 10 categories of 25 movers each (spikes, penny risers/buyouts, Commander picks, rule-change watchers, Reddit speculations) and a daily market sentiment deep-dive analyzer.
- [ ] Wire the Movers route into navigation and verify build health.
- [ ] Build daily Top 5 mover posts with movement explanations and weekly prediction performance roundups (moved, stalled, reversed).
- [ ] Integrate localStorage price-alert toggles and threshold status into each DailyPost Top 5 mover card.
- [ ] Verify alert toggles on desktop/mobile and save a checkpoint.
- [ ] Add 10-20 week volatility and top-1000 market context badges to all Commander precon deck pages.
- [ ] Add Scryfall card art image thumbnails and visual styling to the Daily Movers page.
- [ ] Build Arena-friendly precon deck variants with legal filtering, substitution tracking, and Arena format export.
- [ ] Rename Arena variants to Arena-Morph with strategy-preserving functional counterpart substitutions and export header metadata.
- [ ] Add an Arena-Morph wildcard cost calculator tracking common, uncommon, rare, and mythic wildcards required for substitution cards.
- [ ] Verify wildcard calculator, build health, and save a checkpoint.
- [ ] Build Dupe-Decks: a Groq-assisted 60-card 1v1 duel deck builder that imports libraries/inventory, detects duplicate coverage, and generates themed deck suggestions.
- [ ] Add a secure Groq API-key input with local persistence and custom theme generation to Dupe-Decks.
- [ ] Verify Dupe-Decks workspace route, Groq custom generation, build health, and save a checkpoint.
- [x] Build a reusable sortable/filterable frontend table for daily movers and old-school spikes, integrate both views, and verify responsiveness.
- [x] Implement real MTGJSON and price-history snapshot ingestion into DuckDB with Parquet views for old-school spikes and land watchlists.
- [x] Connect compiled Parquet market views to public tRPC API procedures, wire Daily Movers to live rows, add fallback behavior, and cover the endpoints with Vitest.
- [x] Add accessible responsive loading skeleton rows to the Parquet-backed market table and verify loading-to-data transitions.
- [x] Add dedicated card-name search inputs above the daily movers and old-school market tables, with accessible filtering and responsive verification.
- [x] Add persistent market card watchlist stars and a dedicated Watchlist tab that integrates with table search, sorting, and filters.
- [x] Add compact accessible price-trend sparklines to daily movers and old-school spike table rows, with loading/watchlist/mobile verification.
- [x] Add real multi-point recent price history arrays to market API rows and render graceful sparkline fallbacks.
- [x] Add regression tests for multi-point trend rendering and insufficient-history fallback.
- [x] Add upward-trend filter toggles above daily movers and old-school tables using ordered sparkline history, with regression and responsive verification.
- [x] Audit and correct Commander precon mappings across sets, adding all four Marvel Commander decks and verifying authoritative product counts.
- [x] Refine set detail precon resolution so parent-set fallback does not duplicate decks across child sets.
- [x] Add regression test verifying Marvel and other sets resolve their correct, non-duplicated Commander precon count.
- [x] Calculate and display the total estimated market value for Marvel Commander decks based on individual card prices, with coverage indicators and verification.
- [x] Surface live aggregated valuations on set-detail precon cards and add end-to-end rendering test coverage.
- [x] Add remembered file-upload support for dual deck inventories in Dupe-Decks with persistent local storage.
- [x] Populate and validate all 10 Daily Movers subcategories with 25 authentic market rows each and clear source labeling.
- [ ] Rewrite publishable Git history to remove exposed AWS and Resend credentials, scan the cleaned snapshot, and push it to krisaguero/MtgTracker-manus.

- [ ] Restore and verify the weekly Resend digest through a server-side endpoint so no client bundle contains an email API credential.

- [ ] Reconcile the sanitized GitHub publication with the managed WebDev checkpoint workflow before the next release.

- [ ] Document credential rotation requirements for any keys previously committed to project history.

- [ ] Add a test that asserts publishable source files contain no hardcoded bearer tokens or cloud access keys.

- [ ] Confirm production email dispatch after secure server-side Resend wiring is complete.

- [ ] Keep the existing backup branch `backup/remote-main-before-latest` until the sanitized main branch is verified.

- [ ] Add a release checklist covering tests, build, secret scan, GitHub push, and deployment confirmation.

- [ ] Review changelog accuracy after the sanitized publication and include the credential-removal note.

- [ ] Verify Vercel/managed production status after the cleaned GitHub push.

- [ ] Consider adding repository secret scanning configuration and a pre-push hook for future prevention.

- [ ] Confirm all scheduled GitHub Actions reference repository secrets rather than inline credentials.

- [ ] Re-run the full MTG decklist and market intelligence test suite after the history cleanup.

- [x] Add a maintainer note explaining that `.project-config.json` remains local-only and is intentionally excluded from public repositories.

- [ ] Preserve the remote pre-cleanup branch for rollback until user confirms deletion.

- [ ] Create a release tag after the cleaned main branch passes all checks.

- [ ] Verify GitHub default-branch protections remain enabled after the force-with-lease publication.

- [ ] Confirm no generated build output or local environment file is included in the sanitized snapshot.

- [ ] Add a future task to replace client-side Resend dispatch with authenticated tRPC/server action.

- [ ] Validate the public repository clone can install dependencies and build without Manus-only metadata.

- [ ] Deliver the cleaned repository URL and commit SHA to the user.

- [ ] Document that any exposed credentials must be rotated at their provider even after Git history rewrite.

- [ ] Review and remove obsolete release notes that mention simulated email dispatch.

- [ ] Add a lightweight CI secret scan to the public repository workflow.

- [ ] Confirm the current app continues to use the managed hosting deployment as the production source of truth.

- [ ] Keep changelog entries dated and aligned with published release commits.

- [ ] Re-check the archive backup branch after main is repointed.

- [ ] Verify no GitHub push-protection unblock links were used for the sanitized publication.

- [ ] Add a contributor guideline prohibiting API keys in client code.

- [ ] Review source maps and bundle output for accidental credential leakage before future releases.

- [ ] Confirm the final public repository contains decklist repair documentation and audit_report.md.

- [ ] Record the sanitized publication result in the next project checkpoint.

- [ ] Remove this temporary cleanup checklist after the release process is complete.

- [ ] Resolve the remaining primary-artwork blank panel on card-detail pages while alternate-printing thumbnails load successfully.
