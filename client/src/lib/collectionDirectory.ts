import type { OwnedCard } from '@/lib/manaboxParser';
import { collectionIdentity } from '@/lib/manaboxParser';

export type DirectoryDisposition = 'keep' | 'reserve' | 'trade';
export interface DirectoryPolicy { keep: number; reserve: number; disposition?: DirectoryDisposition }
export interface DirectoryState { policies: Record<string, DirectoryPolicy>; reviewedSets: Record<string, boolean> }
export interface DirectoryEntry {
  key: string; name: string; copies: number; printings: number; printingsBySet: Record<string, number>;
  cards: OwnedCard[]; keep: number; reserved: number; potentialExtras: number; availableToTrade: number;
  flaggedTradeQuantity: number; tradeFlag: boolean; identities: string[];
}
export interface SetCoverage { setCode: string; copies: number; distinctCards: number; reviewed: boolean; complete: false; note: string }

export const DIRECTORY_STORAGE_KEY = 'mtg_collection_directory_v1';
const normalizeName = (name: string) => name.trim().toLocaleLowerCase();
export const entryKeyForName = (name: string) => `name:${normalizeName(name)}`;
const integer = (value: unknown, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
};
const usableQuantity = (card: OwnedCard) => card.proxy ? 0 : integer(card.quantity);
const importedTradeQuantity = (card: OwnedCard) => integer((card as OwnedCard & { tradeQuantity?: unknown }).tradeQuantity);

export function emptyDirectoryState(): DirectoryState { return { policies: {}, reviewedSets: {} }; }
export function loadDirectoryState(storage: Pick<Storage, 'getItem'> | undefined = typeof window === 'undefined' ? undefined : window.localStorage): DirectoryState {
  if (!storage) return emptyDirectoryState();
  try { const parsed = JSON.parse(storage.getItem(DIRECTORY_STORAGE_KEY) || '{}') as Partial<DirectoryState>; return { policies: parsed.policies && typeof parsed.policies === 'object' ? parsed.policies : {}, reviewedSets: parsed.reviewedSets && typeof parsed.reviewedSets === 'object' ? parsed.reviewedSets : {} }; } catch { return emptyDirectoryState(); }
}
export function saveDirectoryState(state: DirectoryState, storage: Pick<Storage, 'setItem'> | undefined = typeof window === 'undefined' ? undefined : window.localStorage): void { try { storage?.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(state)); } catch { /* private browsing can deny storage */ } }

export function buildDirectory(cards: OwnedCard[], state: DirectoryState = emptyDirectoryState()): DirectoryEntry[] {
  const grouped = new Map<string, OwnedCard[]>();
  for (const card of cards) { const key = entryKeyForName(card.name); grouped.set(key, [...(grouped.get(key) || []), card]); }
  return Array.from(grouped.entries()).map(([key, groupedCards]) => {
    const copies = groupedCards.reduce((sum, card) => sum + usableQuantity(card), 0);
    const rawImportedTrade = Math.min(copies, groupedCards.reduce((sum, card) => sum + (card.proxy ? 0 : Math.min(usableQuantity(card), importedTradeQuantity(card))), 0));
    const policy = state.policies[key] || { keep: Math.min(1, copies - rawImportedTrade), reserve: 0 };
    const sets = groupedCards.reduce((out: Record<string, number>, card) => { const set = (card.setCode || 'unknown').toUpperCase(); out[set] = (out[set] || 0) + usableQuantity(card); return out; }, {});
    // Keep is deliberately applied first: a reserve can never consume a keeper.
    const keep = Math.min(copies, integer(policy.keep, 1));
    const reserved = Math.min(copies - keep, integer(policy.reserve));
    const potentialExtras = Math.max(0, copies - keep - reserved);
    const importedTrade = Math.min(potentialExtras, rawImportedTrade);
    const flaggedTradeQuantity = policy.disposition === 'trade' ? potentialExtras : policy.disposition === 'keep' || policy.disposition === 'reserve' ? 0 : importedTrade;
    // availableToTrade is retained as the legacy potential-extra count; exports use the
    // separate flaggedTradeQuantity so unreviewed extras are never silently exported.
    return { key, name: groupedCards[0]!.name, copies, printings: groupedCards.length, printingsBySet: sets, cards: groupedCards, keep, reserved, potentialExtras, availableToTrade: potentialExtras, flaggedTradeQuantity, tradeFlag: flaggedTradeQuantity > 0, identities: groupedCards.map(collectionIdentity) };
  }).sort((a, b) => b.potentialExtras - a.potentialExtras || b.copies - a.copies || a.name.localeCompare(b.name));
}

export function buildSetCoverage(cards: OwnedCard[], state: DirectoryState = emptyDirectoryState()): SetCoverage[] {
  const grouped = new Map<string, OwnedCard[]>();
  cards.forEach(card => { const code = (card.setCode || 'unknown').toUpperCase(); grouped.set(code, [...(grouped.get(code) || []), card]); });
  return Array.from(grouped.entries()).map(([setCode, setCards]) => ({ setCode, copies: setCards.reduce((sum, card) => sum + usableQuantity(card), 0), distinctCards: new Set(setCards.map(card => normalizeName(card.name))).size, reviewed: Boolean(state.reviewedSets[setCode]), complete: false as const, note: 'Imported cards only; cards not present are unknown, not unowned.' })).sort((a, b) => b.copies - a.copies);
}
export function withPolicy(state: DirectoryState, key: string, patch: Partial<DirectoryPolicy>): DirectoryState {
  const current = state.policies[key] || { keep: 1, reserve: 0 };
  return { ...state, policies: { ...state.policies, [key]: { ...current, ...patch, keep: integer(patch.keep ?? current.keep, 1), reserve: integer(patch.reserve ?? current.reserve) } } };
}
export function toggleReviewedSet(state: DirectoryState, setCode: string): DirectoryState { return { ...state, reviewedSets: { ...state.reviewedSets, [setCode]: !state.reviewedSets[setCode] } }; }
export function exportTradeList(entries: DirectoryEntry[]): string { return entries.filter(e => e.flaggedTradeQuantity > 0).map(e => `${e.flaggedTradeQuantity}x ${e.name}`).join('\n'); }

const basic = (name: string, quantity: number) => ({ name, quantity, isLand: true });
const spell = (name: string, quantity: number) => ({ name, quantity, isLand: false });
// Complete, recognizable 60-card casual templates. They are suggestions, not legality claims.
const RECIPES = [
  { theme: 'Mono-red burn', cards: [basic('Mountain', 24), spell('Lightning Bolt', 4), spell('Shock', 4), spell('Lava Spike', 4), spell('Rift Bolt', 4), spell('Kessig Flamebreather', 4), spell('Thermo-Alchemist', 4), spell('Monastery Swiftspear', 4), spell('Young Pyromancer', 4), spell('Searing Blaze', 4)] },
  { theme: 'Mono-green stompy', cards: [basic('Forest', 24), spell('Llanowar Elves', 4), spell('Elvish Mystic', 4), spell('Garruk\'s Companion', 4), spell('Leatherback Baloth', 4), spell('Llanowar Visionary', 4), spell('Nessian Courser', 4), spell('Rancor', 4), spell('Giant Growth', 4), spell('Overrun', 2), spell('Beast Within', 2)] },
  { theme: 'White tokens', cards: [basic('Plains', 24), spell('Raise the Alarm', 4), spell('Spectral Procession', 4), spell('Gather the Townsfolk', 4), spell('Doomed Traveler', 4), spell('Intangible Virtue', 4), spell('Skullclamp', 2), spell('Swords to Plowshares', 4), spell('Triplicate Spirits', 4), spell('Secure the Wastes', 4), spell('Glorious Anthem', 2)] },
] as const;
export interface RecipeCard { name: string; required: number; owned: number; missing: number; isLand: boolean }
export interface CasualRecipe { theme: string; cards: RecipeCard[]; owned: Array<{ name: string; quantity: number }>; missingNames: string[]; totalSlots: number; coveredSlots: number; landGap: number; spellGap: number; disclaimer: string }
export function buildCasualRecipes(entries: DirectoryEntry[]): CasualRecipe[] {
  // Alternatives are evaluated independently. Keep/reserve and explicitly flagged trade copies are unavailable.
  const available = new Map(entries.map(e => [normalizeName(e.name), Math.max(0, e.copies - e.keep - e.reserved - e.flaggedTradeQuantity)]));
  return RECIPES.map(recipe => {
    const cards = recipe.cards.map(card => { const owned = Math.min(card.quantity, available.get(normalizeName(card.name)) || 0); return { ...card, required: card.quantity, owned, missing: card.quantity - owned }; });
    const coveredSlots = cards.reduce((n, card) => n + card.owned, 0);
    const landGap = cards.filter(c => c.isLand).reduce((n, c) => n + c.missing, 0);
    const spellGap = cards.filter(c => !c.isLand).reduce((n, c) => n + c.missing, 0);
    return { theme: recipe.theme, cards, owned: cards.filter(c => c.owned > 0).map(c => ({ name: c.name, quantity: c.owned })), missingNames: cards.filter(c => c.missing > 0).map(c => c.name), totalSlots: 60, coveredSlots, landGap, spellGap, disclaimer: 'Inventory-based casual suggestion; not a claim of format legality or completeness. Missing cards are unknown/not available in this import.' };
  });
}
export function exportRecipeDeckList(recipe: CasualRecipe): string { return `${recipe.theme} — ${recipe.coveredSlots}/${recipe.totalSlots} slots covered\n${recipe.cards.filter(c => c.owned > 0).map(c => `${c.owned}x ${c.name}`).join('\n')}\n\nNeeds ${recipe.totalSlots - recipe.coveredSlots} cards; this is an owned-only partial list.`; }
