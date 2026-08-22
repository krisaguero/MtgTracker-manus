import { describe, expect, it } from 'vitest';
import { parseManaBoxImport } from './manaboxParser';

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
});
