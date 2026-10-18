import {
  getSupabasePublicConfig,
  loadSupabaseWorkspaceSession,
  type SupabasePublicConfig,
  type SupabaseWorkspaceSession,
  type SupabaseSyncDependencies,
} from '@/lib/supabaseWorkspaceSync';

export type ImportSource = 'manabox' | 'deckbox';
export type ImportFile = { source: ImportSource; file: File };
export type NormalizedRow = {
  source: ImportSource; sourceRow: number; name: string; quantity: number; tradeQuantity: number;
  identity: string; identityType: string; scryfallId: string | null; finish: string; language: string;
  condition: string; modifierSignature: string; canonicalKey: string; baseKey: string; setCode: string;
  collectorNumber: string; raw: Record<string, string>;
};
export type ImportCard = NormalizedRow & {
  quantity: number;
  provenance: { source: ImportSource; identity: string; count: number; row_indices: Array<{ source: ImportSource; source_row: number }>;
    possible_overlap: boolean; unresolved_overlap_quantity: number; source_hashes: Record<string, string>; source_quantities: Record<string, number> };
};
export type ImportPreview = {
  files: ImportFile[];
  sources: Array<{ source: ImportSource; fileName: string; sourceHash: string; rows: number; copies: number }>;
  rows: number; copies: number; canonicalEntries: number; canonicalCopies: number;
  overlapEntries: number; overlapCopies: number; cards: ImportCard[];
};

const APPROVED_URL = 'https://oahydekahatdhsxokomo.supabase.co';
const MAX_BATCH = 100;
const SOURCES: ImportSource[] = ['manabox', 'deckbox'];
const norm = (v: unknown) => String(v ?? '').trim();
const lower = (v: unknown) => norm(v).toLowerCase();
const truth = (v: unknown) => new Set(['true', 't', 'yes', 'y', '1', 'x']).has(lower(v));
const qty = (v: unknown) => { const n = Number(norm(v) || '0'); return Number.isSafeInteger(n) && n > 0 ? n : 0; };
function normFinish(v: unknown) { const x = lower(v); if (x === 'foil' || x === 'foils') return 'foil'; if (['etched', 'etched foil', 'etched_foil'].includes(x)) return 'etched'; if (['normal', 'nonfoil', 'non-foil', 'regular', ''].includes(x)) return 'normal'; return x.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'normal'; }
function normLang(v: unknown) { const x = lower(v); const m: Record<string, string> = { english: 'en', en: 'en', eng: 'en', japanese: 'ja', ja: 'ja', jpn: 'ja', german: 'de', de: 'de', french: 'fr', fr: 'fr', italian: 'it', it: 'it', spanish: 'es', es: 'es', portuguese: 'pt', pt: 'pt', korean: 'ko', ko: 'ko', chinese: 'zh', 'simplified chinese': 'zhs', 'traditional chinese': 'zht', russian: 'ru', ru: 'ru', phyrexian: 'ph' }; return m[x] || x.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'unknown'; }
function normCondition(v: unknown) { let x = lower(v); x = ({ 'good (lightly played)': 'lightly played', 'excellent (lightly played)': 'lightly played', 'played (moderately played)': 'moderately played', 'poor (heavily played)': 'heavily played' } as Record<string, string>)[x] || x; const m: Record<string, string> = { 'near mint': 'near_mint', near_mint: 'near_mint', nm: 'near_mint', 'lightly played': 'lightly_played', lightly_played: 'lightly_played', lp: 'lightly_played', 'moderately played': 'moderately_played', moderately_played: 'moderately_played', mp: 'moderately_played', 'heavily played': 'heavily_played', heavily_played: 'heavily_played', hp: 'heavily_played', damaged: 'damaged', d: 'damaged', played: 'played', mint: 'mint' }; return m[x] || x.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'unknown'; }

/** CSV parser supporting BOM, quoted commas, escaped quotes, and embedded newlines. */
export function parseCsv(text: string): string[][] { const out: string[][] = []; let row: string[] = [], cell = '', quoted = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (quoted) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c; } else if (c === '"' && cell.length === 0) quoted = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); if (row.some(v => v !== '')) out.push(row); row = []; cell = ''; } else cell += c; } if (cell !== '' || row.length) { row.push(cell); if (row.some(v => v !== '')) out.push(row); } return out; }
function records(text: string): Record<string, string>[] { const rows = parseCsv(text.replace(/^\uFEFF/, '')); if (!rows.length) return []; const headers = rows[0].map(norm); return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? '']))); }
function normalize(source: ImportSource, raw: Record<string, string>, sourceRow: number): NormalizedRow { const mana = source === 'manabox'; const count = qty(raw[mana ? 'Quantity' : 'Count']); const name = norm(raw.Name); const sid = norm(raw['Scryfall ID']); const sc = norm(raw[mana ? 'Set code' : 'Edition Code']); const cn = norm(raw[mana ? 'Collector number' : 'Card Number']); const identity = sid || (sc && cn ? `${sc.toLowerCase()}::${cn}` : `${source}::row::${sourceRow}`); const mods = mana ? { Signed: truth(raw.Signed), Altered: truth(raw.Altered), Misprint: truth(raw.Misprint), Proxy: truth(raw.Proxy) } : { Signed: truth(raw.Signed), Altered: truth(raw['Altered Art']), Misprint: truth(raw.Misprint), Proxy: false }; const modifierSignature = Object.entries(mods).filter(([, v]) => v).map(([k]) => k.toLowerCase()).join('|') || 'none'; const finish = normFinish(raw.Foil), language = normLang(raw.Language), condition = normCondition(raw.Condition); const baseKey = [identity, finish, language, condition].join('|'); return { source, sourceRow, name, quantity: count, tradeQuantity: mana ? 0 : qty(raw['Tradelist Count']), identity, identityType: sid ? 'scryfall_id' : sc && cn ? 'set_collector' : 'source_row', scryfallId: sid || null, finish, language, condition, modifierSignature, canonicalKey: `${baseKey}|${modifierSignature}`, baseKey, setCode: sc, collectorNumber: cn, raw }; }
async function sha256Bytes(bytes: ArrayBuffer): Promise<string> { const h = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(h)).map(x => x.toString(16).padStart(2, '0')).join(''); }
async function sha256(file: File) { return sha256Bytes(await file.arrayBuffer()); }

export async function previewPrivateInventory(files: ImportFile[]): Promise<ImportPreview> {
  if (files.length !== 2 || files.some(x => !SOURCES.includes(x.source) || x.file.size > 10 * 1024 * 1024) || new Set(files.map(x => x.source)).size !== 2) throw new Error('Select one ManaBox CSV and one Deckbox CSV.');
  const all: NormalizedRow[] = []; const sources: ImportPreview['sources'] = [];
  for (const { source, file } of files) { const text = await file.text(); const rs = records(text).map((r, i) => normalize(source, r, i + 1)); sources.push({ source, fileName: file.name, sourceHash: await sha256(file), rows: rs.length, copies: rs.reduce((n, r) => n + r.quantity, 0) }); all.push(...rs); }
  if (!sources.every(s => s.rows > 0) || all.some(r => !r.name || !Number.isSafeInteger(r.quantity) || r.quantity <= 0)) throw new Error('The source files contain invalid inventory rows.');
  const grouped = new Map<string, NormalizedRow[]>(); for (const r of all) grouped.set(r.canonicalKey, [...(grouped.get(r.canonicalKey) || []), r]);
  const cards: ImportCard[] = []; let overlapEntries = 0, overlapCopies = 0;
  for (const rs of Array.from(grouped.values()) as NormalizedRow[][]) { const sourceQuantities: Record<string, number> = {}; for (const s of SOURCES) { const n = rs.filter(r => r.source === s).reduce((sum: number, r: NormalizedRow) => sum + r.quantity, 0); if (n > 0) sourceQuantities[s] = n; } const quantity = Math.max(...Object.values(sourceQuantities), 0); const trades = SOURCES.map(s => rs.filter(r => r.source === s).reduce((n, r) => n + r.tradeQuantity, 0)); const overlap = Object.keys(sourceQuantities).length > 1; if (overlap) { overlapEntries++; overlapCopies += Math.min(...Object.values(sourceQuantities)); } const first = rs[0]; cards.push({ ...first, quantity, tradeQuantity: Math.min(quantity, Math.max(...trades, 0)), provenance: { source: first.source, identity: first.identity, count: quantity, row_indices: rs.map(r => ({ source: r.source, source_row: r.sourceRow })), possible_overlap: overlap, unresolved_overlap_quantity: overlap ? Math.min(...Object.values(sourceQuantities)) : 0, source_hashes: Object.fromEntries(sources.map(s => [s.source, s.sourceHash])), source_quantities: sourceQuantities } }); }
  return { files, sources, rows: all.length, copies: sources.reduce((n, s) => n + s.copies, 0), canonicalEntries: cards.length, canonicalCopies: cards.reduce((n, c) => n + c.quantity, 0), overlapEntries, overlapCopies, cards };
}

export type ImportProgress = { batch: number; batches: number; cardsUploaded: number };
const genericError = () => new Error('Private inventory import could not be completed.');
export function getAuthorizedSupabaseSession(config: SupabasePublicConfig, dependencies: Pick<SupabaseSyncDependencies, 'sessionStorage' | 'fetcher'> = { sessionStorage: window.sessionStorage, fetcher: fetch }): Promise<SupabaseWorkspaceSession> { return (async () => { if (config.url !== APPROVED_URL) throw new Error('Import is unavailable for this project configuration.'); const session = loadSupabaseWorkspaceSession(dependencies.sessionStorage); if (!session) throw new Error('Sign in before importing private inventory.'); const r = await (dependencies.fetcher || fetch)(`${config.url}/auth/v1/user`, { headers: { apikey: config.anonKey, Authorization: `Bearer ${session.accessToken}` } }); if (!r.ok) throw new Error('The signed-in session could not be verified.'); const user = await r.json() as { id?: unknown }; if (user.id !== session.user.id) throw new Error('The signed-in session could not be verified.'); return session; })(); }
const headers = (config: SupabasePublicConfig, session: SupabaseWorkspaceSession) => ({ apikey: config.anonKey, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' });
async function rest(config: SupabasePublicConfig, session: SupabaseWorkspaceSession, table: string, method: string, body: unknown, query = '', fetcher: typeof fetch = fetch) { const r = await fetcher(`${config.url}/rest/v1/${table}${query}`, { method, headers: headers(config, session), body: body === undefined ? undefined : JSON.stringify(body) }); if (!r.ok) throw genericError(); return r.status === 204 ? [] : r.json(); }
async function readAll(config: SupabasePublicConfig, session: SupabaseWorkspaceSession, table: string, select: string, filter: string, fetcher: typeof fetch) { const out: any[] = []; for (let offset = 0; ; offset += MAX_BATCH) { const q = `?select=${encodeURIComponent(select)}&owner_id=eq.${encodeURIComponent(session.user.id)}${filter}&order=id.asc&limit=${MAX_BATCH}&offset=${offset}`; const r = await fetcher(`${config.url}/rest/v1/${table}${q}`, { headers: { apikey: config.anonKey, Authorization: `Bearer ${session.accessToken}` }, cache: 'no-store' }); if (!r.ok) throw genericError(); const page = await r.json() as any[]; if (!Array.isArray(page) || offset > 1000000) throw genericError(); out.push(...page); if (page.length < MAX_BATCH) return out; } }
function uuidFromBytes(b: Uint8Array) { const x = Array.from(b.slice(0, 16)); x[6] = (x[6] & 15) | 64; x[8] = (x[8] & 63) | 128; const h = x.map(n => n.toString(16).padStart(2, '0')).join(''); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`; }
async function stableUuid(seed: string) { return uuidFromBytes(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed)))); }
function canonical(value: unknown): string { if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => `${JSON.stringify(key)}:${canonical(v)}`).join(',')}}`; return JSON.stringify(value); }
function same(a: unknown, b: unknown) { return canonical(a) === canonical(b); }

async function writeVerifiedBatch(config: SupabasePublicConfig, session: SupabaseWorkspaceSession, table: string, payload: Array<{ id: string }>, conflict: string, fetcher: typeof fetch) {
  const returned = await rest(config, session, table, 'POST', payload, `?on_conflict=${conflict}`, fetcher);
  if (!Array.isArray(returned) || returned.length !== payload.length) throw genericError();
  const ordered = (rows: Array<{ id: string }>) => [...rows].sort((a, b) => a.id.localeCompare(b.id));
  const checksum = (rows: Array<{ id: string }>) => sha256Bytes(new TextEncoder().encode(canonical(ordered(rows))).buffer as ArrayBuffer);
  if (await checksum(payload) !== await checksum(returned)) throw genericError();
}

export async function uploadPrivateInventory(preview: ImportPreview, config: SupabasePublicConfig, dependencies: Pick<SupabaseSyncDependencies, 'sessionStorage' | 'fetcher'> = { sessionStorage: window.sessionStorage, fetcher: fetch }, onProgress?: (p: ImportProgress) => void) {
  const session = await getAuthorizedSupabaseSession(config, dependencies); preview = await previewPrivateInventory(preview.files); const fetcher = dependencies.fetcher || fetch; const owner = session.user.id;
  const imports = await readAll(config, session, 'mtg_inventory_imports', 'id,source_hash,source_name,source_csv,row_count,copy_count,status', '', fetcher);
  const hashes = new Set(preview.sources.map(s => s.sourceHash)); if (imports.some(x => !hashes.has(x.source_hash))) throw new Error('Existing private inventory imports do not match these source files. Choose the same files or use a separate account.');
  const expectedKeys = new Set(preview.cards.map(c => c.canonicalKey)); const existingCards = await readAll(config, session, 'mtg_inventory_cards', 'id,owner_id,identity_key,name,quantity,set_code,collector_number,scryfall_id,finish,language,condition,proxy,trade_quantity,provenance,merge_status', '', fetcher); if ((!imports.length && existingCards.length > 0) || existingCards.some(x => !expectedKeys.has(x.identity_key))) throw new Error('Existing private inventory cards do not match these source files. Choose the same files or use a separate account.');
  const allComplete = preview.sources.every(source => imports.find(x => x.source_hash === source.sourceHash)?.status === 'complete'); const sourceIds: Record<string, string> = {}; const sourceFiles = new Map(preview.files.map(f => [f.source, f.file]));
  for (const source of preview.sources) { const file = sourceFiles.get(source.source)!; const bytes = await file.arrayBuffer(); const old = imports.find(x => x.source_hash === source.sourceHash); const id = old?.id || await stableUuid(`import|${owner}|${source.sourceHash}`); sourceIds[source.sourceHash] = id; if (!old) { await rest(config, session, 'mtg_inventory_imports', 'POST', { id, owner_id: owner, source_name: source.fileName, source_hash: source.sourceHash, source_csv: await file.text(), row_count: source.rows, copy_count: source.copies, status: 'pending' }, '', fetcher); } else if (old.source_name !== source.fileName || old.row_count !== source.rows || old.copy_count !== source.copies || old.source_csv !== await file.text()) throw genericError();
    if (!allComplete) { const put = await fetcher(`${config.url}/storage/v1/object/mtg-inventory-sources/${owner}/${source.sourceHash}.csv`, { method: 'POST', headers: { apikey: config.anonKey, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'text/csv', 'x-upsert': 'true' }, body: bytes }); if (!put.ok) throw genericError(); }
    const got = await fetcher(`${config.url}/storage/v1/object/mtg-inventory-sources/${owner}/${source.sourceHash}.csv`, { headers: { apikey: config.anonKey, Authorization: `Bearer ${session.accessToken}` } }); if (!got.ok || await sha256Bytes(await got.arrayBuffer()) !== source.sourceHash) throw genericError(); }
  const allRows = (await Promise.all(preview.files.map(async f => { const source = preview.sources.find(s => s.source === f.source)!; const rows = records((await f.file.text()).replace(/^\uFEFF/, '')).map((r, i) => normalize(f.source, r, i + 1)); return rows.map(row => ({ source, row })); }))).flat();
  const cardPayload = await Promise.all(preview.cards.map(async c => ({ id: await stableUuid(`card|${owner}|${c.canonicalKey}`), owner_id: owner, identity_key: c.canonicalKey, name: c.name, quantity: c.quantity, set_code: c.setCode || null, collector_number: c.collectorNumber || null, scryfall_id: c.scryfallId, finish: c.finish, language: c.language, condition: c.condition, proxy: c.modifierSignature.includes('proxy'), trade_quantity: c.tradeQuantity, provenance: c.provenance, merge_status: 'conservative_max' })));
  for (let i = 0; i < cardPayload.length && !allComplete; i += MAX_BATCH) { await writeVerifiedBatch(config, session, 'mtg_inventory_cards', cardPayload.slice(i, i + MAX_BATCH), 'owner_id,identity_key', fetcher); onProgress?.({ batch: Math.floor(i / MAX_BATCH) + 1, batches: Math.ceil(cardPayload.length / MAX_BATCH), cardsUploaded: Math.min(i + MAX_BATCH, cardPayload.length) }); }
  for (let i = 0; i < allRows.length && !allComplete; i += MAX_BATCH) { const payload = await Promise.all(allRows.slice(i, i + MAX_BATCH).map(async ({ source, row }) => ({ id: await stableUuid(`raw|${owner}|${source.sourceHash}|${row.sourceRow}`), owner_id: owner, import_id: sourceIds[source.sourceHash], source_row: row.sourceRow, quantity: row.quantity, identity_key: row.canonicalKey, raw_row: row.raw }))); await writeVerifiedBatch(config, session, 'mtg_inventory_import_rows', payload, 'import_id,source_row', fetcher); }
  const verifyCards = await readAll(config, session, 'mtg_inventory_cards', 'id,owner_id,identity_key,name,quantity,set_code,collector_number,scryfall_id,finish,language,condition,proxy,trade_quantity,provenance,merge_status', '', fetcher); const byKey = new Map(verifyCards.map(x => [x.identity_key, x])); if (verifyCards.length !== cardPayload.length || cardPayload.some(x => { const y = byKey.get(x.identity_key); return !y || !same(x, y); })) throw genericError();
  const verifyRows = await readAll(config, session, 'mtg_inventory_import_rows', 'id,import_id,source_row,quantity,identity_key,raw_row', '', fetcher); const expectedRows = await Promise.all(allRows.map(async ({ source, row }) => ({ id: await stableUuid(`raw|${owner}|${source.sourceHash}|${row.sourceRow}`), import_id: sourceIds[source.sourceHash], source_row: row.sourceRow, quantity: row.quantity, identity_key: row.canonicalKey, raw_row: row.raw }))); const rowById = new Map(verifyRows.map(row => [row.id, row])); if (verifyRows.length !== expectedRows.length || expectedRows.some(x => !same(x, rowById.get(x.id)))) throw genericError();
  if (!allComplete) for (const source of preview.sources) { const id = sourceIds[source.sourceHash]; await rest(config, session, 'mtg_inventory_imports', 'PATCH', { status: 'complete' }, `?owner_id=eq.${encodeURIComponent(owner)}&id=eq.${encodeURIComponent(id)}`, fetcher); }
  const completed = await readAll(config, session, 'mtg_inventory_imports', 'id,source_hash,source_name,source_csv,row_count,copy_count,status', '', fetcher);
  if (completed.length !== preview.sources.length) throw genericError();
  for (const source of preview.sources) {
    const stored = completed.find(row => row.source_hash === source.sourceHash);
    if (!stored || stored.status !== 'complete' || stored.row_count !== source.rows || stored.copy_count !== source.copies || stored.source_csv !== await sourceFiles.get(source.source)!.text()) throw genericError();
  }
  return { sources: preview.sources.length, cards: preview.cards.length };
}
export { getSupabasePublicConfig, APPROVED_URL, MAX_BATCH };
