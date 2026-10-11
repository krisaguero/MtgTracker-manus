import { describe, expect, it } from 'vitest';
import { buildOwnedMap, resolveOwnership } from './cardOwnership';

describe('cardOwnership', () => {
  const map = buildOwnedMap([
    { name: 'Sol Ring', quantity: 1 },
    { name: 'Forest', quantity: 4 },
    { name: 'forest', quantity: 6 },
    { name: 'Island', quantity: 3 },
    { name: '  ', quantity: 9 },
  ]);

  it('sums duplicate printings case-insensitively and ignores blank names', () => {
    expect(map.get('forest')).toBe(10);
    expect(map.has('')).toBe(false);
  });

  it('marks fully covered entries as owned', () => {
    expect(resolveOwnership('Sol Ring', 1, map)).toEqual({ status: 'owned', ownedQty: 1, neededQty: 1, shortfall: 0 });
    expect(resolveOwnership('SOL RING', 1, map).status).toBe('owned');
  });

  it('marks partially covered entries with the remaining shortfall', () => {
    expect(resolveOwnership('Island', 5, map)).toEqual({ status: 'partial', ownedQty: 3, neededQty: 5, shortfall: 2 });
  });

  it('marks absent cards as missing', () => {
    expect(resolveOwnership('Mana Crypt', 1, map)).toEqual({ status: 'missing', ownedQty: 0, neededQty: 1, shortfall: 1 });
  });

  it('returns unknown for every card when no collection is imported', () => {
    expect(resolveOwnership('Sol Ring', 1, new Map()).status).toBe('unknown');
  });
});
