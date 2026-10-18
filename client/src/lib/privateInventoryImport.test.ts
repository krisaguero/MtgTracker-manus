import { describe, expect, it } from 'vitest';
import { parseCsv, previewPrivateInventory, uploadPrivateInventory } from './privateInventoryImport';
import type { SupabasePublicConfig } from './supabaseWorkspaceSync';

const OWNER = '00000000-0000-0000-0000-000000000091';
const APPROVED_PROJECT_URL = 'https://oahydekahatdhsxokomo.supabase.co';
const config: SupabasePublicConfig = { url: APPROVED_PROJECT_URL, anonKey: 'synthetic-anon-public' };
const session = {
  accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh', expiresAt: 4102444800,
  user: { id: OWNER, email: 'synthetic@example.invalid' },
};
const storage = { getItem: (key: string) => key === 'mtg_tracker_supabase_workspace_session_v1' ? JSON.stringify(session) : null, setItem() {}, removeItem() {} };

type Row = Record<string, any>;
type Call = { method: string; pathname: string; query: URLSearchParams };

class SyntheticSupabase {
  imports: Row[] = [];
  cards: Row[] = [];
  raw: Row[] = [];
  objects = new Map<string, Uint8Array>();
  calls: Call[] = [];
  failStorage = false;
  corruptStorage = false;
  failCardBatch = false;
  wrongUser = false;

  fetcher = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const u = new URL(String(input));
    const method = String(init.method || 'GET').toUpperCase();
    const body = init.body && !u.pathname.startsWith('/storage/v1/object/') ? JSON.parse(String(init.body)) : undefined;
    this.calls.push({ method, pathname: u.pathname, query: u.searchParams });
    if (u.pathname === '/auth/v1/user') return this.json({ id: this.wrongUser ? 'wrong-user' : OWNER, email: session.user.email });
    if (u.pathname.startsWith('/storage/v1/object/')) {
      const key = u.pathname.replace('/storage/v1/object/mtg-inventory-sources/', '');
      if (method === 'POST') { if (this.failStorage) return this.json({ error: 'storage failure' }, 500); this.objects.set(key, new Uint8Array(await new Response(init.body).arrayBuffer())); return this.json({ Key: key }); }
      const bytes = this.corruptStorage ? new TextEncoder().encode('corrupt') : this.objects.get(key);
      return bytes ? new Response(bytes, { status: 200 }) : this.json({ error: 'not found' }, 404);
    }
    const match = u.pathname.match(/^\/rest\/v1\/(mtg_inventory_imports|mtg_inventory_cards|mtg_inventory_import_rows)$/);
    if (!match) return this.json({ error: 'unknown endpoint' }, 404);
    const table = match[1];
    const rows = table === 'mtg_inventory_imports' ? this.imports : table === 'mtg_inventory_cards' ? this.cards : this.raw;
    if (method === 'GET') {
      let result = rows.filter(row => this.matches(row, u.searchParams));
      const order = u.searchParams.get('order');
      if (order?.startsWith('id')) result = [...result].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      const offset = Number(u.searchParams.get('offset') || 0), limit = Number(u.searchParams.get('limit') || 100);
      result = result.slice(offset, offset + limit);
      const select = u.searchParams.get('select');
      return this.json(result.map(row => select && select !== '*' ? Object.fromEntries(select.split(',').map(key => [key, row[key]])) : { ...row }));
    }
    if (method === 'POST') {
      if (table === 'mtg_inventory_cards' && this.failCardBatch) return this.json({ error: 'card failure' }, 500);
      const incoming: Row[] = Array.isArray(body) ? body : [body];
      const returned: Row[] = [];
      for (const item of incoming) {
        const key = table === 'mtg_inventory_cards' ? `${item.owner_id}|${item.identity_key}` : table === 'mtg_inventory_imports' ? item.id : `${item.import_id}|${item.source_row}`;
        const index = rows.findIndex(row => (table === 'mtg_inventory_cards' ? `${row.owner_id}|${row.identity_key}` : table === 'mtg_inventory_imports' ? row.id : `${row.import_id}|${row.source_row}`) === key);
        const actual = table === 'mtg_inventory_cards' ? this.reorderJsonb(item) : { ...item };
        if (index >= 0) rows[index] = { ...rows[index], ...actual }; else rows.push({ ...actual });
        returned.push({ ...actual });
      }
      return this.json(returned);
    }
    if (method === 'PATCH') {
      for (const row of rows) if (this.matches(row, u.searchParams)) Object.assign(row, body);
      return this.json([]);
    }
    return this.json({ error: 'method' }, 405);
  };

  private reorderJsonb(row: Row) {
    if (!row.provenance) return { ...row };
    const p = row.provenance;
    return { ...row, provenance: { source_hashes: p.source_hashes, source_quantities: p.source_quantities, unresolved_overlap_quantity: p.unresolved_overlap_quantity, possible_overlap: p.possible_overlap, row_indices: p.row_indices, count: p.count, identity: p.identity, source: p.source } };
  }
  private matches(row: Row, q: URLSearchParams) {
    for (const [key, value] of q.entries()) { if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset' || key === 'on_conflict') continue; const m = value.match(/^eq\.(.*)$/); if (m && String(row[key]) !== decodeURIComponent(m[1])) return false; }
    return true;
  }
  private json(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } }); }
}

function files(cardCount = 2) {
  const manaRows = Array.from({ length: cardCount }, (_, i) => `Card ${i + 1},${i + 1},sid-${i + 1},Normal,English,NM,false,false,false,false`).join('\n');
  const deckFinish = cardCount > 2 ? 'normal' : 'foil';
  const deckRows = ['Boots,5,sid-1,normal,en,near mint,,,2,false,false,false', ...Array.from({ length: Math.max(0, cardCount - 1) }, (_, i) => `Deck ${i + 2},1,sid-${i + 2},${deckFinish},English,NM,,,0,false,false,false`)].join('\n');
  return [
    { source: 'manabox' as const, file: new File([`Name,Quantity,Scryfall ID,Foil,Language,Condition,Signed,Altered,Misprint,Proxy\n${manaRows}`], 'mana.csv', { type: 'text/csv' }) },
    { source: 'deckbox' as const, file: new File([`Name,Count,Scryfall ID,Foil,Language,Condition,Edition Code,Card Number,Tradelist Count,Signed,Altered Art,Misprint\n${deckRows}`], 'deck.csv', { type: 'text/csv' }) },
  ];
}
async function prepared(cardCount = 2) { const fs = files(cardCount); return { fs, preview: await previewPrivateInventory(fs) }; }
function mutations(server: SyntheticSupabase) { return server.calls.filter(c => ['POST', 'PATCH'].includes(c.method)); }


describe('private inventory import', () => {
  it('parses quoted commas, escaped quotes, and embedded newlines', () => {
    expect(parseCsv('Name,Quantity\n"Boots, Swiftfoot",2\n"A ""quoted"" card",1\n"line one\nline two",3')).toEqual([
      ['Name', 'Quantity'], ['Boots, Swiftfoot', '2'], ['A "quoted" card', '1'], ['line one\nline two', '3'],
    ]);
  });

  it('normalizes both sources and takes max per canonical key, not sum', async () => {
    const { preview } = await prepared();
    expect(preview.rows).toBe(4); expect(preview.copies).toBe(9); expect(preview.canonicalEntries).toBe(3);
    expect(preview.cards.find(c => c.identity === 'sid-1')?.quantity).toBe(5);
    expect(preview.cards.find(c => c.identity === 'sid-1')?.provenance.source_quantities).toEqual({ manabox: 1, deckbox: 5 });
  });

  it('uploads through mocked REST and Storage, verifies two sources/two raw rows, and is idempotent', async () => {
    const { preview } = await prepared(); const server = new SyntheticSupabase();
    const result = await uploadPrivateInventory(preview, config, { sessionStorage: storage, fetcher: server.fetcher });
    expect(result).toEqual({ sources: 2, cards: 3 }); expect(server.imports).toHaveLength(2); expect(server.cards).toHaveLength(3); expect(server.raw).toHaveLength(4);
    expect(server.imports.every(row => row.status === 'complete')).toBe(true); expect(new Set(server.cards.map(row => row.identity_key)).size).toBe(3);
    expect(server.calls.filter(c => c.method === 'POST' && c.pathname.endsWith('mtg_inventory_cards')).length).toBe(1);
    const before = mutations(server).length;
    await uploadPrivateInventory(preview, config, { sessionStorage: storage, fetcher: server.fetcher });
    expect(mutations(server)).toHaveLength(before);
  });

  it('refuses an unapproved project and wrong authenticated user without writes', async () => {
    const { preview } = await prepared(); const project = new SyntheticSupabase();
    await expect(uploadPrivateInventory(preview, { ...config, url: 'https://other.supabase.co' }, { sessionStorage: storage, fetcher: project.fetcher })).rejects.toThrow();
    expect(project.calls).toHaveLength(0);
    const auth = new SyntheticSupabase(); auth.wrongUser = true;
    await expect(uploadPrivateInventory(preview, config, { sessionStorage: storage, fetcher: auth.fetcher })).rejects.toThrow();
    expect(mutations(auth)).toHaveLength(0);
  });

  it('leaves imports pending on storage failure or card-batch failure', async () => {
    const { preview } = await prepared(); const storageFailure = new SyntheticSupabase(); storageFailure.failStorage = true;
    await expect(uploadPrivateInventory(preview, config, { sessionStorage: storage, fetcher: storageFailure.fetcher })).rejects.toThrow();
    expect(storageFailure.imports.every(row => row.status === 'pending')).toBe(true);
    const cardFailure = new SyntheticSupabase(); cardFailure.failCardBatch = true;
    await expect(uploadPrivateInventory(preview, config, { sessionStorage: storage, fetcher: cardFailure.fetcher })).rejects.toThrow();
    expect(cardFailure.imports.every(row => row.status === 'pending')).toBe(true);
  });

  it('does not complete an import when verification reads corrupted storage', async () => {
    const { preview } = await prepared(); const server = new SyntheticSupabase(); server.corruptStorage = true;
    await expect(uploadPrivateInventory(preview, config, { sessionStorage: storage, fetcher: server.fetcher })).rejects.toThrow();
    expect(server.imports.every(row => row.status === 'pending')).toBe(true);
  });

  it('uses batches for more than 100 cards and refuses unrelated pre-existing cards before mutation', async () => {
    const large = await prepared(101); const server = new SyntheticSupabase();
    await uploadPrivateInventory(large.preview, config, { sessionStorage: storage, fetcher: server.fetcher });
    expect(server.cards).toHaveLength(101); expect(server.raw).toHaveLength(202);
    expect(server.calls.filter(c => c.method === 'POST' && c.pathname.endsWith('mtg_inventory_cards'))).toHaveLength(2);
    const guarded = new SyntheticSupabase(); guarded.cards.push({ id: 'unrelated', owner_id: OWNER, identity_key: 'not-in-import' });
    await expect(uploadPrivateInventory(large.preview, config, { sessionStorage: storage, fetcher: guarded.fetcher })).rejects.toThrow();
    expect(mutations(guarded)).toHaveLength(0);
  });
});
