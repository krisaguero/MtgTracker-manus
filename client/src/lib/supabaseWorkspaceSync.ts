import {
  validateLocalWorkspaceBackup,
  type LocalWorkspaceBackup,
} from '@/lib/localWorkspace';

export const SUPABASE_SYNC_OPT_IN_KEY = 'mtg_tracker_supabase_workspace_sync_opt_in_v1';
export const SUPABASE_SYNC_SESSION_KEY = 'mtg_tracker_supabase_workspace_session_v1';
export const SUPABASE_WORKSPACE_TABLE = 'mtg_personal_workspace_backups';

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseWorkspaceSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: { id: string; email?: string };
}

export interface SupabaseSyncDependencies {
  localStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  sessionStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  fetcher?: typeof fetch;
  now?: () => number;
}

export interface SupabaseWorkspaceSnapshot {
  backup: LocalWorkspaceBackup;
  updatedAt: string;
}

const defaultDependencies = (): SupabaseSyncDependencies => ({
  localStorage: window.localStorage,
  sessionStorage: window.sessionStorage,
  fetcher: fetch,
  now: () => Date.now(),
});

export function getSupabasePublicConfig(env: Record<string, unknown> = import.meta.env): SupabasePublicConfig | null {
  const rawUrl = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : '';
  const anonKey = typeof env.VITE_SUPABASE_ANON_KEY === 'string' ? env.VITE_SUPABASE_ANON_KEY.trim() : '';
  if (!rawUrl || !anonKey) return null;

  try {
    const parsed = new URL(rawUrl);
    const isLocalHttp = parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !isLocalHttp) return null;
    return { url: parsed.origin, anonKey };
  } catch {
    return null;
  }
}

export function isSupabaseSyncOptedIn(storage: SupabaseSyncDependencies['localStorage'] = defaultDependencies().localStorage): boolean {
  return storage.getItem(SUPABASE_SYNC_OPT_IN_KEY) === 'true';
}

export function setSupabaseSyncOptIn(
  enabled: boolean,
  dependencies: SupabaseSyncDependencies = defaultDependencies(),
): void {
  if (enabled) {
    dependencies.localStorage.setItem(SUPABASE_SYNC_OPT_IN_KEY, 'true');
    return;
  }
  dependencies.localStorage.removeItem(SUPABASE_SYNC_OPT_IN_KEY);
  dependencies.sessionStorage.removeItem(SUPABASE_SYNC_SESSION_KEY);
}

export function loadSupabaseWorkspaceSession(
  storage: SupabaseSyncDependencies['sessionStorage'] = defaultDependencies().sessionStorage,
): SupabaseWorkspaceSession | null {
  try {
    const raw = storage.getItem(SUPABASE_SYNC_SESSION_KEY);
    if (!raw) return null;
    const session: unknown = JSON.parse(raw);
    if (!session || typeof session !== 'object') return null;
    const value = session as Partial<SupabaseWorkspaceSession>;
    if (typeof value.accessToken !== 'string' || typeof value.refreshToken !== 'string'
      || typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt)
      || !value.user || typeof value.user.id !== 'string') return null;
    return value as SupabaseWorkspaceSession;
  } catch {
    return null;
  }
}

function saveSession(session: SupabaseWorkspaceSession, storage: SupabaseSyncDependencies['sessionStorage']) {
  storage.setItem(SUPABASE_SYNC_SESSION_KEY, JSON.stringify(session));
}

function removeSession(storage: SupabaseSyncDependencies['sessionStorage']) {
  storage.removeItem(SUPABASE_SYNC_SESSION_KEY);
}

function assertOptedIn(dependencies: SupabaseSyncDependencies) {
  if (!isSupabaseSyncOptedIn(dependencies.localStorage)) {
    throw new Error('Enable optional cloud backup before connecting or transferring workspace data.');
  }
}

function authHeaders(config: SupabasePublicConfig, accessToken?: string) {
  return {
    apikey: config.anonKey,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    'Content-Type': 'application/json',
  };
}

async function responseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function throwResponseError(response: Response, fallback: string): Promise<never> {
  const body = await responseJson(response);
  const message = typeof body?.msg === 'string' ? body.msg
    : typeof body?.message === 'string' ? body.message
      : typeof body?.error_description === 'string' ? body.error_description
        : fallback;
  throw new Error(message.slice(0, 300));
}

function messageFromErrorBody(body: any, fallback: string) {
  const message = typeof body?.msg === 'string' ? body.msg
    : typeof body?.message === 'string' ? body.message
      : typeof body?.error_description === 'string' ? body.error_description
        : fallback;
  return message.slice(0, 300);
}

function sessionFromPayload(payload: any, now: number): SupabaseWorkspaceSession | null {
  if (typeof payload?.access_token !== 'string' || typeof payload?.refresh_token !== 'string'
    || typeof payload?.user?.id !== 'string') return null;
  const expiresIn = Number(payload.expires_in);
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: now + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600) * 1000,
    user: { id: payload.user.id, ...(typeof payload.user.email === 'string' ? { email: payload.user.email } : {}) },
  };
}

async function authRequest(
  path: string,
  body: Record<string, string>,
  config: SupabasePublicConfig,
  dependencies: SupabaseSyncDependencies,
) {
  const fetcher = dependencies.fetcher || fetch;
  const response = await fetcher(`${config.url}/auth/v1/${path}`, {
    method: 'POST',
    headers: authHeaders(config),
    body: JSON.stringify(body),
  });
  const payload = await responseJson(response);
  if (!response.ok) throw new Error(messageFromErrorBody(payload, 'Supabase authentication failed.'));
  return payload;
}

export async function signInToSupabase(
  email: string,
  password: string,
  config: SupabasePublicConfig,
  dependencies: SupabaseSyncDependencies = defaultDependencies(),
): Promise<SupabaseWorkspaceSession> {
  assertOptedIn(dependencies);
  const payload = await authRequest('token?grant_type=password', { email: email.trim(), password }, config, dependencies);
  const session = sessionFromPayload(payload, (dependencies.now || Date.now)());
  if (!session) throw new Error('Supabase did not return a signed-in session. Check email confirmation and try again.');
  saveSession(session, dependencies.sessionStorage);
  return session;
}

export async function createSupabaseAccount(
  email: string,
  password: string,
  config: SupabasePublicConfig,
  dependencies: SupabaseSyncDependencies = defaultDependencies(),
): Promise<SupabaseWorkspaceSession | null> {
  assertOptedIn(dependencies);
  const payload = await authRequest('signup', { email: email.trim(), password }, config, dependencies);
  const session = sessionFromPayload(payload, (dependencies.now || Date.now)());
  if (session) saveSession(session, dependencies.sessionStorage);
  return session;
}

async function refreshIfNeeded(
  session: SupabaseWorkspaceSession,
  config: SupabasePublicConfig,
  dependencies: SupabaseSyncDependencies,
): Promise<SupabaseWorkspaceSession> {
  if (session.expiresAt > (dependencies.now || Date.now)() + 30_000) return session;
  const payload = await authRequest('token?grant_type=refresh_token', { refresh_token: session.refreshToken }, config, dependencies);
  const refreshed = sessionFromPayload(payload, (dependencies.now || Date.now)());
  if (!refreshed) throw new Error('Supabase session expired. Sign in again to continue.');
  saveSession(refreshed, dependencies.sessionStorage);
  return refreshed;
}

async function requireSession(
  config: SupabasePublicConfig,
  dependencies: SupabaseSyncDependencies,
): Promise<SupabaseWorkspaceSession> {
  assertOptedIn(dependencies);
  const session = loadSupabaseWorkspaceSession(dependencies.sessionStorage);
  if (!session) throw new Error('Sign in to your Supabase account before transferring workspace data.');
  return refreshIfNeeded(session, config, dependencies);
}

export async function getAuthorizedSupabaseSession(
  config: SupabasePublicConfig,
  dependencies: SupabaseSyncDependencies = defaultDependencies(),
): Promise<SupabaseWorkspaceSession> {
  return requireSession(config, dependencies);
}

function restUrl(config: SupabasePublicConfig, query: string) {
  return `${config.url}/rest/v1/${SUPABASE_WORKSPACE_TABLE}${query}`;
}

export async function backupWorkspaceToSupabase(
  backup: unknown,
  config: SupabasePublicConfig,
  dependencies: SupabaseSyncDependencies = defaultDependencies(),
): Promise<string> {
  if (!validateLocalWorkspaceBackup(backup)) throw new Error('Local workspace backup did not pass validation; nothing was uploaded.');
  const session = await requireSession(config, dependencies);
  const response = await (dependencies.fetcher || fetch)(restUrl(config, '?on_conflict=user_id'), {
    method: 'POST',
    headers: { ...authHeaders(config, session.accessToken), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: session.user.id, backup, updated_at: new Date((dependencies.now || Date.now)()).toISOString() }),
  });
  if (!response.ok) await throwResponseError(response, 'Cloud backup failed. Check that the reviewed table migration has been applied.');
  return new Date((dependencies.now || Date.now)()).toISOString();
}

export async function restoreWorkspaceFromSupabase(
  config: SupabasePublicConfig,
  dependencies: SupabaseSyncDependencies = defaultDependencies(),
): Promise<SupabaseWorkspaceSnapshot | null> {
  const session = await requireSession(config, dependencies);
  const query = `?select=backup,updated_at&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`;
  const response = await (dependencies.fetcher || fetch)(restUrl(config, query), {
    method: 'GET',
    headers: authHeaders(config, session.accessToken),
  });
  if (!response.ok) await throwResponseError(response, 'Cloud restore failed. Check that the reviewed table migration has been applied.');
  const rows = await responseJson(response);
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const row = rows[0];
  if (!row || !validateLocalWorkspaceBackup(row.backup) || typeof row.updated_at !== 'string') {
    throw new Error('The saved cloud record is not a supported workspace backup. Nothing was restored.');
  }
  return { backup: row.backup, updatedAt: row.updated_at };
}

export async function signOutFromSupabase(
  config: SupabasePublicConfig | null,
  dependencies: SupabaseSyncDependencies = defaultDependencies(),
): Promise<void> {
  const session = loadSupabaseWorkspaceSession(dependencies.sessionStorage);
  try {
    if (config && session) {
      await (dependencies.fetcher || fetch)(`${config.url}/auth/v1/logout`, {
        method: 'POST',
        headers: authHeaders(config, session.accessToken),
      });
    }
  } catch {
    // Local sign-out/opt-out must still work if the project is temporarily unavailable.
  } finally {
    removeSession(dependencies.sessionStorage);
  }
}
