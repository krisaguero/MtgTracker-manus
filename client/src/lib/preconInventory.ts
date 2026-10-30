export interface OwnedPreconEntry {
  deckSlug: string;
  setName: string;
  setCode: string;
  addedAt: number;
  quantity?: number;
  costBasisUsd?: number;
  acquiredAt?: string;
  acquisitionSource?: string;
  includedBoosters?: number;
  notes?: string;
}

const STORAGE_KEY = 'mtg_tracker_owned_precons_v1';

function isValidEntry(value: unknown): value is OwnedPreconEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<OwnedPreconEntry>;
  return typeof entry.deckSlug === 'string' && entry.deckSlug.length > 0
    && typeof entry.setName === 'string'
    && typeof entry.setCode === 'string'
    && typeof entry.addedAt === 'number'
    && (entry.quantity === undefined || (Number.isInteger(entry.quantity) && entry.quantity > 0))
    && (entry.costBasisUsd === undefined || (typeof entry.costBasisUsd === 'number' && Number.isFinite(entry.costBasisUsd) && entry.costBasisUsd >= 0))
    && (entry.acquiredAt === undefined || (typeof entry.acquiredAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.acquiredAt)))
    && (entry.acquisitionSource === undefined || typeof entry.acquisitionSource === 'string')
    && (entry.includedBoosters === undefined || (Number.isInteger(entry.includedBoosters) && entry.includedBoosters >= 0))
    && (entry.notes === undefined || typeof entry.notes === 'string');
}

export function loadOwnedPrecons(): OwnedPreconEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidEntry) : [];
  } catch (err) {
    console.warn('Failed to load owned precons', err);
  }
  return [];
}

export function saveOwnedPrecons(entries: OwnedPreconEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save owned precons', err);
  }
}

export function toggleOwnedPrecon(deckSlug: string, setName: string, setCode: string): OwnedPreconEntry[] {
  const current = loadOwnedPrecons();
  const exists = current.some((e) => e.deckSlug.toLowerCase() === deckSlug.toLowerCase());
  const updated = exists
    ? current.filter((e) => e.deckSlug.toLowerCase() !== deckSlug.toLowerCase())
    : [...current, { deckSlug, setName, setCode, addedAt: Date.now(), quantity: 1 }];
  saveOwnedPrecons(updated);
  return updated;
}

export interface PreconAcquisitionInput {
  deckSlug: string;
  setName: string;
  setCode: string;
  costBasisUsd: number;
  acquiredAt: string;
  acquisitionSource?: string;
  includedBoosters?: number;
  notes?: string;
  quantity?: number;
}

/** Record or replace the cost basis for a sealed precon acquisition without creating a duplicate checklist row. */
export function recordPreconAcquisition(input: PreconAcquisitionInput): OwnedPreconEntry[] {
  const current = loadOwnedPrecons();
  const normalizedSlug = input.deckSlug.toLowerCase();
  const existing = current.find((entry) => entry.deckSlug.toLowerCase() === normalizedSlug);
  const record: OwnedPreconEntry = {
    deckSlug: input.deckSlug,
    setName: input.setName,
    setCode: input.setCode,
    addedAt: existing?.addedAt || Date.now(),
    quantity: input.quantity || existing?.quantity || 1,
    costBasisUsd: Number(input.costBasisUsd.toFixed(2)),
    acquiredAt: input.acquiredAt,
    acquisitionSource: input.acquisitionSource?.trim() || undefined,
    includedBoosters: input.includedBoosters,
    notes: input.notes?.trim() || undefined,
  };
  const updated = existing
    ? current.map((entry) => entry.deckSlug.toLowerCase() === normalizedSlug ? record : entry)
    : [...current, record];
  saveOwnedPrecons(updated);
  return updated;
}

export function isPreconOwned(deckSlug: string): boolean {
  const current = loadOwnedPrecons();
  return current.some((e) => e.deckSlug.toLowerCase() === deckSlug.toLowerCase());
}
