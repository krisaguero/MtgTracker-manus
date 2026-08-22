# Route Audit Findings — 2026-08-22

The mobile and desktop preview captures covered the static home, collection, Commander archive, precon library, market report, latest market report, daily movers, signal-matrix article, market-watch article, Costco article, Commander deck, precon catalog, set detail, card detail, and Dupe-Decks routes.

The market report now renders 24 real indexed cards from the snapshot and clearly reports zero positive movers when the current and previous snapshot prices are equal. Commander archive cards show a real indexed total plus an explicit indexed-coverage percentage. Collection and precon views use hard-edged loading shells and image fallbacks.

The audit found one functional issue: `/dupe-decks` was being captured by the dynamic `/:setCode` route. The route was registered before the dynamic route in `App.tsx`, and a source regression test was added. Subsequent preview capture showed the Dupe-Decks workspace at the correct path.

The preview console/network tail showed successful Scryfall responses and no new browser-console runtime exceptions during the route captures. Remaining verification is interactive hamburger/menu behavior, in-app navigation/back paths, and explicit loading/error/empty/provenance states before final checkpoint.

## Interactive Evidence

The visible homepage navigation was followed into `/dupe-decks`; the repaired page loaded its Groq key field, dual inventory controls, prebuilt archetypes, and local heuristic deck output. Its “Back to Recent Sets” link returned to `/`. From the homepage, the Precon Library navigation opened `/precons`, which rendered 44 decks, boxed-product imagery, decklist links, collection-match progress, and indexed market coverage labels. The route map and dynamic set route therefore no longer conflict in the tested transitions.

## Runtime Menu Verification

The browser preview was reopened at the active `us5` preview URL after one stale `us1` URL returned the temporary-unavailable page. Desktop navigation transitions were verified by clicking Dupe-Decks, using its back link, and clicking Precons from the homepage. A first DOM exercise confirmed the Escape, outside-click, and link-close handlers exist and execute, but the immediate React state read raced the animation/unmount. A follow-up isolated test is still needed with the homepage mounted and state-update waits.

The isolated runtime DOM exercise on the mounted homepage returned `{ opened: true, closedByEscape: true, reopened: true, closedByOutsideClick: true }` at the preview viewport. The link-close path was also exercised during the earlier route transition to `/movers`. Source-level tests now cover the mobile toggle’s accessible state contract and the MarketReport/archive/purchase loading and provenance labels. Final validation passed with 26 test files and 59 tests, TypeScript, production build, and `git diff --check`.

## Hamburger Menu Regression Fix — 2026-08-22

The mobile menu handlers were functional, but the responsive breakpoint was too narrow for tablet-sized mobile layouts: desktop links became active at `md` (768px), so a viewport such as 894px had no hamburger control. The outside-click ref also covered the entire page root, so page-content taps could not be recognized as outside the menu.

The fix moves the ref to the navigation element, changes the desktop/mobile switch from `md` to `lg` (1024px), adds `aria-controls="mobile-navigation"` and `aria-hidden`, and disables pointer events while the panel is collapsed. Runtime Playwright verification passed at 375px and 894px: the hamburger was visible, tapping it expanded all six links, Escape collapsed the panel, tapping main content collapsed it, and selecting Daily Movers navigated to `/movers` without persisting the open panel. The preview reported zero console errors during these interactions. TypeScript, all 26 test files / 59 tests, production build, and `git diff --check` passed.
