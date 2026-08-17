/* Design reminder: hard-edged local market utility; alert rows are compact, explicit, and entirely private to the browser. */

export interface PriceAlert {
  cardName: string;
  setCode?: string;
  thresholdPercent: number;
  baselinePrice: number;
  lastPrice: number;
  createdAt: string;
  updatedAt: string;
  triggered: boolean;
}

const STORAGE_KEY = 'mtg_tracker_price_alerts_v1';

function readAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is PriceAlert => Boolean(value && typeof value.cardName === 'string')) : [];
  } catch {
    return [];
  }
}

function writeAlerts(alerts: PriceAlert[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // Local-only alerts remain in memory for the active view when storage is unavailable.
  }
}

export function loadPriceAlerts(): PriceAlert[] {
  return readAlerts();
}

export function savePriceAlert(input: Omit<PriceAlert, 'createdAt' | 'updatedAt' | 'triggered'>): PriceAlert {
  const now = new Date().toISOString();
  const alerts = readAlerts();
  const existing = alerts.find((alert) => alert.cardName.toLowerCase() === input.cardName.toLowerCase());
  const next: PriceAlert = {
    ...input,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    triggered: existing?.triggered || false,
  };
  writeAlerts([...alerts.filter((alert) => alert.cardName.toLowerCase() !== input.cardName.toLowerCase()), next]);
  return next;
}

export function removePriceAlert(cardName: string) {
  writeAlerts(readAlerts().filter((alert) => alert.cardName.toLowerCase() !== cardName.toLowerCase()));
}

export function isPriceAlertTriggered(alert: PriceAlert, currentPrice: number) {
  if (alert.baselinePrice <= 0) return false;
  return ((currentPrice - alert.baselinePrice) / alert.baselinePrice) * 100 >= alert.thresholdPercent;
}

export function refreshPriceAlerts(currentPrices: Array<{ cardName: string; currentUsd: number }>): PriceAlert[] {
  const alerts = readAlerts();
  const refreshed = alerts.map((alert) => {
    const current = currentPrices.find((item) => item.cardName.toLowerCase() === alert.cardName.toLowerCase());
    if (!current) return alert;
    const triggered = isPriceAlertTriggered(alert, current.currentUsd);
    return { ...alert, lastPrice: current.currentUsd, triggered, updatedAt: new Date().toISOString() };
  });
  writeAlerts(refreshed);
  return refreshed;
}
