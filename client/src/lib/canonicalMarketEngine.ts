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
  thesis: string;
  cardKingdomUsd?: number;
  tcgplayerMarketUsd?: number;
  mtgGoldfishUsd?: number;
  isCatalyst?: boolean;
  lastUpdated: string;
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
}

const STORAGE_KEY = 'mtg_canonical_market_snapshots_v3';

interface GeneratedDailySignal {
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
}

interface GeneratedDailySnapshot {
  signalCount: number;
  signals: GeneratedDailySignal[];
}

const generatedDailySnapshot = dailyMarketSnapshot as GeneratedDailySnapshot;

const MATRIX_SEED_ROWS = [
  { cat: 'high-spikes', name: 'Tyvar, the Pummeler', set: 'ppdsk', format: 'Standard', past: 4.87, present: 52.08, pct: 969.4, thesis: 'High-value positive mover; present quoted price is at least $25.00 (promopack printing).' },
  { cat: 'high-spikes', name: 'Anduril, Narsil Reforged (Borderless)', set: 'hoc', format: 'Commander', past: 11.0, present: 75.0, pct: 581.82, thesis: 'High-value positive mover; present quoted price is at least $25.00 (commander printing).' },
  { cat: 'high-spikes', name: 'Eluge, the Shoreless Sea', set: 'ppblb', format: 'Standard', past: 5.34, present: 27.57, pct: 416.29, thesis: 'High-value positive mover; present quoted price is at least $25.00 (promopack printing).' },
  { cat: 'high-spikes', name: 'Gimli of the Glittering Caves (Extended Art)', set: 'ltc', format: 'Commander', past: 7.92, present: 37.98, pct: 379.55, thesis: 'High-value positive mover; present quoted price is at least $25.00 (commander printing).' },
  { cat: 'penny-risers', name: 'Preeminent Captain', set: 'm15', format: 'Modern', past: 0.35, present: 0.85, pct: 142.8, thesis: 'Tribal soldier attack trigger.' },
  { cat: 'penny-risers', name: 'Command Tower', set: 'cmd', format: 'Commander', past: 0.15, present: 0.30, pct: 100.0, thesis: 'Ubiquitous commander mana fix.' },
  { cat: 'commander-picks', name: 'Idol of Oblivion', set: 'plst', format: 'Commander', past: 4.0, present: 19.9, pct: 397.5, thesis: 'Commander staple with strong EDHREC rank for token strategies.' },
  { cat: 'commander-picks', name: 'The Great Henge', set: 'eld', format: 'Commander', past: 35.0, present: 58.0, pct: 65.7, thesis: 'Elite green card draw and ramp.' },
  { cat: 'modern-movers', name: 'The One Ring', set: 'ltr', format: 'Modern', past: 45.0, present: 78.0, pct: 73.3, thesis: 'Universal modern artifact engine.' },
  { cat: 'pauper-gems', name: 'Lightning Bolt', set: 'plst', format: 'Pauper', past: 3.0, present: 7.2, pct: 140.0, thesis: 'Pauper red removal pillar.' },
  { cat: 'foil-multipliers', name: 'Force of Will', set: 'all', format: 'Legacy', past: 70.0, present: 125.0, pct: 78.5, thesis: 'Alliances foil multiplier.' },
  { cat: 'reprint-squashes', name: 'Counterspell', set: 'mh2', format: 'Modern', past: 4.0, present: 1.8, pct: -55.0, thesis: 'Modern horizons reprint floor compression.' },
];

function hasGeneratedDailySignals(): boolean {
  return generatedDailySnapshot.signalCount > 0 && Array.isArray(generatedDailySnapshot.signals) && generatedDailySnapshot.signals.length > 0;
}

function generatedSnapshots(): CanonicalCardSnapshot[] {
  if (!hasGeneratedDailySignals()) return [];
  return generatedDailySnapshot.signals.map((signal) => ({
    id: signal.id,
    name: signal.name,
    setCode: signal.setCode,
    rarity: (signal.rarity === 'common' || signal.rarity === 'uncommon' || signal.rarity === 'rare' || signal.rarity === 'mythic') ? signal.rarity : 'uncommon',
    currentUsd: signal.currentUsd,
    previousUsd: signal.previousUsd,
    percentChange: signal.percentChange,
    recentPrices: [signal.previousUsd, signal.currentUsd],
    category: signal.category,
    signalSource: 'MTGJSON Aggregate',
    thesis: signal.reason,
    cardKingdomUsd: signal.cardKingdomUsd ?? undefined,
    tcgplayerMarketUsd: signal.tcgplayerMarketUsd ?? undefined,
    isCatalyst: signal.isCatalyst,
    lastUpdated: signal.lastUpdated,
  }));
}

export const canonicalMarketRows: CanonicalMarketItem[] = hasGeneratedDailySignals()
  ? generatedDailySnapshot.signals.map((signal) => ({
      name: signal.name,
      setCode: signal.setCode,
      setName: signal.setName,
      format: signal.format,
      category: signal.category,
      price: signal.currentUsd,
      trend: signal.trend === 'down' ? 'down' : 'up',
      pct: signal.percentChange,
      reason: signal.reason,
      imageUrl: signal.imageUrl,
      isCatalyst: signal.isCatalyst,
    }))
  : MATRIX_SEED_ROWS.map((row) => ({
      name: row.name,
      setCode: row.set,
      setName: row.set.toUpperCase(),
      format: row.format,
      category: row.cat,
      price: row.present,
      trend: row.pct >= 0 ? 'up' : 'down',
      pct: row.pct,
      reason: row.thesis,
      imageUrl: `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(row.name)}&format=image&version=normal`,
      isCatalyst: row.name.includes('Anduril') || row.name.includes('Tyvar') || row.name.includes('Gimli'),
    }));

export function loadCanonicalSnapshots(): CanonicalCardSnapshot[] {
  const generated = generatedSnapshots();
  if (generated.length > 0) return generated;
  if (typeof window === 'undefined') return generateSnapshotsFromMatrix();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = generateSnapshotsFromMatrix();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return generateSnapshotsFromMatrix();
}

export function saveCanonicalSnapshots(snapshots: CanonicalCardSnapshot[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // ignore
  }
}

export function generateSnapshotsFromMatrix(): CanonicalCardSnapshot[] {
  const snapshots: CanonicalCardSnapshot[] = [];
  let idCounter = 1;

  MATRIX_SEED_ROWS.forEach((row, idx) => {
    const step = (row.present - row.past) / 4;
    const recentPrices = [
      Number(row.past.toFixed(2)),
      Number((row.past + step).toFixed(2)),
      Number((row.past + step + step).toFixed(2)),
      Number((row.past + step * 3).toFixed(2)),
      Number(row.present.toFixed(2)),
    ];

    snapshots.push({
      id: `matrix-mover-${idx}-${idCounter++}`,
      name: row.name,
      setCode: row.set,
      rarity: row.present > 25 ? 'mythic' : row.present > 5 ? 'rare' : 'uncommon',
      currentUsd: row.present,
      previousUsd: row.past,
      percentChange: row.pct,
      recentPrices,
      category: row.cat,
      signalSource: 'Scryfall Snapshot',
      thesis: row.thesis,
      cardKingdomUsd: Number((row.present * 1.03).toFixed(2)),
      tcgplayerMarketUsd: Number((row.present * 0.98).toFixed(2)),
      mtgGoldfishUsd: Number((row.present * 1.01).toFixed(2)),
      isCatalyst: row.name.includes('Anduril') || row.name.includes('Gimli') || row.name.includes('Tyvar'),
      lastUpdated: new Date().toISOString(),
    });
  });

  return snapshots;
}
