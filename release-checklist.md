# Final Release Checklist

## Validation completed on 2026-08-22

| Area | Result | Evidence |
| --- | --- | --- |
| TypeScript | Passed | `pnpm check` completed without errors. |
| Unit tests | Passed | 28 Vitest files and 64 tests passed. |
| Production build | Passed | `pnpm build` completed; Vite client and bundled server output generated. |
| Set detail route | Passed | `/eoc` hydrated with 191 indexed cards, 176 Commander cards, 367 combined cards, 2 associated precons, and the supplied market-watch section. |
| Card detail route | Passed | `/card/World%20Shaper` hydrated with a complete 744x1040 Scryfall PNG, object-contain rendering, supplied market-watch references, and article linkage. |
| Commander archive | Passed | `/precons` hydrated with 173 decks and a visible full-product valuation matrix. |
| Commander deck route | Passed | `/deck/msc/avengers-assemble` rendered the official 100-card list, Captain America, Team Leader, `$78.55` indexed singles equity, and 100% priced-card coverage. A clean browser load produced zero errors and zero warnings after the local-first hydration fix. |
| Market provenance | Passed | Current card and Commander values resolve through the indexed snapshot utilities; unavailable sealed MSRP remains explicitly unavailable rather than inferred. |
| Diagnostic cleanup | Passed | Removed `scripts/debug-scryfall-collection.mjs` and `scripts/import-mtgjson-commander-decks.mjs`; retained scheduled and price-refresh scripts. |
| Credential safety | Passed | Existing publication-safety test passes and `.project-config.json` remains excluded from the tracked publication tree. |

## Release actions still required

| Action | Status | Notes |
| --- | --- | --- |
| Save final managed checkpoint | Pending | Saving publishes automatically for this project. |
| Synchronize the sanitized repository to GitHub | Pending | Use the configured `krisaguero/MtgTracker-manus` repository and preserve the existing backup branch until the sanitized main state is verified. |
| Record published version and GitHub commit SHA | Pending | Add both identifiers to this checklist after the checkpoint and push. |

The market-watch rows shown in the application are sourced from the imported project matrix and linked to their supporting article or source URL. They are not a replacement for live vendor verification, and any card or sealed product with no current price remains labeled as unavailable.
