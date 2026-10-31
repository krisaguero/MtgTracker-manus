import type { LocalWorkspaceBackup } from './localWorkspace';

export type WorkspaceConflictState = 'local-newer' | 'account-newer' | 'same' | 'local-only' | 'account-only';

export interface WorkspaceSummary {
  collectionCards: number;
  collectionCopies: number;
  commanderDecks: number;
  savedDecks: number;
  ownedPrecons: number;
  valuationSnapshots: number;
  bytes: number;
  exportedAt: string;
}

export function summarizeWorkspace(backup: LocalWorkspaceBackup): WorkspaceSummary {
  return {
    collectionCards: backup.collection.length,
    collectionCopies: backup.collection.reduce((sum, card) => sum + card.quantity, 0),
    commanderDecks: backup.commanderDecks.length,
    savedDecks: backup.savedDecklists.length,
    ownedPrecons: backup.ownedPrecons?.length ?? 0,
    valuationSnapshots: backup.valuationHistory.length,
    bytes: JSON.stringify(backup).length,
    exportedAt: backup.exportedAt,
  };
}

export function compareWorkspace(local: LocalWorkspaceBackup | null, account: LocalWorkspaceBackup | null, accountUpdatedAt?: string): WorkspaceConflictState {
  if (!local && !account) return 'same';
  if (!local) return 'account-only';
  if (!account) return 'local-only';
  const localTime = Date.parse(local.exportedAt);
  const accountTime = Date.parse(accountUpdatedAt || account.exportedAt);
  if (localTime === accountTime) return 'same';
  return localTime > accountTime ? 'local-newer' : 'account-newer';
}

function cardKey(card: LocalWorkspaceBackup['collection'][number]) {
  return [card.name, card.setCode, card.collectorNumber, card.finish, card.condition, card.language].map(value => value || '').join('|').toLowerCase();
}

/** Merge without summing duplicate scanned copies; local records win on conflicts. */
export function mergeWorkspaces(local: LocalWorkspaceBackup, account: LocalWorkspaceBackup): LocalWorkspaceBackup {
  const cards = new Map<string, LocalWorkspaceBackup['collection'][number]>();
  for (const card of account.collection) cards.set(cardKey(card), card);
  for (const card of local.collection) {
    const key = cardKey(card);
    const existing = cards.get(key);
    cards.set(key, existing ? { ...existing, ...card, quantity: Math.max(existing.quantity, card.quantity) } : card);
  }

  const decks = new Map(account.commanderDecks.map(deck => [deck.id, deck]));
  for (const deck of local.commanderDecks) decks.set(deck.id, deck);
  const saved = new Map(account.savedDecklists.map(deck => [deck.deckKey, deck]));
  for (const deck of local.savedDecklists) {
    const existing = saved.get(deck.deckKey);
    if (!existing || deck.updatedAt >= existing.updatedAt) saved.set(deck.deckKey, deck);
  }
  const precons = new Map((account.ownedPrecons ?? []).map(entry => [entry.deckSlug.toLowerCase(), entry]));
  for (const entry of local.ownedPrecons ?? []) precons.set(entry.deckSlug.toLowerCase(), entry);
  const history = new Map<string, LocalWorkspaceBackup['valuationHistory'][number]>();
  for (const snapshot of [...account.valuationHistory, ...local.valuationHistory]) history.set(snapshot.date, snapshot);

  return {
    ...local,
    exportedAt: new Date().toISOString(),
    collection: Array.from(cards.values()),
    commanderDecks: Array.from(decks.values()),
    savedDecklists: Array.from(saved.values()),
    ownedPrecons: Array.from(precons.values()),
    valuationHistory: Array.from(history.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}
