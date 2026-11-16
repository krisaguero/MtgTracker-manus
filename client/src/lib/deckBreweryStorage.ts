export interface BreweryCard {
  name: string;
  quantity: number;
  notes?: string[];
}

export interface BreweryLink {
  text?: string;
  url: string;
}

export interface BreweryDeck {
  id: string;
  name: string;
  parentFolder: string;
  folderPath: string[];
  sourceUrl: string;
  storedFormat: string;
  displayedType: string;
  ownerAuthorDisplayed: string | null;
  authorNote: string;
  notesText: string[];
  notesLinks: BreweryLink[];
  main: BreweryCard[];
  sideboard: BreweryCard[];
  mainCopiesExported: number;
  sideboardCopiesExported: number;
  mainCopiesListed: number | null;
  sideboardCopiesListed: number | null;
  mainLandCopies: number;
  contextualTarget: number | null;
  status: string;
  reviewFlags: string[];
  exportStatus: string;
  scratchpad: {
    listedCount: number;
    exportedCount: number;
    sourceMetadata?: unknown;
  };
  completenessSourceMetadata?: unknown;
  priorityRank?: number;
  focusLabel?: string;
  reviewNote?: string;
}

export interface BreweryEdhrecNote {
  commander: string;
  deckIds: string[];
  url: string;
  averageSampleLandCount: number;
  themes: string[];
  note: string;
  sourceLabel: string;
}

export interface DeckBreweryBundle {
  schemaVersion: 1;
  title: string;
  privacy: 'private-local-only';
  source: string;
  caveats: string[];
  edhrecNotes: BreweryEdhrecNote[];
  decks: BreweryDeck[];
}

export const DECK_BREWERY_STORAGE_KEY = 'mtg_tracker_private_brewery_bundle_v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isString(value: unknown, max = 20000): value is string {
  return typeof value === 'string' && value.length <= max;
}

function isStringArray(value: unknown, maxItems = 1000): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => isString(item));
}

function isCard(value: unknown): value is BreweryCard {
  if (!isObject(value) || !isString(value.name, 300) || !value.name.trim()) return false;
  if (!Number.isSafeInteger(value.quantity) || Number(value.quantity) <= 0 || Number(value.quantity) > 1000) return false;
  return value.notes === undefined || isStringArray(value.notes, 100);
}

function isHttpUrl(value: unknown, domain?: string): value is string {
  if (!isString(value, 2000)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (!domain || url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function isBreweryLink(value: unknown): value is BreweryLink {
  return isObject(value)
    && isHttpUrl(value.url)
    && (value.text === undefined || isString(value.text, 500));
}

function isDeck(value: unknown): value is BreweryDeck {
  if (!isObject(value)) return false;
  const requiredStrings: Array<[string, number?]> = [
    ['id', 100], ['name', 300], ['parentFolder', 300], ['sourceUrl', 2000],
    ['storedFormat', 100], ['displayedType', 100], ['authorNote', 10000],
    ['status', 100], ['exportStatus', 100],
  ];
  if (requiredStrings.some(([key, max]) => !isString(value[key], max))) return false;
  if (!isHttpUrl(value.sourceUrl, 'deckbox.org')) return false;
  if (value.ownerAuthorDisplayed !== null && !isString(value.ownerAuthorDisplayed, 300)) return false;
  if (!isStringArray(value.folderPath, 20) || !isStringArray(value.notesText, 200)) return false;
  if (!Array.isArray(value.notesLinks) || value.notesLinks.length > 500 || !value.notesLinks.every(isBreweryLink)) return false;
  if (!Array.isArray(value.main) || value.main.length > 3000 || !value.main.every(isCard)) return false;
  if (!Array.isArray(value.sideboard) || value.sideboard.length > 3000 || !value.sideboard.every(isCard)) return false;
  for (const key of ['mainCopiesExported', 'sideboardCopiesExported', 'mainLandCopies'] as const) {
    if (!Number.isSafeInteger(value[key]) || Number(value[key]) < 0 || Number(value[key]) > 100000) return false;
  }
  for (const key of ['mainCopiesListed', 'sideboardCopiesListed', 'contextualTarget'] as const) {
    if (value[key] !== null && (!Number.isSafeInteger(value[key]) || Number(value[key]) < 0 || Number(value[key]) > 100000)) return false;
  }
  if (!isStringArray(value.reviewFlags, 100)) return false;
  if (!isObject(value.scratchpad)
    || !Number.isSafeInteger(value.scratchpad.listedCount) || Number(value.scratchpad.listedCount) < 0
    || !Number.isSafeInteger(value.scratchpad.exportedCount) || Number(value.scratchpad.exportedCount) < 0) return false;
  if (value.priorityRank !== undefined && (!Number.isSafeInteger(value.priorityRank) || Number(value.priorityRank) < 1)) return false;
  if (value.focusLabel !== undefined && !isString(value.focusLabel, 200)) return false;
  if (value.reviewNote !== undefined && !isString(value.reviewNote, 20000)) return false;
  return true;
}

function isEdhrecNote(value: unknown): value is BreweryEdhrecNote {
  return isObject(value)
    && isString(value.commander, 300)
    && Array.isArray(value.deckIds) && value.deckIds.length <= 500 && value.deckIds.every((id) => isString(id, 100))
    && isHttpUrl(value.url, 'edhrec.com')
    && Number.isSafeInteger(value.averageSampleLandCount) && Number(value.averageSampleLandCount) >= 0 && Number(value.averageSampleLandCount) <= 100
    && isStringArray(value.themes, 100)
    && isString(value.note, 20000)
    && isString(value.sourceLabel, 300);
}

export function isDeckBreweryBundle(value: unknown): value is DeckBreweryBundle {
  return isObject(value)
    && value.schemaVersion === 1
    && isString(value.title, 300)
    && value.privacy === 'private-local-only'
    && isString(value.source, 20000)
    && isStringArray(value.caveats, 100)
    && Array.isArray(value.edhrecNotes) && value.edhrecNotes.length <= 100 && value.edhrecNotes.every(isEdhrecNote)
    && Array.isArray(value.decks) && value.decks.length <= 500 && value.decks.every(isDeck);
}

export function parseDeckBreweryBundle(text: string): DeckBreweryBundle {
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new Error('This file is not valid JSON. Choose the private Brewery import bundle.');
  }
  if (!isDeckBreweryBundle(value)) {
    throw new Error('This file is not a supported Deck Brewery bundle, or it contains invalid deck data.');
  }
  return value;
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadPrivateDeckBreweryBundle(storage = browserStorage()): DeckBreweryBundle | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(DECK_BREWERY_STORAGE_KEY);
    return raw ? parseDeckBreweryBundle(raw) : null;
  } catch {
    return null;
  }
}

export function savePrivateDeckBreweryBundle(bundle: DeckBreweryBundle, storage = browserStorage()): void {
  if (!storage) throw new Error('Browser-local storage is not available.');
  if (!isDeckBreweryBundle(bundle)) throw new Error('The Brewery bundle failed validation and was not saved.');
  storage.setItem(DECK_BREWERY_STORAGE_KEY, JSON.stringify(bundle));
}

export function clearPrivateDeckBreweryBundle(storage = browserStorage()): void {
  storage?.removeItem(DECK_BREWERY_STORAGE_KEY);
}

export function countBreweryCopies(cards: BreweryCard[]): number {
  return cards.reduce((sum, card) => sum + card.quantity, 0);
}

export function formatOriginalBreweryDecklist(deck: BreweryDeck): string {
  const lines = [
    `# ${deck.name}`,
    `# Original folder: ${deck.parentFolder}`,
    `# Deckbox source: ${deck.sourceUrl}`,
    '',
    'Deck',
    ...deck.main.map((card) => `${card.quantity} ${card.name}`),
  ];
  if (deck.sideboard.length) {
    lines.push('', 'Sideboard', ...deck.sideboard.map((card) => `${card.quantity} ${card.name}`));
  }
  return `${lines.join('\n')}\n`;
}
