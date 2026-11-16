import metadata from "@/data/deckboxBattleBoxMetadata.json";
import type { DeckGalleryEntry, DeckGalleryPayload } from "@/lib/deckGallery";

export type DeckboxBattleBoxMetadata = (typeof metadata)[number];
export type DeckboxBattleBoxEntry = DeckGalleryEntry &
  DeckboxBattleBoxMetadata & {
    sourceTitle: string;
    sourceCredit: string;
  };

export function getDeckboxBattleBoxEntries(
  payload: DeckGalleryPayload
): DeckboxBattleBoxEntry[] {
  return metadata.flatMap(item => {
    const source = payload.entries.find(entry => entry.id === item.deckId);
    if (!source) return [];
    const mainCopies = source.main.reduce((total, card) => total + card.quantity, 0);
    const sideboardCopies = source.sideboard.reduce((total, card) => total + card.quantity, 0);
    if (
      source.mainCopies !== 60 ||
      mainCopies !== 60 ||
      source.sideboardCopies !== sideboardCopies ||
      source.sourceSectionsOmitted ||
      source.helm.status !== "not_a_commander_deck"
    ) return [];
    return [
      {
        ...source,
        ...item,
        sourceTitle: source.title,
        sourceCredit: source.creditLine,
      },
    ];
  });
}

export function findDeckboxBattleBoxEntry(
  payload: DeckGalleryPayload,
  deckId: string
): DeckboxBattleBoxEntry | undefined {
  return getDeckboxBattleBoxEntries(payload).find(entry => entry.id === deckId);
}
