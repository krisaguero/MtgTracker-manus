export interface OwnedPreconEntry {
  deckSlug: string;
  setName: string;
  setCode: string;
  addedAt: number;
}

const STORAGE_KEY = 'mtg_tracker_owned_precons_v1';

export function loadOwnedPrecons(): OwnedPreconEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
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
  let updated: OwnedPreconEntry[];
  if (exists) {
    updated = current.filter((e) => e.deckSlug.toLowerCase() !== deckSlug.toLowerCase());
  } else {
    // Duplicate protection: ensure no exact duplicate is added
    updated = [...current, { deckSlug, setName, setCode, addedAt: Date.now() }];
  }
  saveOwnedPrecons(updated);
  return updated;
}

export function isPreconOwned(deckSlug: string): boolean {
  const current = loadOwnedPrecons();
  return current.some((e) => e.deckSlug.toLowerCase() === deckSlug.toLowerCase());
}
