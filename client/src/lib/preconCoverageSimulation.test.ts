import { describe, expect, it } from 'vitest';
import { simulatePreconCoverage } from './preconCoverageSimulation';
import type { RawCommanderDeck } from '@/data/commanderDecklistsData';

const deck = (name: string, cards: Array<{ name: string; count?: number }>): RawCommanderDeck => ({
  name,
  set_code: 'tst',
  set_name: 'Test Set',
  cards: cards.map((card) => ({ name: card.name, count: card.count ?? 1, set_code: 'tst', number: '1' })),
  commander: [],
  synopsis: '',
  approxValue: 0,
});

describe('precon coverage simulation', () => {
  it('treats cards from owned precons as virtual coverage without mutating the archive', () => {
    const decks = [
      deck('Owned Deck', [{ name: 'Sol Ring' }, { name: 'Forest', count: 2 }]),
      deck('Target Deck', [{ name: 'Sol Ring' }, { name: 'Forest' }, { name: 'Island' }]),
    ];

    const result = simulatePreconCoverage(decks, new Set(['owned-deck']), (name) => name.toLowerCase().replace(/\s+/g, '-'));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ matchedCards: 2, totalCards: 3, coveragePercent: 67 });
    expect(result[0].missingCards).toEqual(['Island']);
    expect(decks).toHaveLength(2);
  });
});
