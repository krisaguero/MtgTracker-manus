# Visual audit findings

- The Edge of Eternities route (`/eoc`) hydrates successfully and displays the supplied market-watch section with an August 2026 as-of label. Its view-mode bar reports 191 main-set cards, 176 Commander precon cards, and 367 combined cards; the page reports 2 associated Commander precons.
- The Lost Caverns of Ixalan route (`/lci`) hydrates successfully and reports 416 main-set cards plus 4 associated Commander precons. Its Commander attachment panel is present; it has no supplied matrix note because the imported market-signal dataset currently maps its supplied rows to `eoc` and `mh3`.
- The World Shaper card route hydrates successfully. The finance panel contains the canonical-mover empty state plus the supplied market-watch reference block. The primary Scryfall PNG resolves at 744x1040, renders at 328x460.8 on the mobile viewport, and uses `object-fit: contain`; after decode, the image is complete.
- The Commander archive route hydrates successfully on mobile and reports 173 decks. Its valuation matrix is visible below the filters.

- The first archive-to-decklist click exposed browser console noise: Scryfall `/cards/collection` and `/cards/search` were rate-limited with 429/CORS errors, and repeated basic lands produced duplicate React keys. The route still rendered, but these were reliability issues.
- The fix now uses MTGJSON-provided Scryfall UUIDs and direct Scryfall CDN image URLs for local-first deck hydration, only attempting remote enrichment for legacy rows without UUIDs. Decklist, completion-tooltip, valuation-table, and primer keys now include stable context plus an index.
- TypeScript and the full Vitest suite pass after the fix: 28 test files and 64 tests.

- A clean navigation to `/deck/msc/avengers-assemble` now produces zero browser errors and zero warnings. The official deck renders with 100 total priced cards at 100% coverage, `$78.55` indexed singles equity, and Captain America, Team Leader as the main commander. The sealed baseline remains explicitly unavailable because MTGJSON does not provide a dated MSRP for this product.
