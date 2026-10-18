# Decks, remote play, and a clearer journal

Everything is prepared for local review on branch `review/remote-play-editorial`, based on production commit `4f07b4c`. Nothing has been pushed, published, deployed, purchased, or written back to Notion. The supplied Aura0 room was never opened or joined. The excluded service is not in the article.

## What is ready

**A journal with a clear job.** `/blog` now gathers the reading-heavy articles. Market charts keep their own links and pages. The shared navigation and market hub both point readers toward the journal. Existing October 5 and October 11 historical articles remain linked with their own source windows. Three newly prepared Market Watch prose pages retain September 14, October 15, and October 16. The connected Daily Reports database has only two posted rows, October 15 and 16; September 14 is a separate older post and is retained without pretending it was a third database row. There are no fabricated missing-day posts and no duplicate copy of a chart snapshot masquerading as a new mover claim.

**Three complete play articles.** The exact draft copy is in `docs/editorial-review-copy.md` and the actual site source is `client/src/data/journalArticles.json`:

- `/blog/remote-play-shuffle-tests`: Convoke, Aura0, Arena, and MTGO; how to choose a table, take a decklist along, goldfish opening hands, and test with friends. About 655 words.
- `/blog/brawlternative-shelf-roundup`: the seven-deck shelf, three clearly separated proposals, themes and test questions, and direct visual deck links. About 715 words.
- `/blog/battle-box-october-17-recap`: the October 17 Battle Box notebook, nine visual linked deck cards, physical-card shopping first, and optional proxy-print help second. About 571 words.

**Copy and download exports.** Battle Box, Brawlternative, and precon pages offer format-specific plain-text previews, copy, and `.txt` downloads. Arena uses Commander / Deck / Sideboard sections. MTGO keeps main rows first and the commander last after a blank line; it does not fabricate catalog IDs or `.dek` files. Generic text supports a reviewable Moxfield handoff for Convoke. Aura0 has only a homepage handoff, not an asserted direct importer. These are one-click exports, not a claim that a button can launch every service and silently load a legal deck.

**Physical cards first.** Battle Box and Brawlternative pages now have a large Buy Online panel. Choose a card and open its TCGplayer search, or copy the full shopping list. It is explicitly a search, not a prefilled cart, checkout, live-price quote, or ownership/missing-card assessment. Battle Box proxy help is secondary. The recap's Buy Online links land on each deck's shopping panel.

## The three deck proposals

All three contain exactly 60 commander-plus-main cards and remain explicitly custom Commander-preview/Brawlternative decks, not official Brawl or 100-card Commander. They retain a local-review/WIP status until approved and playtested.

- **The Wise Mothman:** correct the three names to Harold and Bob, First Numens; Strong, the Brutish Thespian; and Piper Wright, Publick Reporter. Remove off-identity Abzan Falconer. Add Fathom Mage and Inspiring Call to support counters, refill, and protection. The 59-card submitted source becomes a 60-card proposal; 22 lands remain.
- **Rakdos, Lord of Riots:** retain the submitted 60 and its 21 lands, including Leechridden Swamp. Repair the strategy: Rakdos requires an opponent to have lost life this turn to be cast; his reduction applies to generic costs of creature spells and is not flash permission or colored-mana reduction. Treat burst turns and the land budget as playtest questions, not proven performance.
- **Karlov of the Ghost Council:** retain the user-approved Crested Sunmare and Daxos the Returned corrections; Daxos, Blessed by the Sun stays. Preserve the 60-card, 20-land plan and explain separate life-gain events, Karlov's counters, and white/black removal timing correctly.

Full exact proposed lists and reasoning are in `docs/brawlternative-completion-review.md`. Every original submitted deck record is unchanged from production. Source history keeps the original names, quantities, audits, and warnings. View and export selections are separately labeled; a reader can compare or export either version.

## Checks completed

- `pnpm check`: passed.
- `pnpm test`: **360 passed across 89 test files**.
- `pnpm build`: passed; the bundle-size advisory is non-blocking.
- `git diff --check`: passed.
- Real-browser layout checks: six representative routes × 320 / 390 / 430px, **18 checks**, expected headings present and no main-content horizontal overflow. This uses same-origin iframe viewports, not a claim of device-specific touch emulation.
- Desktop journal: expected title and navigation, no horizontal overflow at 1280px.
- Real-browser Arena copy: successful `Decklist copied.` state observed and saved. Downloaded Mothman `.txt` verified at **60 copies and exactly one commander**.
- Real-browser MTGO: commander follows main rows at the end. Original/proposal export switching verified at **59 versus 60** for Mothman.
- Regression tests cover every seven-deck default export at 60 cards, all nine Battle Box recap links, all seven Brawlternative roundup links, dated journal routes, zones, punctuation, source-history presentation, safe shopping search URLs, and exclusion of the supplied room link.

A browser console inspection saw one unload permissions-policy warning; rendering and the tested controls succeeded. No authenticated game-client import, multiplayer match, retailer checkout, denied-permission clipboard test, or exhaustive live retailer stock check was performed. Unsupported platform cards stay visible rather than being silently replaced. Optional custom commander-plus-house-sideboard MTGO zones require manual client review.

## Review locations

- Working tree: `/workspace/mtg-remote-play-review`
- Local server: `http://localhost:3218/blog` (Vite preview remains running; not a production deployment)
- Exact prose: `/workspace/mtg-remote-play-review/docs/editorial-review-copy.md`
- Exact deck lists: `/workspace/mtg-remote-play-review/docs/brawlternative-completion-review.md`
- Export behavior and primary documentation: `/workspace/mtg-remote-play-review/docs/deck-export-review.md`
- Notion inventory: `/workspace/mtg-remote-play-review/docs/market-report-inventory.md`
- QA evidence, screenshot, downloaded sample, and review patch: `/workspace/mtg-remote-play-review-artifacts`

One parallel edit initially landed in a different working tree. Its exact files and patch were recovered outside both repositories; only those identified edits were removed there. Pre-existing unrelated work was left in place. The finished proposal is isolated in the review working tree above.

Approval is still required before committing/pushing, publishing the new articles, or deploying the new feature set.
