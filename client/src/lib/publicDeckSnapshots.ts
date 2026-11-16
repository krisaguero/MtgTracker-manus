import { getSupabasePublicConfig, type SupabasePublicConfig } from '@/lib/supabaseWorkspaceSync';

export type PublicDeckSnapshotKind = 'source' | 'generated';
export interface PublicDeckCard { name: string; quantity: number }
export interface PublicDeckReference { label: string; url: string }
export interface PublicDeckSnapshotPayload {
  schema_version: 1;
  kind: PublicDeckSnapshotKind;
  title: string;
  format_label: string;
  summary: string;
  status: string;
  main: PublicDeckCard[];
  sideboard: PublicDeckCard[];
  warnings: string[];
  references?: PublicDeckReference[];
}
export interface PublicDeckSnapshot {
  share_id: string;
  content_hash: string;
  payload: PublicDeckSnapshotPayload;
  published_at: string;
}

const MAX_ROWS = 250;
const MAX_CARDS = 3000;
const MAX_WARNINGS = 100;
const MAX_STRING = 20_000;
const REFERENCE_HOSTS = new Set([
  'scryfall.com', 'www.scryfall.com', 'edhrec.com', 'www.edhrec.com',
  'magic.wizards.com', 'www.magic.wizards.com',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function isNonemptyString(value: unknown, max = MAX_STRING): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}
function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}
function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
function validCards(value: unknown): value is PublicDeckCard[] {
  return Array.isArray(value) && value.length <= MAX_CARDS && value.every((card) => {
    if (!isRecord(card) || !hasOnlyKeys(card, ['name', 'quantity'])) return false;
    return isNonemptyString(card.name, 250)
      && typeof card.quantity === 'number' && Number.isSafeInteger(card.quantity)
      && card.quantity > 0 && card.quantity <= 2_147_483_647;
  });
}
function validReferences(value: unknown): value is PublicDeckReference[] {
  return Array.isArray(value) && value.length <= 50 && value.every((reference) => {
    if (!isRecord(reference) || !hasOnlyKeys(reference, ['label', 'url'])
      || !isNonemptyString(reference.label, 200) || !isNonemptyString(reference.url, 2048)) return false;
    try {
      const url = new URL(reference.url);
      return url.protocol === 'https:' && REFERENCE_HOSTS.has(url.hostname.toLowerCase())
        && !url.username && !url.password;
    } catch {
      return false;
    }
  });
}

export function validatePublicDeckSnapshotPayload(value: unknown): value is PublicDeckSnapshotPayload {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    'schema_version', 'kind', 'title', 'format_label', 'summary', 'status',
    'main', 'sideboard', 'warnings', 'references',
  ])) return false;
  return value.schema_version === 1
    && (value.kind === 'source' || value.kind === 'generated')
    && isNonemptyString(value.title, 300)
    && typeof value.format_label === 'string' && value.format_label.length <= 300
    && typeof value.summary === 'string' && value.summary.length <= MAX_STRING
    && typeof value.status === 'string' && value.status.length <= 300
    && validCards(value.main) && validCards(value.sideboard)
    && Array.isArray(value.warnings) && value.warnings.length <= MAX_WARNINGS
    && value.warnings.every((warning) => typeof warning === 'string' && warning.length <= 1000)
    && (value.references === undefined || validReferences(value.references));
}

export function validatePublicDeckSnapshot(value: unknown): value is PublicDeckSnapshot {
  return isRecord(value) && hasOnlyKeys(value, ['share_id', 'content_hash', 'payload', 'published_at'])
    && isUuid(value.share_id) && isSha256(value.content_hash)
    && validatePublicDeckSnapshotPayload(value.payload)
    && isNonemptyString(value.published_at, 100);
}

async function responseJson(response: Response): Promise<unknown> {
  try { return await response.json() as unknown; } catch { return null; }
}
function responseError(payload: unknown): string {
  if (!isRecord(payload)) return '';
  for (const key of ['message', 'details', 'hint']) {
    if (typeof payload[key] === 'string' && payload[key].trim()) return String(payload[key]).trim().slice(0, 220);
  }
  return '';
}

export interface PublicDeckSnapshotLoaderDependencies { fetcher?: typeof fetch }

export async function loadPublicDeckSnapshots(
  config: SupabasePublicConfig | null = getSupabasePublicConfig(),
  dependencies?: PublicDeckSnapshotLoaderDependencies,
): Promise<PublicDeckSnapshot[]> {
  if (!config) throw new Error('Public deck snapshots are not configured.');
  const fetcher = dependencies?.fetcher || fetch;
  const response = await fetcher(`${config.url}/rest/v1/rpc/list_public_deck_brewery_shares`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  const payload = await responseJson(response);
  if (!response.ok) throw new Error(responseError(payload) || 'Public deck snapshots are temporarily unavailable.');
  if (!Array.isArray(payload) || payload.length > MAX_ROWS || payload.some((row) => !validatePublicDeckSnapshot(row))) {
    throw new Error('A public snapshot did not pass validation and was not displayed.');
  }
  return payload as PublicDeckSnapshot[];
}

export { getSupabasePublicConfig };
