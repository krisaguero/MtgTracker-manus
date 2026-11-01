import type { RawCommanderDeck } from '@/data/commanderDecklistsData';
import type { OwnedCard } from '@/lib/manaboxParser';

export interface TransferTarget {
  deck: RawCommanderDeck;
  colorGroup: 'Simic' | 'Dimir' | 'Other';
}

export interface TransferAssignment {
  cardName: string;
  quantity: number;
  targetDeck: string;
  colorGroup: TransferTarget['colorGroup'];
}

export interface TransferOptimizationResult {
  assignments: TransferAssignment[];
  targetCoverage: Array<{ deckName: string; colorGroup: TransferTarget['colorGroup']; matchedCopies: number; totalCopies: number; coveragePercent: number; missingUniqueCards: number }>;
  totalMatchedCopies: number;
  totalTargetCopies: number;
  weightedCoveragePercent: number;
  unassignedCopies: number;
}

function requiredCopies(deck: RawCommanderDeck): Map<string, number> {
  const result = new Map<string, number>();
  for (const card of [...deck.commander, ...deck.cards]) {
    const key = card.name.trim().toLowerCase();
    result.set(key, (result.get(key) || 0) + Math.max(1, card.count || 1));
  }
  return result;
}

/**
 * Greedy, deterministic transfer allocation. Each available copy goes to the
 * target with the greatest normalized marginal coverage gain, with a small
 * balance tie-break so one color does not absorb every shared staple.
 *
 * This is intentionally name-based for planning; exact-printing validation
 * remains the responsibility of the ManaBox inventory layer before a physical
 * card is moved.
 */
export function optimizeTransferCoverage(targets: TransferTarget[], inventory: OwnedCard[]): TransferOptimizationResult {
  const requirements = targets.map((target) => ({ ...target, required: requiredCopies(target.deck) }));
  const allocated = requirements.map(() => new Map<string, number>());
  const available = new Map<string, number>();
  inventory.forEach((card) => {
    const key = card.name.trim().toLowerCase();
    available.set(key, (available.get(key) || 0) + Math.max(0, card.quantity));
  });

  const assignments: TransferAssignment[] = [];
  let unassignedCopies = 0;
  for (const [cardName, quantity] of Array.from(available.entries())) {
    const candidates = requirements
      .map((target, index) => {
        const required = target.required.get(cardName) || 0;
        const already = allocated[index].get(cardName) || 0;
        const remaining = Math.max(0, required - already);
        if (!remaining) return null;
        const total = Array.from(target.required.values()).reduce((sum, value) => sum + value, 0);
        const matched = Array.from(allocated[index].values()).reduce((sum, value) => sum + value, 0);
        const normalizedGain = total ? (1 / total) : 0;
        const balanceBonus = total ? (1 - matched / total) * 0.0001 : 0;
        return { index, remaining, score: normalizedGain + balanceBonus, matched };
      })
      .filter((candidate): candidate is { index: number; remaining: number; score: number; matched: number } => Boolean(candidate))
      .sort((a, b) => b.score - a.score || a.matched - b.matched || a.index - b.index);
    let remainingCopies = quantity;
    for (const candidate of candidates) {
      if (!remainingCopies) break;
      const moved = Math.min(remainingCopies, candidate.remaining);
      allocated[candidate.index].set(cardName, (allocated[candidate.index].get(cardName) || 0) + moved);
      assignments.push({ cardName, quantity: moved, targetDeck: requirements[candidate.index].deck.name, colorGroup: requirements[candidate.index].colorGroup });
      remainingCopies -= moved;
    }
    unassignedCopies += remainingCopies;
  }

  const targetCoverage = requirements.map((target, index) => {
    const totalCopies = Array.from(target.required.values()).reduce((sum, value) => sum + value, 0);
    const matchedCopies = Array.from(allocated[index].values()).reduce((sum, value) => sum + value, 0);
    const missingUniqueCards = Array.from(target.required.entries()).filter(([name, required]) => (allocated[index].get(name) || 0) < required).length;
    return { deckName: target.deck.name, colorGroup: target.colorGroup, matchedCopies, totalCopies, coveragePercent: totalCopies ? Math.round((matchedCopies / totalCopies) * 100) : 0, missingUniqueCards };
  });
  const totalMatchedCopies = targetCoverage.reduce((sum, row) => sum + row.matchedCopies, 0);
  const totalTargetCopies = targetCoverage.reduce((sum, row) => sum + row.totalCopies, 0);
  return { assignments, targetCoverage, totalMatchedCopies, totalTargetCopies, weightedCoveragePercent: totalTargetCopies ? Math.round((totalMatchedCopies / totalTargetCopies) * 100) : 0, unassignedCopies };
}
