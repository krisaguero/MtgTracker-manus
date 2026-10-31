import { describe, expect, it } from 'vitest';
import { compareWorkspace, mergeWorkspaces, summarizeWorkspace } from './workspaceConflict';
import type { LocalWorkspaceBackup } from './localWorkspace';

function workspace(overrides: Partial<LocalWorkspaceBackup> = {}): LocalWorkspaceBackup {
  return {
    format: 'mtg-tracker-local-workspace',
    version: 2,
    exportedAt: '2026-10-31T14:00:00.000Z',
    collection: [],
    commanderDecks: [],
    savedDecklists: [],
    duelInventories: { a: [], b: [], sideboardA: [], sideboardB: [] },
    valuationHistory: [],
    ...overrides,
  } as LocalWorkspaceBackup;
}

const card = (name: string, quantity: number, setCode = 'tst', collectorNumber = '1') => ({
  name,
  quantity,
  setCode,
  collectorNumber,
  finish: 'nonfoil' as const,
  condition: 'NM' as const,
  language: 'en',
});

const commanderDeck = (id: string, deckName: string) => ({
  id,
  commanderName: 'Test Commander',
  deckName,
  colors: ['G'],
  theme: 'test',
  status: 'Active' as const,
  addedAt: 1,
});

const savedDeck = (deckKey: string, updatedAt: number, name: string) => ({
  deckKey,
  name,
  source: 'test',
  href: '/deck/tst/test-deck',
  deckJson: JSON.stringify({ commander: [], main: [] }),
  updatedAt,
});

describe('workspace conflict center', () => {
  it('classifies a newer local copy and summarizes both snapshots', () => {
    const local = workspace({ exportedAt: '2026-10-31T14:10:00.000Z', collection: [card('Local Card', 2)] });
    const account = workspace({ exportedAt: '2026-10-31T14:00:00.000Z', collection: [card('Account Card', 1)] });

    expect(compareWorkspace(local, account, '2026-10-31T14:00:00.000Z')).toBe('local-newer');
    expect(summarizeWorkspace(local)).toMatchObject({ collectionCards: 1, collectionCopies: 2 });
    expect(summarizeWorkspace(account)).toMatchObject({ collectionCards: 1, collectionCopies: 1 });
  });

  it('merges both sides, keeps local conflicts, and does not double-count duplicate scans', () => {
    const local = workspace({
      exportedAt: '2026-10-31T14:10:00.000Z',
      collection: [card('Shared Card', 3), card('Local Card', 1)],
      commanderDecks: [commanderDeck('local-deck', 'Local Deck')],
      savedDecklists: [savedDeck('shared', 20, 'Local Version')],
      ownedPrecons: [{ deckSlug: 'avengers-assemble', setName: 'Marvel', setCode: 'mar', addedAt: 1, quantity: 1 }],
      valuationHistory: [{ date: '2026-10-31', totalCards: 4, estimatedValueUsd: 10 }],
    });
    const account = workspace({
      exportedAt: '2026-10-31T14:00:00.000Z',
      collection: [card('Shared Card', 2), card('Account Card', 4)],
      commanderDecks: [commanderDeck('account-deck', 'Account Deck')],
      savedDecklists: [savedDeck('shared', 10, 'Account Version'), savedDeck('account-only', 10, 'Account Only')],
      ownedPrecons: [{ deckSlug: 'fantastic-four', setName: 'Marvel', setCode: 'mar', addedAt: 2, quantity: 1 }],
      valuationHistory: [{ date: '2026-10-30', totalCards: 3, estimatedValueUsd: 8 }],
    });

    const merged = mergeWorkspaces(local, account);
    expect(merged.collection).toHaveLength(3);
    expect(merged.collection.find(item => item.name === 'Shared Card')?.quantity).toBe(3);
    expect(merged.collection.find(item => item.name === 'Account Card')?.quantity).toBe(4);
    expect(merged.commanderDecks.map(deck => deck.id).sort()).toEqual(['account-deck', 'local-deck']);
    expect(merged.savedDecklists.find(deck => deck.deckKey === 'shared')?.name).toBe('Local Version');
    expect(merged.savedDecklists.map(deck => deck.deckKey).sort()).toEqual(['account-only', 'shared']);
    expect(merged.ownedPrecons?.map(entry => entry.deckSlug).sort()).toEqual(['avengers-assemble', 'fantastic-four']);
    expect(merged.valuationHistory.map(snapshot => snapshot.date).sort()).toEqual(['2026-10-30', '2026-10-31']);
    expect(merged.exportedAt).not.toBe(local.exportedAt);
    expect(local.collection).toHaveLength(2);
    expect(account.collection).toHaveLength(2);
    expect(local.savedDecklists[0].name).toBe('Local Version');
    expect(account.savedDecklists[0].name).toBe('Account Version');
  });
});
