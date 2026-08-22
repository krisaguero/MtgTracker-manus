import { describe, it, expect } from 'vitest';
import { resolveDeckMarketValue } from '../lib/marketPriceIndex';
import { commanderDecklistsData } from '../data/commanderDecklistsData';

describe('Commander valuation matrix and pricing provenance', () => {
  it('resolves market value across all catalog decks with coverage percentages', () => {
    expect(commanderDecklistsData.length).toBeGreaterThan(0);
    for (const deck of commanderDecklistsData.slice(0, 5)) {
      const val = resolveDeckMarketValue(deck);
      expect(typeof val.totalUsd).toBe('number');
      expect(typeof val.coveragePercent).toBe('number');
      expect(val.coveragePercent).toBeGreaterThanOrEqual(0);
      expect(val.coveragePercent).toBeLessThanOrEqual(100);
    }
  });
});
