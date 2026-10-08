import { describe, expect, it } from 'vitest';
import { battleBoxDecks, combinedPullList, deckCardTotal, deckListLines, validateBattleBox } from '@/lib/battleBoxValidation';

describe('battle box starting lists', () => {
  it('keeps every exact starting list at 60 cards', () => {
    expect(battleBoxDecks.map(deckCardTotal)).toEqual([60, 60, 60, 60]);
    expect(validateBattleBox()).toMatchObject({ totalCards: 240, basicLands: 95, allDecksAre60: true });
  });
  it('exports only quantity/name lines and aggregates the shared pull list', () => {
    expect(deckListLines(battleBoxDecks[0])).toHaveLength(31);
    expect(combinedPullList(battleBoxDecks).reduce((sum, card) => sum + card.quantity, 0)).toBe(240);
  });
});
