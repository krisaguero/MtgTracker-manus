import { beforeEach, describe, expect, it } from 'vitest';
import { calculateCollectionValuation, getMissingCardsForDeck, isBasicLandName } from './collectionAnalytics';
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
    saveOwnedCollection([{ name: 'Sol Ring', quantity: 1 }, { name: 'Plains', quantity: 6 }]);
    const missing = getMissingCardsForDeck([{ name: 'Sol Ring', count: 1 }], [{ name: 'Plains', count: 7 }, { name: 'Arcane Signet', count: 1 }]);
    expect(missing).toEqual([
      { name: 'Plains', needed: 7, owned: 6, missing: 1, isBasicLand: true },
      { name: 'Arcane Signet', needed: 1, owned: 0, missing: 1, isBasicLand: false },
    ]);
  });

  it('recognizes standard and snow-covered basic lands', () => {
    expect(isBasicLandName('Snow-Covered Island')).toBe(true);
    expect(isBasicLandName('Command Tower')).toBe(false);
  });

  it('excludes unpriced cards instead of assigning a placeholder market value', () => {
    const result = calculateCollectionValuation([
      { name: 'Priced Card', quantity: 2, setCode: 'abc' },
      { name: 'Unpriced Card', quantity: 3, setCode: 'xyz' },
    ], new Map([['priced card', 4.25]]), '2026-10-15');
    expect(result.totalEquityUsd).toBe(8.5);
    expect(result.pricedCardCount).toBe(2);
    expect(result.unpricedCardCount).toBe(3);
    expect(result.setBreakdowns.find((row) => row.setCode === 'XYZ')?.totalValueUsd).toBe(0);
    expect(result.snapshotDate).toBe('2026-10-15');
  });

  it('prefers a current exact-printing lookup over a generic same-name price', () => {
    const result = calculateCollectionValuation([
      { name: 'Same Name', quantity: 1, setCode: 'aaa' },
      { name: 'Same Name', quantity: 1, setCode: 'bbb' },
    ], new Map([['same name', 99]]), '2026-10-15', (card) => card.setCode === 'aaa' ? 1.25 : 2.5, '2026-10-15T08:00:00.000Z');
    expect(result.totalEquityUsd).toBe(3.75);
    expect(result.pricedCardCount).toBe(2);
    expect(result.refreshedAt).toBe('2026-10-15T08:00:00.000Z');
  });
});
