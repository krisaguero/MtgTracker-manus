import type { RawCommanderDeck } from '@/data/commanderDecklistsData';
import type { OwnedCard } from '@/lib/manaboxParser';
import type { OwnedPreconEntry } from '@/lib/preconInventory';
import { detectInventoryDeckCompletions } from '@/lib/inventoryDeckCompletion';

export type PreconOwnershipState = 'sealed' | 'opened' | 'partially_reconciled' | 'reconciled';

export interface PreconOwnershipNode {
  deckSlug: string;
  deckName: string;
  setCode: string;
  quantity: number;
  costBasisUsd?: number;
  expectedCopies: number | null;
  scannedMatchedCopies: number;
  coveragePercent: number | null;
  state: PreconOwnershipState;
}

export interface PreconOwnershipGraphSummary {
  sealedUnits: number;
  productNodes: number;
  reconciledNodes: number;
  partialNodes: number;
  totalCostBasisUsd: number;
}

function expectedCopies(deck: RawCommanderDeck): number {
  return [...deck.commander, ...deck.cards].reduce((sum, card) => sum + Math.max(1, card.count || 1), 0);
}

/** Builds a read-only relationship between sealed product records and scan coverage. */
export function buildPreconOwnershipGraph(
  ownedPrecons: OwnedPreconEntry[],
  decks: RawCommanderDeck[],
  inventory: OwnedCard[],
  slugify: (value: string) => string,
): PreconOwnershipNode[] {
  const completion = detectInventoryDeckCompletions(decks, inventory, slugify);
  return ownedPrecons.map((entry) => {
    const deck = decks.find((candidate) => slugify(candidate.name).toLowerCase() === entry.deckSlug.toLowerCase());
    const status = completion.get(entry.deckSlug.toLowerCase());
    const coveragePercent = status?.coveragePercent ?? null;
    const state: PreconOwnershipState = !deck
      ? 'sealed'
      : status?.complete
        ? 'reconciled'
        : coveragePercent && coveragePercent > 0
          ? 'partially_reconciled'
          : 'sealed';
    return {
      deckSlug: entry.deckSlug,
      deckName: deck?.name || entry.deckSlug,
      setCode: entry.setCode,
      quantity: entry.quantity || 1,
      costBasisUsd: entry.costBasisUsd,
      expectedCopies: deck ? expectedCopies(deck) : null,
      scannedMatchedCopies: status?.matchedCopies || 0,
      coveragePercent,
      state,
    };
  });
}

export function summarizePreconOwnershipGraph(nodes: PreconOwnershipNode[]): PreconOwnershipGraphSummary {
  return {
    sealedUnits: nodes.reduce((sum, node) => sum + node.quantity, 0),
    productNodes: nodes.length,
    reconciledNodes: nodes.filter((node) => node.state === 'reconciled').length,
    partialNodes: nodes.filter((node) => node.state === 'partially_reconciled').length,
    totalCostBasisUsd: nodes.reduce((sum, node) => sum + (node.costBasisUsd || 0) * node.quantity, 0),
  };
}
