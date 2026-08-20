/* Design reminder: hard-edged private delivery ledger; stores only local dispatch metadata, never provider credentials or message bodies. */

export type DigestDeliveryStatus = 'sent' | 'failed';

export interface DigestDeliveryLogEntry {
  id: string;
  sentAt: string;
  recipient: string;
  subject: string;
  status: DigestDeliveryStatus;
  detail?: string;
}

const STORAGE_KEY = 'mtg_tracker_digest_delivery_log_v1';
const MAX_ENTRIES = 20;

export function loadDigestDeliveryLog(): DigestDeliveryLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((entry): entry is DigestDeliveryLogEntry => Boolean(entry && typeof entry.id === 'string' && typeof entry.sentAt === 'string' && typeof entry.recipient === 'string' && typeof entry.subject === 'string' && (entry.status === 'sent' || entry.status === 'failed'))) : [];
  } catch {
    return [];
  }
}

function writeDigestDeliveryLog(entries: DigestDeliveryLogEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // The report remains usable if local storage is unavailable.
  }
}

export function recordDigestDelivery(input: Omit<DigestDeliveryLogEntry, 'id' | 'sentAt'>): DigestDeliveryLogEntry {
  const entry: DigestDeliveryLogEntry = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sentAt: new Date().toISOString(),
  };
  writeDigestDeliveryLog([entry, ...loadDigestDeliveryLog()]);
  return entry;
}

export function clearDigestDeliveryLog() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
