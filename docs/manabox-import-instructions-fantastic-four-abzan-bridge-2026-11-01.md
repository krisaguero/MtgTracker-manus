# ManaBox import instructions: Fantastic Four ↔ Abzan Armor bridge

**Purpose:** Verify physical ownership and transferable quantities for the 12-card Abzan Armor Wall/toughness package proposed for The Fantastic Four / Invisible Woman.

**Target deck:** The Fantastic Four (`msc`) — Invisible Woman  
**Source deck:** Abzan Armor (`tdc`) — Felothar the Steadfast  
**Import destination:** MTG Tracker → Collection → ManaBox import

## 1. Export the complete collection from ManaBox

Do not export only the 12 names if you can avoid it. Export the **full collection** so the tracker can distinguish:

- A card physically owned once
- A duplicate available for transfer
- A copy already assigned to another deck
- Different exact printings of the same card
- Normal versus foil copies
- English versus non-English copies
- Proxies versus owned cards
- Trade copies versus active collection copies

In ManaBox, use the collection export function and choose CSV if available. Keep the original export file unchanged as an archival snapshot.

Suggested filename:

```text
manabox-full-collection-2026-11-01.csv
```

## 2. Required fields

The tracker accepts typical ManaBox CSV headers. The important fields are:

| ManaBox field | Tracker field | Why it matters |
|---|---|---|
| Name | `name` | Card-name matching and review queue |
| Quantity | `quantity` | Determines duplicate and transferable counts |
| Set or set code | `setCode` | Exact printing identity |
| Collector Number | `collectorNumber` | Exact printing identity |
| Foil | `finish` | Separates normal and foil copies |
| Condition | `condition` | Helps distinguish playable from damaged copies |
| Language | `language` | Prevents accidental printing conflation |
| Scryfall ID, if available | `scryfallId` | Strongest exact-printing identity |
| Proxy, if available | `proxy` | Keeps proxies out of physical ownership calculations |
| Trade quantity, if available | `tradeQuantity` | Helps exclude cards not available for deck use |

The minimum useful export is `Name, Quantity, Set, Collector Number`. Missing set or collector-number data will be placed in the printing-review queue rather than silently assigned to a printing.

## 3. The 12 cards to verify

Search the imported collection for these exact names. Record the total quantity and whether at least one copy is physically available for transfer.

### Package A — minimum test package

| Card | Role in Invisible Woman | Needed for first test |
|---|---|---:|
| Assault Formation | Primary toughness-to-power engine | 1 |
| Wall of Omens | Cantrip Wall and defender density | 1 |
| Wall of Blossoms | Cantrip Wall and defender density | 1 |
| Axebane Guardian | Colored mana from defenders | 1 |
| Tower Defense | Lethal toughness-pump turn | 1 |

### Package B — stabilization package

| Card | Role in Invisible Woman | Needed if Package A works |
|---|---|---:|
| Wall of Roots | Early defense and flexible mana | 1 |
| Overgrown Battlement | Defender-based mana acceleration | 1 |
| Wall of Reverence | Defensive body and life buffer | 1 |
| Weathered Sentinels | Scaling defender that can attack | 1 |

### Package C — optional conversion finishers

| Card | Role in Invisible Woman | Optional |
|---|---|---:|
| Crashing Drawbridge | Gives a wide Wall board a finishing attack | 1 |
| Towering Titan | High-toughness threat | 1 |
| Wall of Limbs | Thematic late-game Wall payoff | 1 |

## 4. How to mark a card as transferable

For each card, calculate:

```text
Transferable copies = total physical copies
                      − copies reserved for Abzan Armor
                      − copies reserved for any other active deck
                      − damaged/proxy/trade-only copies
```

For a first-pass conservative calculation, reserve one copy for Abzan Armor whenever the card appears in its archived list. The tracker should not assume that a sealed precon has been opened or that its cards are available.

Example:

```text
Assault Formation: 1 scanned copy
Reserved for Abzan Armor: 1
Transferable: 0
Status: Conditional / do not move yet
```

```text
Assault Formation: 2 scanned copies
Reserved for Abzan Armor: 1
Transferable: 1
Status: Transfer candidate
```

Basic lands and generic staples require a separate reservation policy. Do not use them to infer that the Wall bridge is available.

## 5. Import the file into MTG Tracker

1. Open the live site.
2. Go to **Collection**.
3. Choose **Import ManaBox CSV**.
4. Select the unchanged full export file.
5. Review the import preview before confirming.
6. Confirm that the preview shows the expected incoming entry count.
7. Check the duplicate count. Re-importing the same export should not double quantities.
8. Check the unresolved-printing count.
9. Resolve ambiguous printings before using price or transfer recommendations.
10. Return to the Fantastic Four deck page or Precon Portfolio Workspace.
11. Refresh the workspace.
12. Open the Invisible Woman Wall-conversion bridge.

## 6. Expected import behavior

The tracker uses exact-printing identity in this order:

1. Scryfall ID, when present
2. Name + set code + collector number
3. Finish and language modifiers
4. Proxy/owned distinction

An exact re-import is treated as a snapshot refresh. The tracker keeps the larger quantity instead of adding the same export again.

A name-only row is not silently assigned to a printing. If multiple local printings match, the row remains unresolved until reviewed.

## 7. What to inspect after import

For every one of the 12 cards, confirm:

- Imported quantity
- Set code
- Collector number
- Finish
- Condition
- Language
- Whether the copy is a proxy
- Whether the copy is reserved in Abzan Armor
- Whether any duplicate remains available
- Whether the card is already assigned to another active deck

The desired result is a table like this:

| Card | Total | Reserved | Transferable | Printing verified | Status |
|---|---:|---:|---:|---|---|
| Assault Formation | 2 | 1 | 1 | Yes | Transfer candidate |
| Wall of Omens | 1 | 1 | 0 | Yes | Conditional |
| Wall of Blossoms | 0 | 0 | 0 | — | Buy candidate |
| Axebane Guardian | 1 | 1 | 0 | Yes | Conditional |
| Tower Defense | 2 | 1 | 1 | Yes | Transfer candidate |

## 8. Interpret the bridge result

### Transfer candidate

The card has a verified printing and at least one copy remains after source-deck reservations.

### Conditional transfer

The card exists, but moving it would leave Abzan Armor or another active deck short. It can be borrowed only if the source list is intentionally changed or a replacement is available.

### Owned but printing unresolved

A card with the right name exists, but set or collector number is missing. Do not use it for exact price, foil, or transfer decisions until reviewed.

### Buy candidate

No transferable copy was found. The card should flow into the Invisible Woman buy-list rather than being labeled as already owned.

### Reserved / active elsewhere

The card is physically owned but already assigned to another deck. It is not available for the bridge unless a ledger entry records a deliberate borrow or substitution.

## 9. Recommended first import workflow

Use this order to avoid overcommitting:

1. Import the complete ManaBox export.
2. Resolve all 12 Wall-package printings.
3. Review the five Package A cards first.
4. Reserve one copy for Abzan Armor where applicable.
5. Add only genuine surplus copies to a planned transfer package.
6. Test Invisible Woman with Package A.
7. Record the package as `borrow` or `substitute` in the upgrade ledger.
8. Playtest before adding Package B.
9. Add Package C only if you want the deck to become a dedicated Wall conversion.

## 10. Privacy and backup

Keep the original export file in a private location. The tracker stores collection data in the local workspace unless account sync is explicitly enabled. Before importing a large replacement snapshot, preserve the current workspace backup so a mistaken export can be reverted.

Do not edit the CSV manually before import. If corrections are necessary, keep both files:

```text
manabox-full-collection-2026-11-01-original.csv
manabox-full-collection-2026-11-01-corrected.csv
```

## Final verification target

The import is successful when the tracker can answer all three questions without guesswork:

1. Which of the 12 cards do I physically own?
2. Which exact printings and finishes are they?
3. How many copies can move from Abzan Armor into Invisible Woman without breaking another deck?

Until those answers are available, the bridge remains a researched upgrade path—not a confirmed transfer package.
