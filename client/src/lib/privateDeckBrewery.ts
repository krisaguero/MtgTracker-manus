import {
  loadSupabaseWorkspaceSession,
  SUPABASE_SYNC_SESSION_KEY,
  type SupabasePublicConfig,
  type SupabaseWorkspaceSession,
} from '@/lib/supabaseWorkspaceSync';

export const PRIVATE_BREWERY_PROJECT_URL = 'https://oahydekahatdhsxokomo.supabase.co';
export const PRIVATE_BREWERY_EMAIL = 'krisaguero@gmail.com';
export const PRIVATE_BREWERY_IMPORT_TABLE = 'mtg_private_deck_brewery_imports';
export const PRIVATE_BREWERY_DECK_TABLE = 'mtg_private_deck_brewery';
const IMPORT_BATCH_SIZE = 25;
const MAX_IMPORT_RECORDS = 500;

export interface DeckboxSourceCard {
  name: string;
  quantity: number;
  [key: string]: unknown;
}

export interface DeckboxSourceRecord {
  id: string | number;
  name: string;
  main: DeckboxSourceCard[];
  sideboard: DeckboxSourceCard[];
  [key: string]: unknown;
}

export interface DeckboxImportBundle {
  schemaVersion: number;
  title: string;
  privacy: string;
  source: string;
  caveats: string[];
  edhrecNotes: Array<Record<string, unknown>>;
  decks: DeckboxSourceRecord[];
  [key: string]: unknown;
}

export interface PrivateBreweryDeckRow {
  deckbox_id: string;
  source_record: DeckboxSourceRecord;
}

export interface PrivateBreweryImportRecord {
  bundle_metadata: Record<string, unknown>;
  record_count: number;
  status: 'importing' | 'complete';
  source_hash: string;
}

export interface PrivateBrewerySnapshot {
  session: SupabaseWorkspaceSession;
  importRecord: PrivateBreweryImportRecord | null;
  decks: PrivateBreweryDeckRow[];
}

export interface PrivateBreweryDependencies {
  sessionStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  fetcher?: typeof fetch;
  now?: () => number;
  crypto?: Pick<Crypto, 'subtle'>;
}

const defaultDependencies = (): PrivateBreweryDependencies => ({
  sessionStorage: window.sessionStorage,
  fetcher: fetch,
  now: () => Date.now(),
  crypto: globalThis.crypto,
});

function authHeaders(config: SupabasePublicConfig, accessToken?: string) {
  return {
    apikey: config.anonKey,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    'Content-Type': 'application/json',
  };
}

function ensureApprovedProject(config: SupabasePublicConfig) {
  if (config.url !== PRIVATE_BREWERY_PROJECT_URL) {
    throw new Error('Private Deck Brewery is configured for a different Supabase project. No private data was requested or sent.');
  }
}

async function readJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function saveSession(session: SupabaseWorkspaceSession, storage: PrivateBreweryDependencies['sessionStorage']) {
  storage.setItem(SUPABASE_SYNC_SESSION_KEY, JSON.stringify(session));
}

function clearSession(storage: PrivateBreweryDependencies['sessionStorage']) {
  storage.removeItem(SUPABASE_SYNC_SESSION_KEY);
}

function sessionFromPayload(payload: any, now: number): SupabaseWorkspaceSession | null {
  if (typeof payload?.access_token !== 'string' || typeof payload?.refresh_token !== 'string'
    || typeof payload?.user?.id !== 'string') return null;
  const expiresIn = Number(payload.expires_in);
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: now + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600) * 1000,
    user: {
      id: payload.user.id,
      ...(typeof payload.user.email === 'string' ? { email: payload.user.email } : {}),
    },
  };
}

async function verifyCurrentUser(
  config: SupabasePublicConfig,
  session: SupabaseWorkspaceSession,
  dependencies: PrivateBreweryDependencies,
): Promise<SupabaseWorkspaceSession> {
  const response = await (dependencies.fetcher || fetch)(`${config.url}/auth/v1/user`, {
    headers: authHeaders(config, session.accessToken),
  });
  if (!response.ok) {
    clearSession(dependencies.sessionStorage);
    throw new Error('The Supabase sign-in session could not be verified. Sign in again to continue.');
  }
  const user = await readJson(response);
  if (typeof user?.id !== 'string' || user.id !== session.user.id) {
    clearSession(dependencies.sessionStorage);
    throw new Error('The Supabase account could not be verified. Sign in again to continue.');
  }
  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
  if (email !== PRIVATE_BREWERY_EMAIL) {
    clearSession(dependencies.sessionStorage);
    throw new Error(`This private page is limited to the signed-in ${PRIVATE_BREWERY_EMAIL} account.`);
  }
  const verified = { ...session, user: { id: user.id, email } };
  saveSession(verified, dependencies.sessionStorage);
  return verified;
}

export async function getAuthorizedPrivateBrewerySession(
  config: SupabasePublicConfig,
  dependencies: PrivateBreweryDependencies = defaultDependencies(),
): Promise<SupabaseWorkspaceSession> {
  ensureApprovedProject(config);
  let session = loadSupabaseWorkspaceSession(dependencies.sessionStorage);
  if (!session) throw new Error(`Sign in to the ${PRIVATE_BREWERY_EMAIL} Supabase account to open this private page.`);
  const now = (dependencies.now || Date.now)();
  if (session.expiresAt <= now + 30_000) {
    const response = await (dependencies.fetcher || fetch)(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: authHeaders(config),
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
    const payload = await readJson(response);
    if (!response.ok) {
      clearSession(dependencies.sessionStorage);
      throw new Error('The Supabase sign-in session expired. Request a new email link to continue.');
    }
    const refreshed = sessionFromPayload(payload, now);
    if (!refreshed) {
      clearSession(dependencies.sessionStorage);
      throw new Error('Supabase did not return a valid refreshed session. Sign in again to continue.');
    }
    session = refreshed;
    saveSession(session, dependencies.sessionStorage);
  }
  return verifyCurrentUser(config, session, dependencies);
}

function allowedRedirect(redirectTo: string): string {
  const parsed = new URL(redirectTo);
  const isLocal = parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  const isApprovedApp = parsed.origin === 'https://mtg-tracker-manus-current.vercel.app';
  if (!isLocal && !isApprovedApp) throw new Error('The sign-in return address is not an approved app origin.');
  if (!parsed.pathname.startsWith('/private-deck-brewery')) throw new Error('The sign-in return address is not a private brewery page.');
  return parsed.toString();
}

export async function requestPrivateBreweryEmailLink(
  config: SupabasePublicConfig,
  redirectTo: string,
  dependencies: PrivateBreweryDependencies = defaultDependencies(),
): Promise<void> {
  ensureApprovedProject(config);
  const redirect = allowedRedirect(redirectTo);
  const query = new URLSearchParams({ redirect_to: redirect });
  const response = await (dependencies.fetcher || fetch)(`${config.url}/auth/v1/otp?${query.toString()}`, {
    method: 'POST',
    headers: authHeaders(config),
    body: JSON.stringify({ email: PRIVATE_BREWERY_EMAIL, create_user: false }),
  });
  if (!response.ok) {
    const payload = await readJson(response);
    const detail = typeof payload?.msg === 'string' ? payload.msg
      : typeof payload?.message === 'string' ? payload.message : '';
    throw new Error(detail.slice(0, 220) || 'Supabase could not send a sign-in link. No deck data was changed.');
  }
}

export async function consumePrivateBreweryAuthRedirect(
  config: SupabasePublicConfig,
  location: Pick<Location, 'hash' | 'pathname' | 'search'> = window.location,
  history: Pick<History, 'replaceState'> = window.history,
  dependencies: PrivateBreweryDependencies = defaultDependencies(),
): Promise<boolean> {
  ensureApprovedProject(config);
  if (!location.hash || location.hash.length < 2) return false;
  const params = new URLSearchParams(location.hash.slice(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken && !refreshToken && !params.has('error')) return false;
  const error = params.get('error_description') || params.get('error');
  if (error) {
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    throw new Error(error.slice(0, 220));
  }
  const expiresIn = Number(params.get('expires_in'));
  if (!accessToken || !refreshToken) {
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    throw new Error('The email link did not return a complete Supabase session. Request a fresh link and open it in this browser.');
  }
  const session: SupabaseWorkspaceSession = {
    accessToken,
    refreshToken,
    expiresAt: (dependencies.now || Date.now)() + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600) * 1000,
    user: { id: '' },
  };
  const response = await (dependencies.fetcher || fetch)(`${config.url}/auth/v1/user`, {
    headers: authHeaders(config, session.accessToken),
  });
  const user = response.ok ? await readJson(response) : null;
  history.replaceState(null, '', `${location.pathname}${location.search}`);
  if (typeof user?.id !== 'string') throw new Error('The email link could not be verified. Request a fresh link and try again.');
  session.user = { id: user.id, ...(typeof user.email === 'string' ? { email: user.email } : {}) };
  saveSession(session, dependencies.sessionStorage);
  return true;
}

export function validateDeckboxImportBundle(value: unknown): value is DeckboxImportBundle {
  if (!value || typeof value !== 'object') return false;
  const bundle = value as Partial<DeckboxImportBundle>;
  if (bundle.schemaVersion !== 1 || typeof bundle.title !== 'string' || typeof bundle.source !== 'string'
    || !Array.isArray(bundle.decks) || bundle.decks.length === 0 || bundle.decks.length > MAX_IMPORT_RECORDS) return false;
  const seen = new Set<string>();
  return bundle.decks.every((deck) => {
    if (!deck || typeof deck !== 'object' || (typeof deck.id !== 'string' && typeof deck.id !== 'number')
      || typeof deck.name !== 'string' || !Array.isArray(deck.main) || !Array.isArray(deck.sideboard)) return false;
    const id = String(deck.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return [...deck.main, ...deck.sideboard].every((card) => card && typeof card.name === 'string'
      && Number.isSafeInteger(card.quantity) && card.quantity > 0);
  });
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function sha256(text: string, cryptoImpl: PrivateBreweryDependencies['crypto']): Promise<string> {
  if (!cryptoImpl?.subtle) throw new Error('Secure browser hashing is unavailable; nothing was imported.');
  const bytes = new TextEncoder().encode(text);
  const digest = await cryptoImpl.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function restUrl(config: SupabasePublicConfig, table: string, query = ''): string {
  return `${config.url}/rest/v1/${table}${query}`;
}

async function checkedFetch(
  fetcher: typeof fetch,
  input: string,
  init: RequestInit,
  failure: string,
): Promise<Response> {
  const response = await fetcher(input, init);
  if (!response.ok) {
    const payload = await readJson(response);
    const detail = typeof payload?.message === 'string' ? payload.message
      : typeof payload?.details === 'string' ? payload.details : '';
    throw new Error(`${failure}${detail ? ` ${detail.slice(0, 180)}` : ''}`);
  }
  return response;
}

export async function loadPrivateDeckBrewery(
  config: SupabasePublicConfig,
  dependencies: PrivateBreweryDependencies = defaultDependencies(),
): Promise<PrivateBrewerySnapshot> {
  const session = await getAuthorizedPrivateBrewerySession(config, dependencies);
  const fetcher = dependencies.fetcher || fetch;
  const headers = authHeaders(config, session.accessToken);
  const ownerFilter = `owner_id=eq.${encodeURIComponent(session.user.id)}`;
  const [manifestResponse, decksResponse] = await Promise.all([
    checkedFetch(fetcher, restUrl(config, PRIVATE_BREWERY_IMPORT_TABLE, `?select=bundle_metadata,record_count,status,source_hash&${ownerFilter}&limit=1`),
      { headers }, 'The private import record could not be read.'),
    checkedFetch(fetcher, restUrl(config, PRIVATE_BREWERY_DECK_TABLE, `?select=deckbox_id,source_record&${ownerFilter}&limit=${MAX_IMPORT_RECORDS}`),
      { headers }, 'The private deck rows could not be read.'),
  ]);
  const [manifestRows, deckRows] = await Promise.all([manifestResponse.json(), decksResponse.json()]);
  if (!Array.isArray(manifestRows) || !Array.isArray(deckRows)) throw new Error('Supabase returned an invalid private brewery record.');
  const importRecord = manifestRows[0] as PrivateBreweryImportRecord | undefined;
  const decks = deckRows as PrivateBreweryDeckRow[];
  if (decks.some((row) => typeof row?.deckbox_id !== 'string' || !validateSourceRecord(row?.source_record)
    || String(row.source_record.id) !== row.deckbox_id)) {
    throw new Error('A saved private deck row did not pass validation. Nothing was displayed.');
  }
  if (importRecord && (typeof importRecord.bundle_metadata !== 'object' || importRecord.bundle_metadata === null
    || !Number.isSafeInteger(importRecord.record_count) || importRecord.record_count < 1
    || !/^[a-f0-9]{64}$/.test(importRecord.source_hash)
    || !['importing', 'complete'].includes(importRecord.status))) {
    throw new Error('The private import metadata did not pass validation. Nothing was displayed.');
  }
  if (importRecord?.status === 'complete' && decks.length !== importRecord.record_count) {
    throw new Error(`The private Deckbox import is incomplete (${decks.length} of ${importRecord.record_count} records). Resume the import before browsing.`);
  }
  decks.sort((a, b) => {
    const aName = String(a.source_record.name).toLocaleLowerCase();
    const bName = String(b.source_record.name).toLocaleLowerCase();
    return aName.localeCompare(bName) || a.deckbox_id.localeCompare(b.deckbox_id);
  });
  return { session, importRecord: importRecord || null, decks };
}

function validateSourceRecord(value: unknown): value is DeckboxSourceRecord {
  if (!value || typeof value !== 'object') return false;
  const source = value as Partial<DeckboxSourceRecord>;
  return (typeof source.id === 'string' || typeof source.id === 'number')
    && typeof source.name === 'string' && Array.isArray(source.main) && Array.isArray(source.sideboard)
    && [...source.main, ...source.sideboard].every((card) => card && typeof card.name === 'string'
      && Number.isSafeInteger(card.quantity) && card.quantity > 0);
}

export async function importPrivateDeckBrewery(
  bundle: unknown,
  rawText: string,
  config: SupabasePublicConfig,
  onProgress?: (message: string) => void,
  dependencies: PrivateBreweryDependencies = defaultDependencies(),
): Promise<{ imported: number; sourceHash: string }> {
  if (!validateDeckboxImportBundle(bundle)) throw new Error('The Deckbox bundle did not pass validation. Nothing was imported.');
  ensureApprovedProject(config);
  const session = await getAuthorizedPrivateBrewerySession(config, dependencies);
  const fetcher = dependencies.fetcher || fetch;
  const ownerId = session.user.id;
  const sourceHash = await sha256(rawText, dependencies.crypto || globalThis.crypto);
  const metadata: Record<string, unknown> = {
    schemaVersion: bundle.schemaVersion,
    title: bundle.title,
    privacy: bundle.privacy,
    source: bundle.source,
    caveats: bundle.caveats,
    edhrecNotes: bundle.edhrecNotes,
  };
  const headers = {
    ...authHeaders(config, session.accessToken),
    Prefer: 'resolution=merge-duplicates,return=minimal',
  };
  onProgress?.(`Saving private import record for ${bundle.decks.length} source entries…`);
  await checkedFetch(fetcher, restUrl(config, PRIVATE_BREWERY_IMPORT_TABLE, '?on_conflict=owner_id'), {
    method: 'POST', headers,
    body: JSON.stringify({ owner_id: ownerId, source_hash: sourceHash, bundle_metadata: metadata, record_count: bundle.decks.length, status: 'importing', updated_at: new Date((dependencies.now || Date.now)()).toISOString() }),
  }, 'The private import record could not be saved.');

  const payload = bundle.decks.map((sourceRecord) => ({
    owner_id: ownerId,
    deckbox_id: String(sourceRecord.id),
    source_record: sourceRecord,
  }));
  for (let start = 0; start < payload.length; start += IMPORT_BATCH_SIZE) {
    const batch = payload.slice(start, start + IMPORT_BATCH_SIZE);
    const query = `?on_conflict=${encodeURIComponent('owner_id,deckbox_id')}`;
    await checkedFetch(fetcher, restUrl(config, PRIVATE_BREWERY_DECK_TABLE, query), {
      method: 'POST', headers, body: JSON.stringify(batch),
    }, `Private deck import stopped after ${start} entries. Retry to resume safely.`);
    onProgress?.(`Saved ${Math.min(start + batch.length, payload.length)} of ${payload.length} source entries…`);
  }

  const verifyQuery = `?select=deckbox_id,source_record&${`owner_id=eq.${encodeURIComponent(ownerId)}`}&limit=${MAX_IMPORT_RECORDS}`;
  const verifyResponse = await checkedFetch(fetcher, restUrl(config, PRIVATE_BREWERY_DECK_TABLE, verifyQuery), {
    headers: authHeaders(config, session.accessToken),
  }, 'The private import could not be verified after upload.');
  const verifyRows = await verifyResponse.json() as PrivateBreweryDeckRow[];
  const verifiedById = new Map(verifyRows.map((row) => [row.deckbox_id, row.source_record]));
  const complete = verifyRows.length === payload.length && payload.every((row) => {
    const stored = verifiedById.get(row.deckbox_id);
    return stored !== undefined && canonicalJson(stored) === canonicalJson(row.source_record);
  });
  if (!complete) throw new Error(`Only ${verifyRows.length} of ${payload.length} source entries were verified. The import remains marked incomplete; retry it to resume.`);

  const ownerQuery = `?owner_id=eq.${encodeURIComponent(ownerId)}`;
  await checkedFetch(fetcher, restUrl(config, PRIVATE_BREWERY_IMPORT_TABLE, ownerQuery), {
    method: 'PATCH',
    headers: { ...authHeaders(config, session.accessToken), Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'complete', updated_at: new Date((dependencies.now || Date.now)()).toISOString() }),
  }, 'The verified import could not be marked complete.');
  return { imported: payload.length, sourceHash };
}
