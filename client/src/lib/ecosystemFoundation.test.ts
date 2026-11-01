import { describe, expect, it, beforeEach } from 'vitest';
import { buildPreconOwnershipGraph, summarizePreconOwnershipGraph } from './preconOwnershipGraph';
import { addPrintingReviewItem, loadPrintingReviewQueue, updatePrintingReviewStatus } from './printingReviewQueue';
import { appendUpgradeLedgerEntry, loadUpgradeLedger, summarizeUpgradeLedger } from './upgradeLedger';
import type { RawCommanderDeck } from '@/data/commanderDecklistsData';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    clear: () => storage.clear(),
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
});

const deck: RawCommanderDeck = {
  name: 'Test Precon', set_code: 'tst', set_name: 'Test', cards: [{ name: 'Ramp', set_code: 'tst', number: '1', count: 1 }], commander: [{ name: 'Lead', set_code: 'tst', number: '0', count: 1 }], synopsis: '', approxValue: 0,
};

beforeEach(() => localStorage.clear());

describe('ecosystem foundation', () => {
  it('connects a sealed precon record to scan coverage without changing inventory', () => {
    const graph = buildPreconOwnershipGraph([{ deckSlug: 'test-precon', setName: 'Test', setCode: 'tst', addedAt: 1, quantity: 1, costBasisUsd: 20 }], [deck], [{ name: 'Ramp', quantity: 1 }], (value) => value.toLowerCase().replaceAll(' ', '-'));
    expect(graph[0].state).toBe('partially_reconciled');
    expect(graph[0].coveragePercent).toBe(50);
    expect(summarizePreconOwnershipGraph(graph).totalCostBasisUsd).toBe(20);
  });

  it('persists and resolves printing-review decisions', () => {
    addPrintingReviewItem({ id: 'one', source: 'csv', rawName: 'Ramp', quantity: 1, confidence: 'low', createdAt: '2026-10-31T00:00:00Z' });
    expect(loadPrintingReviewQueue()).toHaveLength(1);
    updatePrintingReviewStatus('one', 'accepted');
    expect(loadPrintingReviewQueue()[0].status).toBe('accepted');
  });

  it('keeps upgrade ledger status counts explicit', () => {
    appendUpgradeLedgerEntry({ id: 'one', deckSlug: 'test-precon', deckName: 'Test Precon', cardName: 'Ramp', action: 'add', status: 'planned', createdAt: '2026-10-31T00:00:00Z' });
    appendUpgradeLedgerEntry({ id: 'two', deckSlug: 'test-precon', deckName: 'Test Precon', cardName: 'Slow Card', action: 'cut', status: 'applied', createdAt: '2026-10-31T00:00:00Z' });
    expect(summarizeUpgradeLedger(loadUpgradeLedger())).toMatchObject({ total: 2, planned: 1, applied: 1 });
  });
});
