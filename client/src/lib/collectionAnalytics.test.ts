import { beforeEach, describe, expect, it } from 'vitest';
import { computeCollectionValuation, getMissingCardsForDeck, isBasicLandName } from './collectionAnalytics';
import { saveOwnedCollection } from './manaboxParser';

const storage = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
});

describe('collection analytics', () => {
  beforeEach(() => storage.clear());

  it('calculates deck-owned and missing quantities from the saved ManaBox collection', () => {
    saveOwnedCollection([
      { name: 'Sol Ring', quantity: 1 },
      { name: 'Plains', quantity: 6 },
    ]);

    const missing = getMissingCardsForDeck(
      [{ name: 'Sol Ring', count: 1 }],
      [{ name: 'Plains', count: 7 }, { name: 'Arcane Signet', count: 1 }],
    );

    expect(missing).toEqual([
      { name: 'Plains', needed: 7, owned: 6, missing: 1, isBasicLand: true },
      { name: 'Arcane Signet', needed: 1, owned: 0, missing: 1, isBasicLand: false },
    ]);
  });

  it('recognizes standard and snow-covered basic lands', () => {
    expect(isBasicLandName('Snow-Covered Island')).toBe(true);
    expect(isBasicLandName('Command Tower')).toBe(false);
  });

  describe('computeCollectionValuation', () => {
    const prices: Record<string, number> = { 'sol ring': 2, 'arcane signet': 1.5 };
    const lookup = (name: string) => prices[name.toLowerCase()] ?? null;

    it('totals equity per set from real prices only and never invents a price', () => {
      const result = computeCollectionValuation(
        [
          { name: 'Sol Ring', quantity: 2, setCode: 'cmm' },
          { name: 'Arcane Signet', quantity: 1, setCode: 'CMM' },
          { name: 'Mystery Card', quantity: 3, setCode: 'cmm' },
          { name: 'Plains', quantity: 10, setCode: 'sld' },
        ],
        lookup,
        new Map([['CMM', 'Commander Masters']]),
        '2026-10-11',
      );

      expect(result.totalEquityUsd).toBe(5.5);
      expect(result.pricedCardCount).toBe(3);
      expect(result.unpricedCardCount).toBe(13);
      expect(result.coveragePercent).toBe(19);
      expect(result.snapshotDate).toBe('2026-10-11');
      expect(result.setBreakdowns).toEqual([
        { setCode: 'CMM', setName: 'Commander Masters', cardCount: 6, totalValueUsd: 5.5, pricedCardCount: 3, unpricedCardCount: 3 },
        { setCode: 'SLD', setName: 'SLD', cardCount: 10, totalValueUsd: 0, pricedCardCount: 0, unpricedCardCount: 10 },
      ]);
    });

    it('groups cards without a set under an unassigned bucket and skips empty rows', () => {
      const result = computeCollectionValuation(
        [
          { name: 'Sol Ring', quantity: 1 },
          { name: '', quantity: 4 },
          { name: 'Arcane Signet', quantity: 0 },
        ],
        lookup,
      );

      expect(result.setBreakdowns).toEqual([
        { setCode: 'UNKNOWN', setName: 'Unassigned Set', cardCount: 1, totalValueUsd: 2, pricedCardCount: 1, unpricedCardCount: 0 },
      ]);
      expect(result.coveragePercent).toBe(100);
    });

    it('returns zeros for an empty collection', () => {
      expect(computeCollectionValuation([], lookup)).toEqual({
        totalEquityUsd: 0,
        setBreakdowns: [],
        pricedCardCount: 0,
        unpricedCardCount: 0,
        coveragePercent: 0,
        snapshotDate: '',
      });
    });
  });
});
