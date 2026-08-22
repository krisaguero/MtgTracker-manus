import { beforeEach, describe, expect, it } from 'vitest';
import { getMissingCardsForDeck, isBasicLandName } from './collectionAnalytics';
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
});
