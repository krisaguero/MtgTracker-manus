import { describe, expect, it } from 'vitest';
import { bridgePackageSummary, planBridgeTransfers } from './bridgeTransferPlanning';
import type { RawCommanderDeck } from '@/data/commanderDecklistsData';

const sourceDeck = {
  name: 'Abzan Armor',
  set_code: 'tdc',
  set_name: 'Test',
  cards: [
    { name: 'Assault Formation', set_code: 'tdc', number: '1', count: 1 },
    { name: 'Wall of Omens', set_code: 'tdc', number: '2', count: 1 },
  ],
  commander: [],
} as RawCommanderDeck;

describe('bridge transfer planning', () => {
  it('reserves source-deck copies and exposes only surplus copies', () => {
    const rows = planBridgeTransfers([
      { name: 'Assault Formation', quantity: 1 },
      { name: 'Wall of Omens', quantity: 2 },
      { name: 'Wall of Blossoms', quantity: 0 },
    ], sourceDeck);
    expect(rows.find(row => row.name === 'Assault Formation')).toMatchObject({ totalOwned: 1, reservedForSource: 1, transferable: 0, status: 'conditional' });
    expect(rows.find(row => row.name === 'Wall of Omens')).toMatchObject({ totalOwned: 2, reservedForSource: 1, transferable: 1, status: 'transferable' });
    expect(rows.find(row => row.name === 'Wall of Blossoms')).toMatchObject({ status: 'buy' });
  });

  it('summarizes a package for the staged bridge workflow', () => {
    const rows = planBridgeTransfers([{ name: 'Assault Formation', quantity: 2 }], sourceDeck);
    expect(bridgePackageSummary(rows, 'A')).toMatchObject({ total: 5, transferable: 1, conditional: 0, buy: 4, complete: false });
  });
});
