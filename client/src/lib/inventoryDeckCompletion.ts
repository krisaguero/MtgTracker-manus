import type { RawCommanderDeck } from '@/data/commanderDecklistsData';
import type { OwnedCard } from '@/lib/manaboxParser';

export interface InventoryDeckCompletion {
  deckSlug: string;
  matchedCopies: number;
  totalCopies: number;
  coveragePercent: number;
  complete: boolean;
}

/**
 * Detects complete decklists from scanned/name-indexed inventory without
 * changing the separate sealed-precon ownership ledger.
 */
export function detectInventoryDeckCompletions(
  decks: RawCommanderDeck[],
  inventory: OwnedCard[],
  slugify: (value: string) => string,
): Map<string, InventoryDeckCompletion> {
  const inventoryByName = new Map<string, number>();
  for (const card of inventory) {
    const key = card.name.trim().toLowerCase();
    inventoryByName.set(key, (inventoryByName.get(key) || 0) + Math.max(0, card.quantity));
  }

  return new Map(decks.map((deck) => {
    const entries = [...deck.commander, ...deck.cards];
    const totalCopies = entries.reduce((sum, card) => sum + Math.max(1, card.count || 1), 0);
    const matchedCopies = entries.reduce((sum, card) => {
      const required = Math.max(1, card.count || 1);
      return sum + Math.min(required, inventoryByName.get(card.name.trim().toLowerCase()) || 0);
    }, 0);
    return [slugify(deck.name).toLowerCase(), {
      deckSlug: slugify(deck.name),
      matchedCopies,
      totalCopies,
      coveragePercent: totalCopies ? Math.round((matchedCopies / totalCopies) * 100) : 0,
      complete: matchedCopies >= totalCopies,
    }];
  }));
}
