import brawlBoxData from '@/data/brawlBox2026.json';
import referenceData from '@/data/brawlCardReference.json';
import madisonAraumi from '@/data/brawlStrategyMadisonAraumi.json';
import marchesaMothman from '@/data/brawlStrategyMarchesaMothman.json';
import rakdosKarlovTaigam from '@/data/brawlStrategyRakdosKarlovTaigam.json';

export type BrawlBoxCard = { name: string; quantity: number; colorIdentity: string[] | null; commanderLegal: boolean | null; verificationStatus?: string; note?: string; role?: string };
export type BrawlBoxGroup = { label: string; intro?: string; cards: BrawlBoxCard[] };
export type BrawlBoxDeck = {
  id: string;
  sourceDeckId?: string;
  rank: number;
  title: string;
  subtitle: string;
  commander: string;
  commanderColorIdentityLabel: string;
  commanderColorIdentity: string[];
  commanderCommanderLegal: boolean;
  commanderBrawlLegal: boolean;
  targetSize: number;
  sourceStatedTotal: number;
  visibleTotal: number;
  sourceStatedCuts: number;
  sourceCountNote: string;
  sourceIssues: string[];
  offColorCards: string[];
  groups: BrawlBoxGroup[];
  plan?: string;
  sideboardGroups?: BrawlBoxGroup[];
  sideboardNote?: string;
  deckType?: string;
  setupNotes?: string[];
  storageNotes?: string[];
  houseRuleExtras?: string[];
  formatNote?: string;
  publicationStatus?: 'work-in-progress';
  reviewStatus?: string;
  comparisonNotes?: string[];
  sourceLinks?: { label: string; url: string }[];
  upgradeOptions?: { title: string; cardsIn: string[]; cardsOut: string[]; rationale: string; tradeoff: string; sourceUrls?: string[] }[];
  proposalRationale?: string[];
};

type StrategyGroup = { label: string; intro: string; cards: { name: string; role: string }[] };
type Strategy = { plan: string; groups: StrategyGroup[]; sideboardGroups?: StrategyGroup[] | null };
const strategies = { ...madisonAraumi, ...marchesaMothman, ...rakdosKarlovTaigam } as Record<string, Strategy>;

// Presentation-only regrouping. Submitted quantities, notes, identity and status
// never come from editorial metadata or private inventory.
function strategyGroups(source: BrawlBoxGroup[], strategy: StrategyGroup[]): BrawlBoxGroup[] {
  const remaining = source.flatMap((group) => group.cards);
  const result = strategy.map((group) => ({
    label: group.label,
    intro: group.intro,
    cards: group.cards.map(({ name, role }) => {
      const index = remaining.findIndex((card) => card.name === name);
      if (index < 0) throw new Error(`Strategy card is not in submitted scope: ${name}`);
      return { ...remaining.splice(index, 1)[0], role };
    }),
  }));
  if (remaining.length) throw new Error(`Strategy omitted submitted cards: ${remaining.map((card) => card.name).join(', ')}`);
  return result;
}
export const brawlDecks: BrawlBoxDeck[] = (brawlBoxData.decks as BrawlBoxDeck[]).map((deck) => {
  const strategy = strategies[deck.id];
  if (!strategy) return deck;
  return {
    ...deck,
    plan: strategy.plan,
    groups: strategyGroups(deck.groups, strategy.groups),
    ...(deck.sideboardGroups && strategy.sideboardGroups ? { sideboardGroups: strategyGroups(deck.sideboardGroups, strategy.sideboardGroups) } : {}),
  };
});
export const brawlProposedDecks: BrawlBoxDeck[] = ((brawlBoxData.proposedDecks ?? []) as BrawlBoxDeck[]).map((deck) => {
  const strategy = strategies[deck.id];
  if (!strategy) return deck;
  return {
    ...deck,
    plan: strategy.plan,
    groups: strategyGroups(deck.groups, strategy.groups),
    ...(deck.sideboardGroups && strategy.sideboardGroups ? { sideboardGroups: strategyGroups(deck.sideboardGroups, strategy.sideboardGroups) } : {}),
  };
});
export const brawlDeckPath = (id: string) => `/brawl-box/${encodeURIComponent(id)}`;
export const findBrawlDeck = (id: string) => brawlDecks.find((deck) => deck.id === id);
export const cardSearch = (name: string) => `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)}`;
export type BrawlCardReference = {
  name: string; id: string; scryfallUrl: string; imageUrl: string | null; artUrl: string | null;
  set: string; setName: string; collectorNumber: string; artist: string | null;
  oracleText: string; typeLine: string; colorIdentity: string[];
};
export const brawlCardReferences = referenceData as Record<string, BrawlCardReference>;
export const cardReference = (name: string) => brawlCardReferences[name];
export const cardImage = (name: string) => cardReference(name)?.imageUrl ?? undefined;
export const cardRecord = (name: string) => cardReference(name)?.scryfallUrl ?? cardSearch(name);
export const cardImageFallback = (name: string) => {
  const record = cardReference(name);
  return record ? `https://api.scryfall.com/cards/${record.id}?format=image&version=normal` : undefined;
};
export const cardPrintingLabel = (name: string) => {
  const record = cardReference(name);
  return record ? `${record.set.toUpperCase()} #${record.collectorNumber} · ${record.setName}` : 'No verified printing';
};
