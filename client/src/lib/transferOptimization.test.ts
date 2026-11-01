import { describe, expect, it } from 'vitest';
import { optimizeTransferCoverage } from './transferOptimization';
import type { RawCommanderDeck } from '@/data/commanderDecklistsData';

function deck(name: string, cards: Array<[string, number]>): RawCommanderDeck {
  return { name, set_code: 'tst', set_name: 'Test', cards: cards.map(([cardName, count]) => ({ name: cardName, count, set_code: 'tst', number: '1' })), commander: [], synopsis: '', approxValue: 0 };
}

describe('transfer optimization', () => {
  it('maximizes combined coverage while assigning shared copies deterministically', () => {
    const result = optimizeTransferCoverage([
      { deck: deck('Simic target', [['Shared Ramp', 1], ['Simic Draw', 1]]), colorGroup: 'Simic' },
      { deck: deck('Dimir target', [['Shared Ramp', 1], ['Dimir Removal', 1]]), colorGroup: 'Dimir' },
    ], [
      { name: 'Shared Ramp', quantity: 1 },
      { name: 'Simic Draw', quantity: 1 },
      { name: 'Dimir Removal', quantity: 1 },
    ]);

    expect(result.totalMatchedCopies).toBe(3);
    expect(result.weightedCoveragePercent).toBe(75);
    expect(result.targetCoverage.map((row) => row.matchedCopies)).toEqual([2, 1]);
    expect(result.unassignedCopies).toBe(0);
  });

  it('does not assign irrelevant inventory cards', () => {
    const result = optimizeTransferCoverage([
      { deck: deck('Simic target', [['Simic Draw', 1]]), colorGroup: 'Simic' },
    ], [{ name: 'Giada, Font of Hope', quantity: 2 }]);

    expect(result.totalMatchedCopies).toBe(0);
    expect(result.assignments).toEqual([]);
    expect(result.unassignedCopies).toBe(2);
  });
});
