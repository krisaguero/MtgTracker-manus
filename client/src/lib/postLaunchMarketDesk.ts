export type FloorStatus = 'still-falling' | 'possible-floor' | 'rebounding' | 'low-liquidity-noise' | 'unresolved';

export type PostLaunchCard = {
  name: string;
  setCode: string;
  collectorNumber?: string;
  role: 'portable utility' | 'precon fit' | 'theme speculation';
  deck: string;
  deckHref: string;
  cardHref: string;
  baselineUsd: number | null;
  latestUsd: number | null;
  snapshots: Array<{ date: string; usd: number | null }>;
  sellerDepth: 'broad' | 'thin' | 'unknown';
  thesis: string;
  action: 'buy-for-play' | 'bundle' | 'hold' | 'watch';
  quantityNeeded: number;
  deckSlot: string;
  slotRole: 'anchor' | 'bridge' | 'upgrade' | 'theme-watch';
  confidence: 'high' | 'medium' | 'low';
  thesisReviewMonth: string;
};

export const postLaunchCards: PostLaunchCard[] = [
  {
    name: 'Academy Ruins', setCode: 'eoc', role: 'portable utility', deck: 'We Are the Borg', deckHref: '/deck/eoc/we-are-the-borg', cardHref: '/card/Academy%20Ruins',
    baselineUsd: 9.5, latestUsd: 5.25, snapshots: [{ date: '2026-11-13', usd: 9.5 }, { date: '2026-11-15', usd: 5.5 }, { date: '2026-11-16', usd: 5.25 }], sellerDepth: 'broad',
    thesis: 'Broad artifact-recursion demand makes this the cleanest utility-floor test after new Star Trek supply.', action: 'bundle', quantityNeeded: 1, deckSlot: 'Artifact recursion land', slotRole: 'anchor', confidence: 'high', thesisReviewMonth: '2026-12',
  },
  {
    name: 'Foundry Inspector', setCode: 'eoc', role: 'portable utility', deck: 'We Are the Borg', deckHref: '/deck/eoc/we-are-the-borg', cardHref: '/card/Foundry%20Inspector',
    baselineUsd: 3.25, latestUsd: 1.1, snapshots: [{ date: '2026-11-13', usd: 3.25 }, { date: '2026-11-15', usd: 1.2 }, { date: '2026-11-16', usd: 1.1 }], sellerDepth: 'broad',
    thesis: 'One copy bridges artifact-heavy builds; reserve before buying duplicates for Keen Engineering.', action: 'buy-for-play', quantityNeeded: 2, deckSlot: 'Cost reduction package', slotRole: 'bridge', confidence: 'high', thesisReviewMonth: '2026-12',
  },
  {
    name: 'World at War', setCode: 'eoc', role: 'precon fit', deck: 'Klingon Fury', deckHref: '/deck/eoc/klingon-fury', cardHref: '/card/World%20at%20War',
    baselineUsd: 5.75, latestUsd: 2.4, snapshots: [{ date: '2026-11-13', usd: 5.75 }, { date: '2026-11-15', usd: 2.6 }, { date: '2026-11-16', usd: 2.4 }], sellerDepth: 'broad',
    thesis: 'A real extra-combat upgrade, but the reprint is too fresh to treat as a rebound candidate.', action: 'watch', quantityNeeded: 1, deckSlot: 'Extra-combat finisher', slotRole: 'upgrade', confidence: 'medium', thesisReviewMonth: '2026-12',
  },
  {
    name: 'Windcrag Siege', setCode: 'eoc', role: 'theme speculation', deck: 'Klingon Fury', deckHref: '/deck/eoc/klingon-fury', cardHref: '/card/Windcrag%20Siege',
    baselineUsd: 4.5, latestUsd: 3.8, snapshots: [{ date: '2026-11-13', usd: 4.5 }, { date: '2026-11-15', usd: 3.75 }, { date: '2026-11-16', usd: 3.8 }], sellerDepth: 'thin',
    thesis: 'Worf-facing demand is plausible, but the narrow buyer base makes seller depth more important than the headline price.', action: 'watch', quantityNeeded: 1, deckSlot: 'Warrior attack trigger', slotRole: 'theme-watch', confidence: 'low', thesisReviewMonth: '2026-12',
  },
  {
    name: 'Open the Way', setCode: 'eoc', role: 'precon fit', deck: 'Landing Party', deckHref: '/deck/eoc/landing-party', cardHref: '/card/Open%20the%20Way',
    baselineUsd: 3.9, latestUsd: 2.15, snapshots: [{ date: '2026-11-13', usd: 3.9 }, { date: '2026-11-15', usd: 2.1 }, { date: '2026-11-16', usd: 2.15 }], sellerDepth: 'broad',
    thesis: 'Test the land-name threshold in Commander Spock before treating this as a necessary purchase.', action: 'watch', quantityNeeded: 1, deckSlot: 'Differently-named land ramp', slotRole: 'upgrade', confidence: 'medium', thesisReviewMonth: '2026-12',
  },
  {
    name: 'Merrow Commerce', setCode: 'eoc', role: 'theme speculation', deck: 'Explorers of the Deep', deckHref: '/deck/lcc/explorers-of-the-deep', cardHref: '/card/Merrow%20Commerce',
    baselineUsd: 2.5, latestUsd: 2.5, snapshots: [{ date: '2026-11-13', usd: 2.5 }, { date: '2026-11-15', usd: 2.5 }, { date: '2026-11-16', usd: 2.5 }], sellerDepth: 'unknown',
    thesis: 'Hold existing copies for a possible Nauctis bridge; do not buy before the full Merfolk list is confirmed.', action: 'hold', quantityNeeded: 1, deckSlot: 'Merfolk untap bridge', slotRole: 'theme-watch', confidence: 'low', thesisReviewMonth: '2027-01',
  },
];

export function floorStatus(card: Pick<PostLaunchCard, 'snapshots' | 'sellerDepth'>): FloorStatus {
  const values = card.snapshots.map(snapshot => snapshot.usd).filter((value): value is number => value != null);
  if (values.length < 3) return 'unresolved';
  if (card.sellerDepth === 'thin' && Math.abs(values[values.length - 1] - values[values.length - 2]) < 0.15) return 'low-liquidity-noise';
  const [a, b, c] = values.slice(-3);
  if (Math.abs(c - b) <= Math.max(0.1, b * 0.04)) return 'possible-floor';
  if (c < b && b < a) return 'still-falling';
  if (c > b && b <= a) return 'rebounding';
  return 'unresolved';
}

export function percentChange(baselineUsd: number | null, latestUsd: number | null) {
  if (baselineUsd == null || latestUsd == null || baselineUsd === 0) return null;
  return ((latestUsd - baselineUsd) / baselineUsd) * 100;
}

export const floorStatusLabels: Record<FloorStatus, string> = {
  'still-falling': 'Still falling',
  'possible-floor': 'Possible floor',
  rebounding: 'Rebounding',
  'low-liquidity-noise': 'Low-liquidity noise',
  unresolved: 'Unresolved',
};

export const confidenceLabels: Record<PostLaunchCard['confidence'], string> = {
  high: 'High · repeatable utility',
  medium: 'Medium · deck-fit dependent',
  low: 'Low · thesis watch only',
};

export type ReservationRecord = { cardName: string; deck: string; quantity: number; updatedAt: string };
export type ThesisOutcome = { cardName: string; month: string; priceDirection: 'confirmed' | 'rejected' | 'pending'; deckDemand: 'confirmed' | 'rejected' | 'pending'; notes?: string; updatedAt: string };

const RESERVATION_KEY = 'mtg-tracker:post-launch-reservations';
const BASKET_KEY = 'mtg-tracker:post-launch-basket';
const OUTCOME_KEY = 'mtg-tracker:post-launch-outcomes';

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const parsed = JSON.parse(window.localStorage.getItem(key) || 'null'); return parsed ?? fallback; } catch { return fallback; }
}
function saveJson<T>(key: string, value: T) { if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value)); }
export function loadReservations(): ReservationRecord[] { return loadJson(RESERVATION_KEY, []); }
export function reserveCopy(cardName: string, deck: string, quantity = 1) {
  const current = loadReservations();
  const index = current.findIndex(row => row.cardName === cardName && row.deck === deck);
  const next = { cardName, deck, quantity: Math.max(0, quantity), updatedAt: new Date().toISOString() };
  const updated = index >= 0 ? current.map((row, rowIndex) => rowIndex === index ? next : row) : [...current, next];
  saveJson(RESERVATION_KEY, updated.filter(row => row.quantity > 0));
  return updated;
}
export function loadBasket(): string[] { return loadJson(BASKET_KEY, []); }
export function toggleBasket(cardName: string) { const current = loadBasket(); const updated = current.includes(cardName) ? current.filter(name => name !== cardName) : [...current, cardName]; saveJson(BASKET_KEY, updated); return updated; }
export function loadThesisOutcomes(): ThesisOutcome[] { return loadJson(OUTCOME_KEY, []); }
export function saveThesisOutcome(outcome: ThesisOutcome) { const current = loadThesisOutcomes(); const index = current.findIndex(row => row.cardName === outcome.cardName && row.month === outcome.month); const updated = index >= 0 ? current.map((row, rowIndex) => rowIndex === index ? outcome : row) : [...current, outcome]; saveJson(OUTCOME_KEY, updated); return updated; }
