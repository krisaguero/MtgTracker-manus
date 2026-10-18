# Copy a deck, then open your table

Local review only. No publication, deployment, purchase, or platform account modification is part of this change.

## The buttons

Brawlternative, Battle Box, and precon detail pages expose a readable text preview, **Copy list**, and **Download .txt**. Choose Arena, MTGO, or generic text before copying. Copy success is shown only after the clipboard promise succeeds; failure gives a manual-copy fallback. Downloads identify the deck and chosen format.

This is one-click **export**, not an unsupported promise to launch another app and load a legal deck. No deep link, room join, card purchase, wildcard spend, or retailer cart submission is performed.

## What each format does

**Arena:** separate `Commander`, `Deck`, and optional `Sideboard` sections preserve zones. The commander is removed from the main rows and appears exactly once. Follow [Wizards' official instructions](https://mtgarena-support.wizards.com/hc/en-us/articles/360049857771-Importing-a-Deck): copy the list, then Decks → Import. Unsupported cards remain in the output for explicit review; the exporter does not silently substitute them.

**MTGO:** plain quantity/name main rows come first. The commander comes last, following a blank line, as discussed by a developer in the [official MTGO forum](https://forums.mtgo.com/index.php?threads/text-file-commander-decks-import-in-backwards-zones.3196/). [Official deckbuilding instructions](https://www.mtgo.com/getting-started/getting-started-deckbuilding) support text, clipboard import, and native `.dek` files. This implementation provides text only: no catalog IDs are invented to make a fake `.dek`. A custom house sideboard combined with a commander requires manual zone review; automatic parsing of that combination is not guaranteed.

**Generic:** explicit Commander / Deck / Sideboard sections provide a reviewable list for an importer that accepts that syntax. [Convoke](https://convoke.games/en/) documents Moxfield decklist import, so the handoff is: export here → create/update and review a deck in Moxfield → use Convoke's Moxfield import. No direct Convoke API integration is claimed. [Aura0](https://aura0.app/) is linked at its homepage only; no direct-import behavior is claimed and the supplied room is never opened.

Invalid positive-count input is not exported as a malformed row: empty names, nonpositive or fractional quantities are rejected. Existing punctuation, including apostrophes, commas, and split-card `//`, is preserved. No printing IDs or ownership assumptions are added.

## Proposed versus submitted lists

The Mothman, Rakdos, and Karlov pages default to the clearly labeled complete proposal for local review. View selection and export selection are independent and explicitly labeled. Original submitted names, quantities, issues, and audits remain available in source-list history. Regression tests require exactly 60 commander-plus-main cards in the default exports; the commander is not a 61st card. Optional sideboards remain outside that total.

These are custom 60-card Commander-preview Brawlternatives—not official Brawl or regulation 100-card Commander. A successful text parse is not a legality or card-availability certificate. Custom formats may have no matching Arena/MTGO queue.

## Buy Online comes first

Battle Box and Brawlternative pages place **Buy Online** ahead of the export controls. The shopping panel lets readers pick an individual card and opens a safe TCGplayer search, or copy a full shopping list. It explicitly does not create a prefilled cart, promise stock, quote a live deck total, or infer what anyone owns or lacks. Proxy-print help is secondary and optional on Battle Box pages.

## Verification boundaries

Unit and page-render tests cover quantities, punctuation, zones, commander duplication, route/date coverage, and safe shopping links. Browser checks inspect real local rendering and export controls; no authenticated Arena/MTGO client import, Convoke game, Aura0 room, retailer checkout, or full live multiplayer match is performed. Clipboard/download behavior depends on browser permissions and is reported separately in the review QA notes.
