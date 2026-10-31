import type { RawCommanderDeck } from '@/data/commanderDecklistsData';

export interface SimulatedDeckCoverage {
  deck: RawCommanderDeck;
  matchedCards: number;
  totalCards: number;
  coveragePercent: number;
  missingCards: string[];
}

function cardEntries(deck: RawCommanderDeck) {
  return [...deck.commander, ...deck.cards];
}

/**
 * Treats every card in an owned precon as a virtual owned card pool. This is
 * intentionally separate from the imported collection so it never changes
 * inventory or claims the cards were scanned individually.
 */
export function simulatePreconCoverage(
  decks: RawCommanderDeck[],
  ownedDeckSlugs: Set<string>,
  slugify: (value: string) => string,
): SimulatedDeckCoverage[] {
  const ownedPool = new Set<string>();
  for (const deck of decks) {
    if (!ownedDeckSlugs.has(slugify(deck.name))) continue;
    for (const card of cardEntries(deck)) ownedPool.add(card.name.toLowerCase());
  }

  return decks
    .filter((deck) => !ownedDeckSlugs.has(slugify(deck.name)))
    .map((deck) => {
      let matchedCards = 0;
      let totalCards = 0;
      const missingCards: string[] = [];
      for (const card of cardEntries(deck)) {
        const count = Math.max(1, card.count || 1);
        totalCards += count;
        if (ownedPool.has(card.name.toLowerCase())) {
          matchedCards += count;
        } else {
          missingCards.push(card.name);
        }
      }
      return {
        deck,
        matchedCards,
        totalCards,
        coveragePercent: totalCards ? Math.round((matchedCards / totalCards) * 100) : 0,
        missingCards,
      };
    })
    .sort((a, b) => b.coveragePercent - a.coveragePercent || b.matchedCards - a.matchedCards || a.deck.name.localeCompare(b.deck.name));
}
