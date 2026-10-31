import { describe, expect, it } from 'vitest';
import { detectInventoryDeckCompletions } from './inventoryDeckCompletion';
import type { RawCommanderDeck } from '@/data/commanderDecklistsData';
import type { OwnedCard } from '@/lib/manaboxParser';

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const deck = (name: string): RawCommanderDeck => ({
  name,
  set_code: 'TST',
  set_name: 'Test Set',
  release_date: '2026-01-01',
  commander: [
    { name: 'Lead Commander', count: 1, set: 'TST', collector_number: '1', uuid: 'c1' },
  ],
  cards: [
    { name: 'Support Card', count: 2, set: 'TST', collector_number: '2', uuid: 'c2' },
  ],
});

const owned = (name: string, quantity: number): OwnedCard => ({
  name,
  quantity,
  set: 'OTHER',
  collectorNumber: '9',
  scryfallId: `${name}-id`,
});

describe('detectInventoryDeckCompletions', () => {
  it('marks a deck complete when scanned quantities cover every required copy', () => {
    const result = detectInventoryDeckCompletions([deck('Complete Deck')], [
      owned('Lead Commander', 1),
      owned('Support Card', 2),
    ], slugify);

    expect(result.get('complete-deck')).toMatchObject({
      matchedCopies: 3,
      totalCopies: 3,
      coveragePercent: 100,
      complete: true,
    });
  });

  it('does not treat partial or name-mismatched inventory as a complete deck', () => {
    const result = detectInventoryDeckCompletions([deck('Partial Deck')], [
      owned('Lead Commander', 1),
      owned('Support Card', 1),
      owned('Unrelated Card', 20),
    ], slugify);

    expect(result.get('partial-deck')).toMatchObject({
      matchedCopies: 2,
      totalCopies: 3,
      coveragePercent: 67,
      complete: false,
    });
  });
});
