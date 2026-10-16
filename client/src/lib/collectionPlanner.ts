import { collectionIdentity, type OwnedCard } from './manaboxParser';

export interface SetCollectionGoal {
  id: string;
  setCode: string;
  setName: string;
  targetPrintings: number;
  createdAt: number;
}

export interface CollectionWishlistEntry {
  id: string;
  name: string;
  setCode?: string;
  collectorNumber?: string;
  finish?: string;
  maxPriceUsd?: number;
  note?: string;
  createdAt: number;
}

export interface TradePileEntry {
  identity: string;
  quantity: number;
}

export interface CollectionPlannerData {
  version: 1;
  setGoals: SetCollectionGoal[];
  wishlist: CollectionWishlistEntry[];
  tradePile: TradePileEntry[];
}

export const COLLECTION_PLANNER_STORAGE_KEY = 'mtg_tracker_collection_planner_v1';
export const EMPTY_COLLECTION_PLANNER: CollectionPlannerData = {
  version: 1,
  setGoals: [],
  wishlist: [],
  tradePile: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isCollectionPlannerData(value: unknown): value is CollectionPlannerData {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.setGoals)
    || !Array.isArray(value.wishlist) || !Array.isArray(value.tradePile)) return false;
  return value.setGoals.every((goal) => isRecord(goal)
    && typeof goal.id === 'string' && goal.id.length > 0 && goal.id.length <= 160
    && typeof goal.setCode === 'string' && goal.setCode.length <= 32
    && typeof goal.setName === 'string' && goal.setName.length <= 160
    && Number.isSafeInteger(goal.targetPrintings) && Number(goal.targetPrintings) > 0 && Number(goal.targetPrintings) <= 100000
    && typeof goal.createdAt === 'number' && Number.isFinite(goal.createdAt))
    && value.wishlist.every((item) => isRecord(item)
      && typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 160
      && typeof item.name === 'string' && item.name.trim().length > 0 && item.name.length <= 300
      && ['setCode', 'collectorNumber', 'finish', 'note'].every((key) => item[key] === undefined || (typeof item[key] === 'string' && item[key].length <= 1000))
      && (item.maxPriceUsd === undefined || (typeof item.maxPriceUsd === 'number' && Number.isFinite(item.maxPriceUsd) && item.maxPriceUsd >= 0))
      && typeof item.createdAt === 'number' && Number.isFinite(item.createdAt))
    && value.tradePile.every((item) => isRecord(item)
      && typeof item.identity === 'string' && item.identity.length > 0 && item.identity.length <= 1500
      && Number.isSafeInteger(item.quantity) && Number(item.quantity) > 0);
}

export function loadCollectionPlanner(): CollectionPlannerData {
  if (typeof window === 'undefined') return { ...EMPTY_COLLECTION_PLANNER };
  try {
    const raw = window.localStorage.getItem(COLLECTION_PLANNER_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isCollectionPlannerData(parsed) ? parsed : { ...EMPTY_COLLECTION_PLANNER };
  } catch {
    return { ...EMPTY_COLLECTION_PLANNER };
  }
}

export function saveCollectionPlanner(data: CollectionPlannerData): void {
  if (typeof window === 'undefined') return;
  const valid = isCollectionPlannerData(data) ? data : { ...EMPTY_COLLECTION_PLANNER };
  window.localStorage.setItem(COLLECTION_PLANNER_STORAGE_KEY, JSON.stringify(valid));
  window.dispatchEvent(new Event('mtg-tracker-local-workspace-changed'));
}

export function createPlannerId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `planner-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function countSetPrintings(cards: OwnedCard[], setCode: string): number {
  const normalizedSet = setCode.trim().toLowerCase();
  if (!normalizedSet) return 0;
  return new Set(cards.filter((card) => card.setCode?.trim().toLowerCase() === normalizedSet).map(collectionIdentity)).size;
}

export function wishlistOwnership(item: CollectionWishlistEntry, cards: OwnedCard[]) {
  const sameName = cards.filter((card) => card.name.trim().toLowerCase() === item.name.trim().toLowerCase());
  const exact = sameName.find((card) => (!item.setCode || card.setCode?.toLowerCase() === item.setCode.toLowerCase())
    && (!item.collectorNumber || card.collectorNumber?.toLowerCase() === item.collectorNumber.toLowerCase())
    && (!item.finish || card.finish?.toLowerCase() === item.finish.toLowerCase()));
  return {
    owned: Boolean(exact),
    ambiguous: !exact && !item.setCode && !item.collectorNumber && sameName.length > 1,
    nameMatches: sameName.length,
  };
}

export function tradePileQuantity(identity: string, data: CollectionPlannerData): number {
  return data.tradePile.find((item) => item.identity === identity)?.quantity ?? 0;
}

export function setTradePileQuantity(data: CollectionPlannerData, card: OwnedCard, quantity: number): CollectionPlannerData {
  const identity = collectionIdentity(card);
  const cappedQuantity = Math.min(Math.max(0, card.quantity - 1), Math.max(0, Math.floor(quantity)));
  const remaining = data.tradePile.filter((entry) => entry.identity !== identity);
  if (cappedQuantity > 0) remaining.push({ identity, quantity: cappedQuantity });
  return { ...data, tradePile: remaining };
}
