export const STORAGE_KEY_DECK_A = "mtg_dupe_deck_a_inventory";
export const STORAGE_KEY_DECK_B = "mtg_dupe_deck_b_inventory";
export const STORAGE_KEY_SIDEBOARD_A = "mtg_dupe_deck_a_sideboard";
export const STORAGE_KEY_SIDEBOARD_B = "mtg_dupe_deck_b_sideboard";
export const STORAGE_KEY_SAVED_THEMES = "mtg_dupe_deck_saved_themes_v1";

export interface SavedDuelTheme {
  id: string;
  name: string;
  themeId: string;
  slot: 'a' | 'b';
  savedAt: number;
}

export interface DuelInventories {
  a: string;
  b: string;
  sideboardA?: string;
  sideboardB?: string;
  savedThemes?: SavedDuelTheme[];
}

const DEFAULT_DECK_A = `4 Lightning Bolt\n4 Counterspell\n4 Delver of Secrets\n4 Monastery Swiftspear\n4 Consider\n4 Island\n4 Mountain\n4 Steam Vents\n4 Soul Warden\n4 Ajani's Pridemate`;
const DEFAULT_DECK_B = `4 Dark Ritual\n4 Hymn to Tourach\n4 Hypnotic Specter\n4 Negator\n4 Thoughtseize\n4 Swamp\n4 Underground Sea\n4 Bloodstained Mire\n4 Brainstorm\n4 Ponder`;

export function loadSavedInventory(deckId: 'a' | 'b'): string {
  if (typeof window === "undefined") return deckId === 'a' ? DEFAULT_DECK_A : DEFAULT_DECK_B;
  try {
    const val = window.localStorage.getItem(deckId === 'a' ? STORAGE_KEY_DECK_A : STORAGE_KEY_DECK_B);
    if (val !== null) return val;
  } catch { /* ignore */ }
  return deckId === 'a' ? DEFAULT_DECK_A : DEFAULT_DECK_B;
}

export function saveSavedInventory(deckId: 'a' | 'b', text: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(deckId === 'a' ? STORAGE_KEY_DECK_A : STORAGE_KEY_DECK_B, text); } catch { /* ignore */ }
}

export function loadSideboard(slot: 'a' | 'b'): string {
  if (typeof window === 'undefined') return '';
  try { return window.localStorage.getItem(slot === 'a' ? STORAGE_KEY_SIDEBOARD_A : STORAGE_KEY_SIDEBOARD_B) ?? ''; } catch { return ''; }
}

export function saveSideboard(slot: 'a' | 'b', text: string): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(slot === 'a' ? STORAGE_KEY_SIDEBOARD_A : STORAGE_KEY_SIDEBOARD_B, text); } catch { /* ignore */ }
}

function isSavedTheme(item: unknown): item is SavedDuelTheme {
  if (!item || typeof item !== 'object') return false;
  const theme = item as Partial<SavedDuelTheme>;
  return typeof theme.id === 'string' && theme.id.length > 0 && theme.id.length <= 160
    && typeof theme.name === 'string' && theme.name.trim().length > 0 && theme.name.length <= 120
    && typeof theme.themeId === 'string' && theme.themeId.length <= 100
    && (theme.slot === 'a' || theme.slot === 'b')
    && typeof theme.savedAt === 'number' && Number.isFinite(theme.savedAt);
}

export function loadSavedThemes(): SavedDuelTheme[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY_SAVED_THEMES) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isSavedTheme) : [];
  } catch { return []; }
}

export function saveDuelTheme(theme: SavedDuelTheme): SavedDuelTheme[] {
  const themes = [theme, ...loadSavedThemes().filter((item) => item.id !== theme.id)];
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY_SAVED_THEMES, JSON.stringify(themes));
  return themes;
}

export function loadSavedInventories(): DuelInventories {
  return { a: loadSavedInventory('a'), b: loadSavedInventory('b') };
}

export function loadStoredInventories(): DuelInventories {
  if (typeof window === "undefined") return { a: '', b: '', sideboardA: '', sideboardB: '', savedThemes: [] };
  try {
    return {
      a: window.localStorage.getItem(STORAGE_KEY_DECK_A) ?? '',
      b: window.localStorage.getItem(STORAGE_KEY_DECK_B) ?? '',
      sideboardA: window.localStorage.getItem(STORAGE_KEY_SIDEBOARD_A) ?? '',
      sideboardB: window.localStorage.getItem(STORAGE_KEY_SIDEBOARD_B) ?? '',
      savedThemes: loadSavedThemes(),
    };
  } catch { return { a: '', b: '', sideboardA: '', sideboardB: '', savedThemes: [] }; }
}

export function replaceSavedInventories(inventories: DuelInventories): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_DECK_A, inventories.a);
  window.localStorage.setItem(STORAGE_KEY_DECK_B, inventories.b);
  window.localStorage.setItem(STORAGE_KEY_SIDEBOARD_A, inventories.sideboardA ?? '');
  window.localStorage.setItem(STORAGE_KEY_SIDEBOARD_B, inventories.sideboardB ?? '');
  window.localStorage.setItem(STORAGE_KEY_SAVED_THEMES, JSON.stringify(inventories.savedThemes ?? []));
}

export function clearSavedInventories(): void {
  if (typeof window === "undefined") return;
  for (const key of [STORAGE_KEY_DECK_A, STORAGE_KEY_DECK_B, STORAGE_KEY_SIDEBOARD_A, STORAGE_KEY_SIDEBOARD_B, STORAGE_KEY_SAVED_THEMES]) window.localStorage.removeItem(key);
}
