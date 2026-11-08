import roleData from "@/data/deckGalleryRoles.json";

export type DeckGalleryRoleCard = { name: string; quantity: number };
export type DeckGalleryRoleGroup = {
  id: string;
  title: string;
  copies: number;
  rows: number;
  description: string;
  cards: DeckGalleryRoleCard[];
};
export type DeckGalleryRoleReading = {
  deckId: string;
  main: DeckGalleryRoleGroup[];
  sideboard: DeckGalleryRoleGroup[];
};

const readings = new Map(
  roleData.entries.map(reading => [reading.deckId, reading as DeckGalleryRoleReading])
);

export function getDeckGalleryRoleReading(
  deckId: string
): DeckGalleryRoleReading | undefined {
  return readings.get(deckId);
}

export function deckGalleryRoleCopyCount(groups: DeckGalleryRoleGroup[]) {
  return groups.reduce((total, group) => total + group.copies, 0);
}
