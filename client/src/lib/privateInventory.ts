import type { OwnedCard } from './manaboxParser';
import { getAuthorizedSupabaseSession, type SupabasePublicConfig, type SupabaseSyncDependencies } from './supabaseWorkspaceSync';

export interface PrivateInventorySnapshot { cards: OwnedCard[]; printingEntries: number; copies: number; conservativeEntries: number }
/** Read only on explicit user action. RLS is the boundary; owner filtering is defense in depth. */
export async function loadPrivatePrimaryInventory(config: SupabasePublicConfig, dependencies?: SupabaseSyncDependencies): Promise<PrivateInventorySnapshot> {
  const session = await getAuthorizedSupabaseSession(config, dependencies);
  const fetcher = dependencies?.fetcher || fetch;
  const cards: OwnedCard[] = [];
  const pendingQuery = new URLSearchParams({ select: 'id', owner_id: `eq.${session.user.id}`, status: 'eq.pending', limit: '1' });
  const pendingResponse = await fetcher(`${config.url}/rest/v1/mtg_inventory_imports?${pendingQuery}`, { headers: { apikey: config.anonKey, Authorization: `Bearer ${session.accessToken}` }, cache: 'no-store' });
  if (!pendingResponse.ok) throw new Error('Private inventory import status could not be verified. Nothing was restored.');
  const pending: unknown = await pendingResponse.json();
  if (!Array.isArray(pending) || pending.length) throw new Error('A private import is incomplete. Retry the same source files before restoring. Nothing was restored.');
  let conservativeEntries = 0;
  for (let offset = 0; ; offset += 500) {
    const query = new URLSearchParams({ select: 'id,name,quantity,set_code,collector_number,scryfall_id,finish,language,condition,proxy,merge_status,trade_quantity', owner_id: `eq.${session.user.id}`, order: 'id.asc', limit: '500', offset: String(offset) });
    const response = await fetcher(`${config.url}/rest/v1/mtg_inventory_cards?${query}`, { headers: { apikey: config.anonKey, Authorization: `Bearer ${session.accessToken}` }, cache: 'no-store' });
    if (!response.ok) throw new Error('Private inventory could not be loaded. Check your account and project configuration.');
    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) throw new Error('Unsupported private inventory response. Nothing was restored.');
    for (const row of rows) {
      if (!row || typeof row.name !== 'string' || !Number.isSafeInteger(row.quantity) || row.quantity <= 0) throw new Error('Private inventory validation failed. Nothing was restored.');
      cards.push({ name: row.name, quantity: row.quantity, setCode: row.set_code || undefined, collectorNumber: row.collector_number || undefined, scryfallId: row.scryfall_id || undefined, finish: row.finish || undefined, language: row.language || undefined, condition: row.condition || undefined, tradeQuantity: Math.min(row.quantity, Math.max(0, Math.floor(Number(row.trade_quantity) || 0))), ...(row.proxy ? { proxy: true } : {}) });
      if (row.merge_status === 'conservative_max') conservativeEntries++;
    }
    if (rows.length < 500) break;
    if (offset >= 1000000) throw new Error('Inventory is too large for this restore. Nothing was changed.');
  }
  return { cards, printingEntries: cards.length, copies: cards.reduce((sum, card) => sum + card.quantity, 0), conservativeEntries };
}
