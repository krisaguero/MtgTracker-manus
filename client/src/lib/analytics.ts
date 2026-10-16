export const ANALYTICS_CONSENT_STORAGE_KEY = 'mtg_tracker_analytics_consent_v1';

export function isAnalyticsOptedIn(storage?: Pick<Storage, 'getItem'>): boolean {
  try {
    const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    return target?.getItem(ANALYTICS_CONSENT_STORAGE_KEY) === 'opt-in';
  } catch {
    return false;
  }
}

export function saveAnalyticsConsent(optedIn: boolean, storage?: Pick<Storage, 'setItem'>): void {
  const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!target) return;
  target.setItem(ANALYTICS_CONSENT_STORAGE_KEY, optedIn ? 'opt-in' : 'opt-out');
}

export function loadUmamiAnalytics(endpoint: string | undefined, websiteId: string | undefined, documentRef: Document): boolean {
  const normalizedEndpoint = endpoint?.trim().replace(/\/+$/, '');
  const normalizedWebsiteId = websiteId?.trim();
  if (!normalizedEndpoint || !normalizedWebsiteId) return false;

  try {
    const parsedEndpoint = new URL(normalizedEndpoint);
    if (parsedEndpoint.protocol !== 'https:' && parsedEndpoint.protocol !== 'http:') return false;
  } catch {
    return false;
  }

  if (documentRef.querySelector('script[data-umami-analytics]')) return false;

  const script = documentRef.createElement('script');
  script.defer = true;
  script.src = `${normalizedEndpoint}/umami`;
  script.dataset.umamiAnalytics = 'true';
  script.dataset.websiteId = normalizedWebsiteId;
  documentRef.head.appendChild(script);
  return true;
}
