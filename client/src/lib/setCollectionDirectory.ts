import type { OwnedCard } from '@/lib/manaboxParser';

export interface ScryfallPrint {
  id: string; name: string; set: string; set_name: string; collector_number: string;
  rarity?: string; released_at?: string; image_uris?: { small?: string; normal?: string; large?: string };
  card_faces?: Array<{ image_uris?: { small?: string; normal?: string; large?: string } }>;
  layout?: string; type_line?: string; mana_cost?: string; digital?: boolean;
}
export interface SetCatalog { setCode: string; setName: string; releasedAt?: string; prints: ScryfallPrint[]; catalogScope: string; }
export type ChecklistState = Record<string, boolean>;
const API_ROOT = 'https://api.scryfall.com';
const CHECKLIST_PREFIX = 'mtg.collection.print-checklist.v1';

export function normalizeSetCode(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9]/g, ''); }
function wait(milliseconds: number): Promise<void> { return new Promise(resolve => globalThis.setTimeout(resolve, milliseconds)); }
function stableHash(value: string): string { let hash = 2166136261; for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, '0'); }
export function catalogScopeFor(setCode: string, prints: ScryfallPrint[]): string {
  const canonical = prints.map(p => `${p.id}\u0000${p.set}\u0000${p.collector_number}`).sort().join('\u0001');
  return `${normalizeSetCode(setCode)}:${prints.length}:${stableHash(canonical)}`;
}
function validNextPage(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'api.scryfall.com' && url.pathname === '/cards/search'; } catch { return false; }
}
/** Fetch every print sequentially, preserving Scryfall's set order. */
export async function fetchSetCatalog(setCode: string, fetcher: typeof fetch = fetch): Promise<SetCatalog> {
  const normalizedCode = normalizeSetCode(setCode); if (!normalizedCode) throw new Error('A set code is required.');
  const printsById = new Map<string, ScryfallPrint>();
  let nextUrl: string | null = `${API_ROOT}/cards/search?q=set:${encodeURIComponent(normalizedCode)}&unique=prints&order=set&include_extras=true&include_variations=true`;
  let page = 0; let setName = normalizedCode.toUpperCase(); let releasedAt: string | undefined;
  while (nextUrl) {
    if (page > 0) await wait(500);
    const response = await fetcher(nextUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Scryfall catalog request failed (${response.status}).`);
    const payload = await response.json() as { data?: ScryfallPrint[]; has_more?: boolean; next_page?: string };
    if (!Array.isArray(payload.data)) throw new Error('Scryfall returned an invalid printing catalog.');
    for (const print of payload.data) if (print?.id) { printsById.set(print.id, print); setName = print.set_name || setName; releasedAt = print.released_at || releasedAt; }
    page += 1;
    if (payload.has_more) { if (!validNextPage(payload.next_page)) throw new Error('Scryfall returned malformed pagination.'); nextUrl = payload.next_page; } else nextUrl = null;
  }
  const prints = Array.from(printsById.values());
  return { setCode: normalizedCode, setName, releasedAt, prints, catalogScope: catalogScopeFor(normalizedCode, prints) };
}
export function checklistStorageKey(setCode: string): string { return `${CHECKLIST_PREFIX}:${normalizeSetCode(setCode)}`; }
export function loadChecklist(setCode: string, catalogScope: string): ChecklistState { if (typeof window === 'undefined') return {}; try { const parsed = JSON.parse(window.localStorage.getItem(checklistStorageKey(setCode)) || 'null') as { catalogScope?: string; reviewed?: ChecklistState } | null; return parsed?.catalogScope === catalogScope && parsed.reviewed ? parsed.reviewed : {}; } catch { return {}; } }
export function saveChecklist(setCode: string, catalogScope: string, reviewed: ChecklistState): void { if (typeof window === 'undefined') return; try { window.localStorage.setItem(checklistStorageKey(setCode), JSON.stringify({ catalogScope, reviewed })); } catch { /* best effort */ } }
export function ownedQuantityForPrint(print: ScryfallPrint, collection: OwnedCard[]): number { return collection.filter(card => { if (card.proxy) return false; if (card.scryfallId?.trim()) return card.scryfallId.trim().toLowerCase() === print.id.toLowerCase(); return card.setCode?.trim().toLowerCase() === print.set.toLowerCase() && card.collectorNumber === print.collector_number; }).reduce((sum, card) => sum + Math.max(0, card.quantity || 0), 0); }
export function checklistStats(prints: ScryfallPrint[], reviewed: ChecklistState, collection: OwnedCard[]) {
  const reviewedCount = prints.filter(p => reviewed[p.id]).length;
  const ownedCount = prints.filter(p => ownedQuantityForPrint(p, collection) > 0).length;
  const explicitlyUnownedCount = prints.filter(p => reviewed[p.id] && ownedQuantityForPrint(p, collection) === 0).length;
  const reviewRemaining = prints.length - reviewedCount;
  const ownershipUnknown = prints.filter(p => !reviewed[p.id] && ownedQuantityForPrint(p, collection) === 0).length;
  return { total: prints.length, reviewedCount, ownedCount, explicitlyUnownedCount, reviewRemaining, ownershipUnknown, unknownCount: reviewRemaining };
}
