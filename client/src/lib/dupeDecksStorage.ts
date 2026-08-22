const STORAGE_KEY_DECK_A = "mtg_dupe_deck_a_inventory";
const STORAGE_KEY_DECK_B = "mtg_dupe_deck_b_inventory";

const DEFAULT_DECK_A = `4 Lightning Bolt\n4 Counterspell\n4 Delver of Secrets\n4 Monastery Swiftspear\n4 Consider\n4 Island\n4 Mountain\n4 Steam Vents\n4 Soul Warden\n4 Ajani's Pridemate`;
const DEFAULT_DECK_B = `4 Dark Ritual\n4 Hymn to Tourach\n4 Hypnotic Specter\n4 Negator\n4 Thoughtseize\n4 Swamp\n4 Underground Sea\n4 Bloodstained Mire\n4 Brainstorm\n4 Ponder`;

export function loadSavedInventory(deckId: 'a' | 'b'): string {
  if (typeof window === "undefined") return deckId === 'a' ? DEFAULT_DECK_A : DEFAULT_DECK_B;
  try {
    const val = window.localStorage.getItem(deckId === 'a' ? STORAGE_KEY_DECK_A : STORAGE_KEY_DECK_B);
    if (val !== null) return val;
  } catch {
    // ignore
  }
  return deckId === 'a' ? DEFAULT_DECK_A : DEFAULT_DECK_B;
}

export function saveSavedInventory(deckId: 'a' | 'b', text: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(deckId === 'a' ? STORAGE_KEY_DECK_A : STORAGE_KEY_DECK_B, text);
  } catch {
    // ignore
  }
}
