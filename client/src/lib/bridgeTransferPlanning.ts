import type { RawCommanderDeck } from '@/data/commanderDecklistsData';
import type { OwnedCard } from '@/lib/manaboxParser';

export const invisibleWomanWallPackage = [
  { name: 'Assault Formation', role: 'Toughness-to-power engine', package: 'A' },
  { name: 'Wall of Omens', role: 'Cantrip Wall', package: 'A' },
  { name: 'Wall of Blossoms', role: 'Cantrip Wall', package: 'A' },
  { name: 'Axebane Guardian', role: 'Defender mana', package: 'A' },
  { name: 'Tower Defense', role: 'Lethal combat turn', package: 'A' },
  { name: 'Wall of Roots', role: 'Early defense and mana', package: 'B' },
  { name: 'Overgrown Battlement', role: 'Defender mana', package: 'B' },
  { name: 'Wall of Reverence', role: 'Life buffer', package: 'B' },
  { name: 'Weathered Sentinels', role: 'Scaling defender', package: 'B' },
  { name: 'Crashing Drawbridge', role: 'Finishing attack', package: 'C' },
  { name: 'Towering Titan', role: 'High-toughness threat', package: 'C' },
  { name: 'Wall of Limbs', role: 'Late-game Wall payoff', package: 'C' },
] as const;

export type BridgePackage = typeof invisibleWomanWallPackage[number]['package'];
export type BridgeTransferStatus = 'transferable' | 'conditional' | 'buy' | 'unresolved';

export interface BridgeTransferRow {
  name: string;
  role: string;
  package: BridgePackage;
  totalOwned: number;
  reservedForSource: number;
  transferable: number;
  status: BridgeTransferStatus;
}

function cardNames(deck: RawCommanderDeck): Map<string, number> {
  const result = new Map<string, number>();
  for (const card of [...deck.commander, ...deck.cards]) {
    const key = card.name.trim().toLowerCase();
    result.set(key, (result.get(key) || 0) + Math.max(1, card.count || 1));
  }
  return result;
}

export function planBridgeTransfers(
  inventory: OwnedCard[],
  sourceDeck: RawCommanderDeck | undefined,
  packageCards = invisibleWomanWallPackage,
): BridgeTransferRow[] {
  const owned = new Map<string, number>();
  for (const card of inventory) {
    const key = card.name.trim().toLowerCase();
    owned.set(key, (owned.get(key) || 0) + Math.max(0, card.quantity || 0));
  }
  const source = sourceDeck ? cardNames(sourceDeck) : new Map<string, number>();
  return packageCards.map((card) => {
    const key = card.name.toLowerCase();
    const totalOwned = owned.get(key) || 0;
    const reservedForSource = Math.min(totalOwned, source.get(key) || 0);
    const transferable = Math.max(0, totalOwned - reservedForSource);
    return {
      ...card,
      totalOwned,
      reservedForSource,
      transferable,
      status: transferable > 0 ? 'transferable' : totalOwned > 0 ? 'conditional' : 'buy',
    };
  });
}

export function bridgePackageSummary(rows: BridgeTransferRow[], packageId: BridgePackage) {
  const selected = rows.filter((row) => row.package === packageId);
  return {
    total: selected.length,
    transferable: selected.filter((row) => row.status === 'transferable').length,
    conditional: selected.filter((row) => row.status === 'conditional').length,
    buy: selected.filter((row) => row.status === 'buy').length,
    complete: selected.length > 0 && selected.every((row) => row.status === 'transferable'),
  };
}
