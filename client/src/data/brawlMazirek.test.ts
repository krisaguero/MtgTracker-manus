import { describe, expect, it } from 'vitest';
import { brawlMazirekDeck, countBrawlDeck, flattenBrawlDeck } from './brawlMazirek';

describe('Mazirek Brawl-style construction lab', () => {
  it('keeps both versions at 60 cards including the commander', () => {
    expect(countBrawlDeck('baseline')).toBe(60);
    expect(countBrawlDeck('optimized')).toBe(60);
  });

  it('keeps each version singleton by card name except basic lands', () => {
    for (const version of ['baseline', 'optimized'] as const) {
      const cards = flattenBrawlDeck(version);
      const duplicates = cards.filter((card, index) => cards.indexOf(card) !== index);
      expect(duplicates.every((card) => card === 'Forest' || card === 'Swamp')).toBe(true);
    }
  });

  it('labels the deck as a Brawl-style house-rule build', () => {
    expect(brawlMazirekDeck.formatNote).toContain('not a claim of current Standard Brawl legality');
  });
});
