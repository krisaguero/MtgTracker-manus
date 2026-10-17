import dailyMarketSnapshot from '@/data/dailyMarketSnapshot.json';
import type { MoverCard } from '@/lib/dailyMoversEngine';

export interface CanonicalCardSnapshot {
  id: string;
  name: string;
  setCode: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  currentUsd: number;
  previousUsd: number;
  percentChange: number;
  recentPrices: number[];
  category: string;
  signalSource: MoverCard['signalSource'];
  priceSource: string;
  sourceCount: number;
  lastUpdated: string;
  thesis: string;
  cardKingdomUsd?: number;
  tcgplayerMarketUsd?: number;
  mtgGoldfishUsd?: number;
  isCatalyst?: boolean;
}

export interface CanonicalMarketItem {
  name: string;
  setCode: string;
  setName: string;
  format: string;
  category: string;
  price: number;
  trend: 'up' | 'down';
  pct: number;
  reason: string;
  imageUrl: string;
  isCatalyst?: boolean;
  priceSource: string;
  sourceCount: number;
  lastUpdated: string;
}

export interface GeneratedDailySignal {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  rarity: string;
  format: string;
  category: string;
  currentUsd: number;
  previousUsd: number;
  percentChange: number;
  trend: string;
  tcgplayerMarketUsd: number | null;
  cardKingdomUsd: number | null;
  imageUrl: string;
  reason: string;
  isCatalyst: boolean;
  lastUpdated: string;
  source?: string;
  sourceCount?: number;
}

export interface GeneratedDailySnapshot {
  signalCount: number;
  signals: GeneratedDailySignal[];
}

const generatedDailySnapshot = dailyMarketSnapshot as GeneratedDailySnapshot;

function isSourceDatedSignal(signal: GeneratedDailySignal): boolean {
  return Boolean(
    signal &&
    typeof signal.name === 'string' &&
    typeof signal.setCode === 'string' &&
    typeof signal.lastUpdated === 'string' &&
    signal.lastUpdated.trim() &&
    typeof signal.source === 'string' &&
    signal.source.trim() &&
    Number.isFinite(signal.currentUsd) &&
    signal.currentUsd > 0 &&
    Number.isFinite(signal.previousUsd) &&
    Number.isFinite(signal.percentChange)
  );
}

/** Converts only rows with a source timestamp and finite observed values; an empty feed stays empty. */
export function canonicalRowsFromSnapshot(snapshot: GeneratedDailySnapshot): CanonicalMarketItem[] {
  if (!snapshot || !Array.isArray(snapshot.signals)) return [];
  return snapshot.signals.filter(isSourceDatedSignal).map((signal) => ({
    name: signal.name,
    setCode: signal.setCode,
    setName: signal.setName || signal.setCode.toUpperCase(),
    format: signal.format || 'Unknown format',
    category: signal.category || 'Uncategorized',
    price: signal.currentUsd,
    trend: signal.trend === 'down' ? 'down' : 'up',
    pct: signal.percentChange,
    reason: signal.reason || 'Source-dated market observation; verify the exact printing and current listings.',
    imageUrl: signal.imageUrl,
    isCatalyst: signal.isCatalyst,
    priceSource: signal.source || 'Source not identified',
    sourceCount: Number.isFinite(signal.sourceCount) ? Number(signal.sourceCount) : 0,
    lastUpdated: signal.lastUpdated,
  }));
}

export const canonicalMarketRows: CanonicalMarketItem[] = canonicalRowsFromSnapshot(generatedDailySnapshot);

function canonicalSnapshotsFromSnapshot(snapshot: GeneratedDailySnapshot): CanonicalCardSnapshot[] {
  if (!snapshot || !Array.isArray(snapshot.signals)) return [];
  return snapshot.signals.filter(isSourceDatedSignal).map((signal) => ({
    id: signal.id,
    name: signal.name,
    setCode: signal.setCode,
    rarity: signal.rarity === 'common' || signal.rarity === 'uncommon' || signal.rarity === 'rare' || signal.rarity === 'mythic' ? signal.rarity : 'uncommon',
    currentUsd: signal.currentUsd,
    previousUsd: signal.previousUsd,
    percentChange: signal.percentChange,
    recentPrices: [signal.previousUsd, signal.currentUsd],
    category: signal.category,
    signalSource: 'MTGJSON Aggregate',
    priceSource: signal.source || 'Source not identified',
    sourceCount: Number.isFinite(signal.sourceCount) ? Number(signal.sourceCount) : 0,
    lastUpdated: signal.lastUpdated,
    thesis: signal.reason,
    cardKingdomUsd: signal.cardKingdomUsd ?? undefined,
    tcgplayerMarketUsd: signal.tcgplayerMarketUsd ?? undefined,
    isCatalyst: signal.isCatalyst,
  }));
}

/** Uses the checked-in dated snapshot only; no synthetic rows or current-time stamps are created. */
export function loadCanonicalSnapshots(): CanonicalCardSnapshot[] {
  return canonicalSnapshotsFromSnapshot(generatedDailySnapshot);
}
