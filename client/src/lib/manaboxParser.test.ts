import { describe, expect, it } from 'vitest';
import { mergeOwnedCollection, parseManaBoxImport, possiblePrintingMatches } from './manaboxParser';

describe('parseManaBoxImport', () => {
  it('parses ManaBox-style CSV exports with quantity, set, and collector number', () => {
    const cards = parseManaBoxImport([
      'Name,Quantity,Set,Collector Number',
      'Sol Ring,2,cmr,351',
      'Queen Marchesa,1,cn2,45',
    ].join('\n'));

    expect(cards).toEqual([
      { name: 'Sol Ring', quantity: 2, setCode: 'cmr', collectorNumber: '351' },
      { name: 'Queen Marchesa', quantity: 1, setCode: 'cn2', collectorNumber: '45' },
    ]);
  });

  it('aggregates duplicate text-list entries while preserving usable quantities', () => {
    const cards = parseManaBoxImport('1x Sol Ring\n3 Sol Ring\n1 Alesha, Who Smiles at Death');

    expect(cards).toEqual([
      { name: 'Sol Ring', quantity: 4 },
      { name: 'Alesha, Who Smiles at Death', quantity: 1 },
    ]);
  });

  it('does not double-count an exact-printing re-import', () => {
    const existing = [{ name: 'Sol Ring', quantity: 2, setCode: 'cmr', collectorNumber: '351' }];
    const incoming = [{ name: 'Sol Ring', quantity: 2, setCode: 'cmr', collectorNumber: '351' }];
    const result = mergeOwnedCollection(existing, incoming);
    expect(result.cards[0]?.quantity).toBe(2);
    expect(result.report.duplicateEntries).toHaveLength(1);
    expect(result.report.mergedQuantity).toBe(0);
  });

  it('surfaces candidates for a name-only import but never chooses a printing automatically', () => {
    const existing = [
      { name: 'Sol Ring', quantity: 1, setCode: 'cmr', collectorNumber: '351' },
      { name: 'Sol Ring', quantity: 1, setCode: 'm21', collectorNumber: '254' },
    ];
    const ambiguous = parseManaBoxImport('1 Sol Ring');
    expect(Array.from(possiblePrintingMatches(existing, ambiguous).values())[0]).toHaveLength(2);
    const exact = parseManaBoxImport('Name,Quantity,Set,Collector Number\nSol Ring,1,CMR,351');
    expect(possiblePrintingMatches(existing, exact).size).toBe(0);
  });
});
