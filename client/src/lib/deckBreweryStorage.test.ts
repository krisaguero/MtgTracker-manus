import { describe, expect, it } from 'vitest';
import {
  clearPrivateDeckBreweryBundle,
  countBreweryCopies,
  DECK_BREWERY_STORAGE_KEY,
  formatOriginalBreweryDecklist,
  isDeckBreweryBundle,
  loadPrivateDeckBreweryBundle,
  parseDeckBreweryBundle,
  savePrivateDeckBreweryBundle,
  type DeckBreweryBundle,
  type StorageLike,
} from './deckBreweryStorage';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const validBundle: DeckBreweryBundle = {
  schemaVersion: 1,
  title: 'Private test bundle',
  privacy: 'private-local-only',
  source: 'Private local file',
  caveats: ['No data is uploaded.'],
  edhrecNotes: [{
    commander: 'Example Commander', deckIds: ['123'], url: 'https://edhrec.com/average-decks/example-commander',
    averageSampleLandCount: 35, themes: ['draw'], note: 'Separate idea.', sourceLabel: 'EDHREC average-deck page',
  }],
  decks: [{
    id: '123', name: 'Example', parentFolder: 'Commander Decks', folderPath: ['Commander Decks'],
    sourceUrl: 'https://deckbox.org/sets/123', storedFormat: 'Legacy', displayedType: 'Deck Idea',
    ownerAuthorDisplayed: null, authorNote: 'No author displayed.', notesText: [], notesLinks: [],
    main: [{ name: 'Example Card', quantity: 2 }], sideboard: [{ name: 'Side Card', quantity: 1 }],
    mainCopiesExported: 2, sideboardCopiesExported: 1, mainCopiesListed: 2, sideboardCopiesListed: 1,
    mainLandCopies: 0, contextualTarget: 100, status: 'under_target', reviewFlags: [], exportStatus: 'exported',
    scratchpad: { listedCount: 0, exportedCount: 0 },
  }],
};

describe('private Deck Brewery bundle storage', () => {
  it('validates, parses, and saves a supported private import under a dedicated key', () => {
    const storage = new MemoryStorage();
    expect(isDeckBreweryBundle(validBundle)).toBe(true);
    expect(parseDeckBreweryBundle(JSON.stringify(validBundle))).toEqual(validBundle);
    savePrivateDeckBreweryBundle(validBundle, storage);
    expect(storage.getItem(DECK_BREWERY_STORAGE_KEY)).not.toBeNull();
    expect(loadPrivateDeckBreweryBundle(storage)).toEqual(validBundle);
  });

  it('keeps original main and sideboard sections separate in the text export', () => {
    const exported = formatOriginalBreweryDecklist(validBundle.decks[0]);
    expect(exported).toContain('Deck\n2 Example Card');
    expect(exported).toContain('Sideboard\n1 Side Card');
    expect(exported).not.toContain('3 Example Card');
    expect(countBreweryCopies(validBundle.decks[0].main)).toBe(2);
  });

  it('rejects malformed JSON and external URLs outside the expected provenance domains', () => {
    expect(() => parseDeckBreweryBundle('{')).toThrow('not valid JSON');
    const unsafe = structuredClone(validBundle);
    unsafe.decks[0].sourceUrl = 'http://deckbox.org/sets/123';
    expect(isDeckBreweryBundle(unsafe)).toBe(false);
  });

  it('clears only the private Brewery storage key', () => {
    const storage = new MemoryStorage();
    storage.setItem('unrelated-local-setting', 'keep');
    savePrivateDeckBreweryBundle(validBundle, storage);
    clearPrivateDeckBreweryBundle(storage);
    expect(storage.getItem(DECK_BREWERY_STORAGE_KEY)).toBeNull();
    expect(storage.getItem('unrelated-local-setting')).toBe('keep');
  });
});
