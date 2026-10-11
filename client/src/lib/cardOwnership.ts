// Design philosophy: pure, UI-agnostic ownership status so decklist rows can highlight owned, partial, and missing cards consistently.
import type { OwnedCard } from '@/lib/manaboxParser';

export type OwnershipStatus = 'owned' | 'partial' | 'missing' | 'unknown';

export interface CardOwnership {
  status: OwnershipStatus;
  ownedQty: number;
  neededQty: number;
  /** Copies still needed to complete this entry (0 when owned or unknown). */
  shortfall: number;
}

/** Builds a case-insensitive name -> total owned quantity map (sums duplicate printings). */
export function buildOwnedMap(collection: OwnedCard[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const card of collection) {
    const key = card.name.trim().toLowerCase();
    if (!key) continue;
    const qty = Number.isFinite(card.quantity) ? Math.max(0, card.quantity) : 0;
    map.set(key, (map.get(key) ?? 0) + qty);
  }
  return map;
}

/**
 * Resolves ownership for one decklist entry.
 * With no imported collection the status is 'unknown' so the UI does not flag every card as missing.
 */
export function resolveOwnership(
  cardName: string,
  neededQty: number,
  ownedMap: Map<string, number>,
): CardOwnership {
  const needed = Math.max(1, neededQty);
  if (ownedMap.size === 0) {
    return { status: 'unknown', ownedQty: 0, neededQty: needed, shortfall: 0 };
  }
  const ownedQty = ownedMap.get(cardName.trim().toLowerCase()) ?? 0;
  if (ownedQty >= needed) return { status: 'owned', ownedQty, neededQty: needed, shortfall: 0 };
  if (ownedQty > 0) return { status: 'partial', ownedQty, neededQty: needed, shortfall: needed - ownedQty };
  return { status: 'missing', ownedQty: 0, neededQty: needed, shortfall: needed };
}
