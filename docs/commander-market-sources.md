# Commander Market Index Sources

Research date: 2026-10-04

## EDHREC

- Source: https://edhrec.com/commanders/month
- Page title: Top Commanders (Past Month)
- Snapshot used by the site: top 20 commander names and past-month deck counts.
- Key observations: Hearthhull, the Worldseed ranked #1 with 5,201 decks; Y'shtola, Night's Blessed ranked #2 with 5,087; Vivi Ornitier #3 with 3,833; Kefka, Court Mage #4 with 3,659; The Ur-Dragon #5 with 3,600; Edgar Markov #6 with 3,571.
- Caveat: EDHREC deck counts measure deck-building activity on EDHREC, not sales, sealed-product demand, or guaranteed price appreciation.

## Recent Commander demand context

- Source: https://edhrec.com/articles/best-new-commanders-from-reality-fracture
- Page title: Best New Commanders from Reality Fracture
- Key observations: the article highlights new Reality Fracture legends including Ingris Stingerquill, Kwia Vigorbloom, Karn, Gilded Guardian, Uldaros Theorix, Fblthp, Impossibly Lost, Vraska, Soul of Stone, Codie, Ravenous Codex, Samut, Tyrant of Naktamun, Dack Fayden, Helping Hand, Nissa, Leyline Tamer, and Jace, Multiverse Architect.
- Caveat: this is editorial analysis, not a price feed or official Wizards product valuation.

## Pricing model

- Local file: `client/src/data/commanderCardPriceSnapshot.json`
- Source field: MTGJSON / TCGplayer + MTGJSON / Card Kingdom + MTGJSON / Cardmarket
- Price snapshot date used by the page: 2026-08-21
- The site reports indexed card equity and coverage, not sealed MSRP or profit. Users should compare against current sealed listings and account for reprints, fees, shipping, condition, and liquidity.
