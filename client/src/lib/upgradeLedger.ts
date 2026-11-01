export type UpgradeLedgerAction = 'add' | 'cut' | 'borrow' | 'return' | 'substitute' | 'buy';
export type UpgradeLedgerStatus = 'planned' | 'applied' | 'reverted';

export interface UpgradeLedgerEntry {
  id: string;
  deckSlug: string;
  deckName: string;
  cardName: string;
  action: UpgradeLedgerAction;
  status: UpgradeLedgerStatus;
  sourceDeckSlug?: string;
  sourceLabel?: string;
  replacementFor?: string;
  createdAt: string;
  appliedAt?: string;
  note?: string;
}

const STORAGE_KEY = 'mtg_tracker_upgrade_ledger_v1';

function isEntry(value: unknown): value is UpgradeLedgerEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<UpgradeLedgerEntry>;
  return typeof entry.id === 'string' && typeof entry.deckSlug === 'string' && typeof entry.deckName === 'string'
    && typeof entry.cardName === 'string' && ['add', 'cut', 'borrow', 'return', 'substitute', 'buy'].includes(entry.action || '')
    && ['planned', 'applied', 'reverted'].includes(entry.status || '') && typeof entry.createdAt === 'string';
}

export function loadUpgradeLedger(): UpgradeLedgerEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch (error) {
    console.warn('Failed to load upgrade ledger', error);
    return [];
  }
}

export function saveUpgradeLedger(entries: UpgradeLedgerEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('Failed to save upgrade ledger', error);
  }
}

export function appendUpgradeLedgerEntry(entry: UpgradeLedgerEntry): UpgradeLedgerEntry[] {
  const updated = [...loadUpgradeLedger().filter((item) => item.id !== entry.id), entry];
  saveUpgradeLedger(updated);
  return updated;
}

export function setUpgradeLedgerStatus(id: string, status: UpgradeLedgerStatus): UpgradeLedgerEntry[] {
  const updated = loadUpgradeLedger().map((entry) => entry.id === id ? { ...entry, status, appliedAt: status === 'applied' ? new Date().toISOString() : entry.appliedAt } : entry);
  saveUpgradeLedger(updated);
  return updated;
}

export function summarizeUpgradeLedger(entries: UpgradeLedgerEntry[]) {
  return {
    total: entries.length,
    planned: entries.filter((entry) => entry.status === 'planned').length,
    applied: entries.filter((entry) => entry.status === 'applied').length,
    reverted: entries.filter((entry) => entry.status === 'reverted').length,
    borrowed: entries.filter((entry) => entry.action === 'borrow' && entry.status !== 'reverted').length,
  };
}
