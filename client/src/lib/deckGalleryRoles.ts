import roleData from "@/data/deckGalleryRoles.json";

export type DeckGalleryCategoryCard = { name: string; quantity: number };
export type DeckGalleryCategory = {
  id: string;
  title: string;
  copies: number;
  rows: number;
  description: string;
  cards: DeckGalleryCategoryCard[];
};
export type DeckGalleryRoleReading = {
  deckId: string;
  main: DeckGalleryCategory[];
  sideboard: DeckGalleryCategory[];
};

const readings = new Map(
  roleData.entries.map(reading => [reading.deckId, reading as DeckGalleryRoleReading])
);

function cardKey(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

export function getDeckGalleryRoleReading(
  deckId: string
): DeckGalleryRoleReading | undefined {
  return readings.get(deckId);
}

/** Keep any future unmatched cards in first-seen source order and merge duplicate names. */
export function getDeckGalleryRemainderCards<T extends DeckGalleryCategoryCard>(
  sourceRows: T[],
  categories: DeckGalleryCategory[]
): DeckGalleryCategoryCard[] {
  const categorizedNames = new Set(
    categories.flatMap(category => category.cards.map(card => cardKey(card.name)))
  );
  const remainder = new Map<string, DeckGalleryCategoryCard>();
  for (const card of sourceRows) {
    const key = cardKey(card.name);
    if (categorizedNames.has(key)) continue;
    const existing = remainder.get(key);
    if (existing) existing.quantity += card.quantity;
    else remainder.set(key, { name: card.name, quantity: card.quantity });
  }
  return Array.from(remainder.values());
}

export function deckGalleryCategoryCopyCount(categories: DeckGalleryCategory[]) {
  return categories.reduce((total, category) => total + category.copies, 0);
}

// Kept as a compatibility alias for existing gallery consumers.
export const deckGalleryRoleCopyCount = deckGalleryCategoryCopyCount;
