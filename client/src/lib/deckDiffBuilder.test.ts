import { describe, expect, it } from 'vitest';
import { buildDeckDiff, validateCommanderDeck } from './deckDiffBuilder';
import type { RawCommanderDeck } from '@/data/commanderDecklistsData';

const deck = {
  name: 'The Fantastic Four',
  set_code: 'msc',
  set_name: 'Test',
  commander: [{ name: 'Invisible Woman', set_code: 'msc', number: '1', count: 1 }],
  cards: Array.from({ length: 99 }, (_, index) => ({ name: `Card ${index + 1}`, set_code: 'msc', number: `${index + 2}`, count: 1 })),
} as RawCommanderDeck;

describe('deck diff builder', () => {
  it('keeps a balanced 100-card result after one-for-one replacement', () => {
    const result = buildDeckDiff(deck, [{ name: 'Assault Formation', count: 1 }], [{ name: 'Card 99', count: 1 }]);
    expect(result.balanced).toBe(true);
    expect(result.validation).toMatchObject({ totalCards: 100, commanderCards: 1, mainboardCards: 99, legalSize: true, commanderCountValid: true });
    expect(result.finalMainboard.some(card => card.name === 'Assault Formation')).toBe(true);
    expect(result.finalMainboard.some(card => card.name === 'Card 99')).toBe(false);
  });

  it('warns when additions are not matched by cuts', () => {
    const result = buildDeckDiff(deck, [{ name: 'Assault Formation', count: 1 }], []);
    expect(result.balanced).toBe(false);
    expect(result.validation.totalCards).toBe(101);
    expect(result.validation.legalSize).toBe(false);
    expect(result.validation.warnings).toContain('Expected 99 mainboard cards for 1 commander card; diff contains 100.');
  });

  it('allows basic land multiples but flags nonbasic singleton violations', () => {
    const validation = validateCommanderDeck(
      [{ name: 'Invisible Woman', count: 1 }],
      [{ name: 'Plains', count: 5 }, { name: 'Arcane Signet', count: 2 }],
    );
    expect(validation.duplicateViolations).toEqual(['Arcane Signet (2)']);
  });
});
