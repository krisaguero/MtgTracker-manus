# Commander roster tally — 2026-10-31

## Evidence used

This tally is based on the attached screen recording `ScreenRecording_10-31-202616-28-01_1.mp4`, matched against the local Commander archive and the Scryfall-backed identity index in `client/src/data/preconColorIdentities.json`.

The recording shows 18 deck appearances and 17 unique deck names because Breed Lethality appears twice. The recording’s visible status labels identify three manually owned decks and fourteen decks marked inventory complete.

## Visible roster

| Deck | Commander | Scryfall identity | Group | Recording status |
|---|---|---:|---|---|
| Revival Trance (FINAL FANTASY VI) | Terra, Herald of Hope | WBR | Three-color | Manually owned |
| Most Wanted | Olivia, Opulent Outlaw | WBR | Three-color | Manually owned |
| Adaptive Enchantment | Estrid, the Masked | WUG | Three-color | Manually owned |
| Exquisite Invention | Saheeli, the Gifted | UR | Two-color pair | Inventory complete |
| Breed Lethality | Atraxa, Praetors’ Voice | WUBG | Four-color | Inventory complete |
| Built From Scratch | Daretti, Scrap Savant | R | Mono-color | Inventory complete |
| Wade into Battle | Kalemne, Disciple of Iroas | WR | Two-color pair | Inventory complete |
| Arcane Wizardry | Inalla, Archmage Ritualist | UBR | Three-color | Inventory complete |
| Draconic Domination | The Ur-Dragon | WUBRG | Five-color | Inventory complete |
| Feline Ferocity | Arahbo, Roar of the World | WG | Two-color pair | Inventory complete |
| Vampiric Bloodlust | Edgar Markov | WBR | Three-color | Inventory complete |
| Guided by Nature | Freyalise, Llanowar’s Fury | G | Mono-color | Inventory complete |
| Plunder the Graves | Meren of Clan Nel Toth | BG | Two-color pair | Inventory complete |
| Entropic Uprising | Yidris, Maelstrom Wielder | UBRG | Four-color | Inventory complete |
| Invent Superiority | Breya, Etherium Shaper | WUBR | Four-color | Inventory complete |
| Open Hostility | Saskia the Unyielding | WBRG | Four-color | Inventory complete |
| Stalwart Unity | Kynaios and Tiro of Meletis | WURG | Four-color | Inventory complete |

## Tally

- **17 unique visible decks / commanders**
- **3 manually owned**: Terra, Olivia, and Estrid
- **14 inventory-complete** decks
- **5 three-color decks**
- **5 four-color decks**
- **4 two-color decks**
- **2 mono-color decks**
- **1 five-color deck**
- **0 colorless or partner decks** in this visible roster

### Exact identity tally

| Identity | Count |
|---|---:|
| WBR / Mardu | 3 |
| WUG / Bant | 1 |
| UBR / Grixis | 1 |
| WUBG | 1 |
| UBRG | 1 |
| WUBR | 1 |
| WBRG | 1 |
| WURG | 1 |
| UR / Izzet | 1 |
| WR / Boros | 1 |
| WG / Selesnya | 1 |
| BG / Golgari | 1 |
| Mono-red | 1 |
| Mono-green | 1 |
| WUBRG / five-color | 1 |

The visible collection is heavily weighted toward four-color and Mardu-style play. It has no Dimir-only, Simic-only, Orzhov-only, Rakdos-only, or colorless commander represented in this roster.

## User-mentioned decks matched to the archive

- **Most Wanted** — Olivia, Opulent Outlaw — WBR/Mardu.
- **Abzan Armor** — Felothar the Steadfast — WBG/Abzan. This is present in the archive and in the existing upgrade-guide data, but it was not visibly marked owned in the recording.
- **The Fantastic Four** — Invisible Woman — WURG/four-color. This is present in the archive. The prior conversation indicates this is a recently acquired deck, but the recording does not show its ownership badge, so it is treated as “acquired, needs account confirmation” rather than silently changing the account ledger.

## How to use this data

### 1. Most Wanted should be the first upgrade anchor

You already have three WBR/Mardu commanders in the visible roster: Olivia, Edgar, and Terra’s deck identity. Most Wanted should become the dedicated Treasure/outlaw bridge. The existing guide recommends Hellspur Posse Boss, Swashbuckler Extraordinaire, Tin Street Dodger, and Reckless Fireweaver. The best inventory-aware sequence is to check those four against ManaBox first, then use Vihaan, Goldwaker as the alternate Treasure-focused commander if you want a more explicit artifact-token build.

### 2. Abzan Armor fills a real gap

Abzan Armor adds WBG, the only Abzan identity currently being discussed in the roster. It gives you a toughness/defender lane that is not represented by Olivia, Atraxa, or the older four-color decks. The existing guide’s first low-cost checks are Abzan Beastmaster, Archers’ Parapet, and Portcullis Vine. Doran is the clean alternate path when you want the walls to become attackers instead of only defensive infrastructure.

### 3. Fantastic Four is a four-color transfer project

Invisible Woman’s WURG identity is not redundant with Atraxa, Breya, Yidris, Saskia, or Kynaios and Tiro. It is a useful “new shell” because it overlaps with your broad four-color card pool while still creating a separate build direction. The recommended app workflow is:

1. Select The Fantastic Four as the target deck.
2. Match exact-printing cards from ManaBox and completed precons.
3. Mark each candidate as owned, already assigned, or missing.
4. Show the smallest card-transfer package that changes the deck’s play pattern.
5. Save the result as an upgrade variant without changing the sealed precon record.

### 4. Your biggest underrepresented lanes

Based on the visible roster, the next useful diversity targets are:

- **Simic / UG:** no Simic-only commander is visible.
- **Dimir / UB:** no Dimir-only commander is visible.
- **Orzhov / WB:** no Orzhov-only commander is visible.
- **Rakdos / BR:** no Rakdos-only commander is visible.
- **Colorless:** no colorless commander is visible.

These are not necessarily purchase recommendations. They are collection-diversification targets. A new deck should be favored when it provides a genuinely new identity or mechanics lane rather than another four-color value shell.

## Important limitation

The recording is evidence of what the page displayed at that moment. It is not a replacement for the authenticated account workspace. The app should use this tally as a reconciliation view: compare the recording-derived roster against acquired-precon records and ManaBox-complete records, then ask for confirmation only where the layers disagree.
