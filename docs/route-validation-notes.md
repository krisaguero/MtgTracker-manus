# Route Validation Notes

## 2026-08-20

The representative Commander route `/deck/eoc/world-shaper` was loaded after restarting the development service. The initial skeleton transitioned to a resolved precon page showing the archive link, deck metadata, ManaBox actions, and the primary commander card. The reported React hook-order exception did not recur after moving the deck valuation hook above the loading and error branches.

The representative card route `/card/sol%20ring` resolved card metadata, prices, and alternate-printing thumbnails. Its primary artwork panel remained empty while alternate-printing images rendered. The page now uses the shared eager-loading zoom renderer with a Scryfall fallback and an explicit layout height, but the preview capture still does not show that primary image; this is retained as a documented follow-up rather than being misrepresented as resolved.

The homepage was opened after parent-to-Commander indexing was implemented. Its initial screenshot showed the intended recent-sets loading skeleton, which is expected while the Scryfall set catalog resolves. The association helpers are covered by focused tests, including the EOC Commander child-set attachment to Edge of Eternities. The local association map is now populated before deferred Scryfall product lookups; the resolved homepage reports 39 indexed Commander precons instead of zero.

At a 375 px viewport, the homepage preserves the compact logo-plus-hamburger header and exposes the recent-set filters without horizontal page overflow. The representative World Shaper deck page keeps its archive escape route, inventory controls, and primary commander art legible on the same mobile viewport.

For the Sol Ring card profile, DOM inspection found the actual cause of the blank panel: the primary card column was being stretched to the full 4,072 px height of its grid row and `justify-center` placed the artwork at y=1,835, below the viewport. Adding `self-start` to that column keeps the primary art above the fold. A final browser screenshot visibly confirmed the repaired Sol Ring artwork; alternate gallery images are also lazy-loaded so the selected print receives high network priority.
