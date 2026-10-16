import { describe, expect, it } from 'vitest';
import {
  LOCAL_WORKSPACE_BACKUP_FORMAT,
  LOCAL_WORKSPACE_BACKUP_VERSION,
  clearLocalWorkspace,
  restoreLocalWorkspaceBackup,
  validateLocalWorkspaceBackup,
} from './localWorkspace';
import { loadOwnedCollection } from './manaboxParser';
import { EMPTY_COLLECTION_PLANNER } from './collectionPlanner';
import { EMPTY_LIMITED_WORKSPACE } from './limitedDeckBuilder';

const validBackup = {
  format: LOCAL_WORKSPACE_BACKUP_FORMAT,
  version: LOCAL_WORKSPACE_BACKUP_VERSION,
  exportedAt: '2026-10-15T00:00:00.000Z',
  collection: [{ name: 'Sol Ring', quantity: 1, setCode: 'cmr', collectorNumber: '351' }],
  commanderDecks: [{
    id: 'deck-1',
    commanderName: 'Queen Marchesa',
    deckName: 'Mardu control',
    colors: ['W', 'B', 'R'],
    theme: 'Control',
    status: 'Active',
    wins: 4,
    notes: 'Local note',
    addedAt: 1760000000000,
  }],
  savedDecklists: [{
    deckKey: 'cmr:deck-slug',
    name: 'Example Precon',
    source: 'commander-precon',
    href: '/deck/cmr/example-precon',
    deckJson: JSON.stringify({ commander: [{ name: 'Commander', quantity: 1 }], main: [{ name: 'Sol Ring', quantity: 1 }] }),
    updatedAt: 1760000000000,
  }],
  duelInventories: { a: '4 Sol Ring', b: '4 Island', sideboardA: '2 Negate', savedThemes: [{ id: 'theme-1', name: 'Marchesa Control', themeId: 'control', slot: 'a', savedAt: 1760000000000 }] },
  valuationHistory: [{ date: '2026-10-15', totalCards: 1, estimatedValueUsd: 1.25, pricedCardCount: 1, unpricedCardCount: 0, priceAsOf: '2026-10-15', refreshedAt: '2026-10-15T08:00:00.000Z' }],
  collectionPlanner: EMPTY_COLLECTION_PLANNER,
  limitedWorkspace: EMPTY_LIMITED_WORKSPACE,
};

describe('local workspace backup validation', () => {
  it('accepts a complete versioned backup with valid local records', () => {
    expect(validateLocalWorkspaceBackup(validBackup)).toBe(true);
  });

  it('rejects malformed sideboards, saved themes, and valuation coverage in backups', () => {
    expect(validateLocalWorkspaceBackup({ ...validBackup, duelInventories: { ...validBackup.duelInventories, sideboardA: 12 } })).toBe(false);
    expect(validateLocalWorkspaceBackup({ ...validBackup, duelInventories: { ...validBackup.duelInventories, savedThemes: [{ id: '', name: '', themeId: '', slot: 'c', savedAt: 'bad' }] } })).toBe(false);
    expect(validateLocalWorkspaceBackup({ ...validBackup, valuationHistory: [{ ...validBackup.valuationHistory[0], pricedCardCount: -1 }] })).toBe(false);
  });

  it('rejects unknown versions, invalid quantities, and incomplete payloads', () => {
    expect(validateLocalWorkspaceBackup({ ...validBackup, version: 3 })).toBe(false);
    expect(validateLocalWorkspaceBackup({ ...validBackup, version: 1, collectionPlanner: undefined, limitedWorkspace: undefined })).toBe(true);
    expect(validateLocalWorkspaceBackup({ ...validBackup, collection: [{ name: 'Sol Ring', quantity: 0 }] })).toBe(false);
    expect(validateLocalWorkspaceBackup({ format: LOCAL_WORKSPACE_BACKUP_FORMAT })).toBe(false);
  });

  it('rejects saved deck payloads that are not valid card-list JSON', () => {
    const invalid = {
      ...validBackup,
      savedDecklists: [{ ...validBackup.savedDecklists[0], deckJson: '{bad json' }],
    };
    expect(validateLocalWorkspaceBackup(invalid)).toBe(false);
  });

  it('rejects external navigation targets embedded in a backup', () => {
    const invalid = {
      ...validBackup,
      savedDecklists: [{ ...validBackup.savedDecklists[0], href: 'javascript:alert(1)' }],
    };
    expect(validateLocalWorkspaceBackup(invalid)).toBe(false);
  });

  it('restores a complete backup locally and clears its workspace records', () => {
    const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(),
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      get length() { return values.size; },
    } as Storage;
    let changedEvent: string | null = null;
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: storage, dispatchEvent: (event: Event) => { changedEvent = event.type; return true; } },
    });
    try {
      values.set('mtg_tracker_manabox_collection_v1', 'legacy');
      restoreLocalWorkspaceBackup(validBackup);
      expect(loadOwnedCollection()).toEqual(validBackup.collection);
      expect(storage.getItem('mtg_tracker_manabox_collection_v1')).toBeNull();
      expect(storage.getItem('mtg_dupe_deck_a_sideboard')).toBe('2 Negate');
      expect(storage.getItem('mtg_dupe_deck_saved_themes_v1')).toContain('Marchesa Control');
      expect(changedEvent).toBeTruthy();

      clearLocalWorkspace();
      expect(loadOwnedCollection()).toEqual([]);
      expect(storage.getItem('mtg_tracker_local_saved_decks_v1')).toBeNull();
      expect(storage.getItem('mtg_tracker_valuation_history_v1')).toBeNull();
      expect(storage.getItem('mtg_tracker_collection_planner_v1')).toBeNull();
      expect(storage.getItem('mtg_tracker_limited_workspace_v1')).toBeNull();
      expect(storage.getItem('mtg_dupe_deck_a_sideboard')).toBeNull();
      expect(storage.getItem('mtg_dupe_deck_saved_themes_v1')).toBeNull();
    } finally {
      if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
      else Reflect.deleteProperty(globalThis, 'localStorage');
      if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
      else Reflect.deleteProperty(globalThis, 'window');
    }
  });
});
