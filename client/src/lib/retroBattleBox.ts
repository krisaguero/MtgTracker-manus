import retroBattleBox2026 from '@/data/retroBattleBox2026.json';
import { mergeOwnedCollection, type OwnedCard } from '@/lib/manaboxParser';

export type RetroBattleBoxDeck = (typeof retroBattleBox2026)[number];
export const retroBattleBoxDecks = retroBattleBox2026;
export const COMMUNITY_DRAFTS_STORAGE_KEY = 'mtg_tracker_battle_box_drafts_v1';
export const REPORTED_PROXY_NAMES = 35;
export const REPORTED_PROXY_COPIES = 40;

export function mergeBattleBoxInventorySnapshots(snapshots: OwnedCard[][], mode: 'deduplicate' | 'add' = 'deduplicate'): OwnedCard[] {
  if (mode === 'add') return snapshots.flatMap((snapshot) => snapshot);
  return snapshots.reduce<OwnedCard[]>((merged, snapshot) => mergeOwnedCollection(merged, snapshot).cards, []);
}

export function getRetroBattleBoxStats(decks: RetroBattleBoxDeck[] = retroBattleBoxDecks) {
  const deckTotals = decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    total: deck.groups.reduce((sum, group) => sum + group.cards.reduce((subtotal, card) => subtotal + card.quantity, 0), 0),
    groups: deck.groups.map((group) => ({
      label: group.label,
      expected: group.expected,
      actual: group.cards.reduce((subtotal, card) => subtotal + card.quantity, 0),
    })),
  }));
  const proxyCards = new Map<string, number>();
  const copyLimitWarnings: Array<{ deck: string; card: string; copies: number }> = [];
  const basicLands = new Set(['plains', 'island', 'swamp', 'mountain', 'forest', 'wastes']);

  decks.forEach((deck) => {
    const deckCopies = new Map<string, number>();
    deck.groups.forEach((group) => group.cards.forEach((card) => {
      const key = card.name.trim().toLocaleLowerCase();
      deckCopies.set(key, (deckCopies.get(key) || 0) + card.quantity);
      if (card.proxy) proxyCards.set(card.name, (proxyCards.get(card.name) || 0) + card.quantity);
    }));
    deckCopies.forEach((copies, key) => {
      if (!basicLands.has(key) && copies > 4) {
        const card = deck.groups.flatMap((group) => group.cards).find((entry) => entry.name.trim().toLocaleLowerCase() === key);
        copyLimitWarnings.push({ deck: deck.name, card: card?.name || key, copies });
      }
    });
  });

  const totalCards = deckTotals.reduce((sum, deck) => sum + deck.total, 0);
  const actualProxyCopies = Array.from(proxyCards.values()).reduce((sum, quantity) => sum + quantity, 0);
  return {
    deckTotals,
    totalDecks: decks.length,
    totalCards,
    allDecksAreSixty: deckTotals.every((deck) => deck.total === 60 && deck.groups.every((group) => group.actual === group.expected)),
    proxyDistinctNames: proxyCards.size,
    proxyCopies: actualProxyCopies,
    reportedProxyNames: REPORTED_PROXY_NAMES,
    reportedProxyCopies: REPORTED_PROXY_COPIES,
    proxyCountDisagrees: proxyCards.size !== REPORTED_PROXY_NAMES || actualProxyCopies !== REPORTED_PROXY_COPIES,
    copyLimitWarnings,
  };
}

export type BattleBoxPullItem = {
  name: string;
  quantity: number;
  owned: number;
  proxyOwned: number;
  shortage: number;
  proxyPrintGap: number;
  proxyMarked: number;
  matchedPrintings: Array<{ label: string; quantity: number; proxy: boolean }>;
  usedBy: string[];
};

export function createBattleBoxPullList(
  decks: RetroBattleBoxDeck[] = retroBattleBoxDecks,
  collection: OwnedCard[] = [],
): BattleBoxPullItem[] {
  const requirements = new Map<string, BattleBoxPullItem>();
  const ownedCounts = new Map<string, number>();
  const proxyOwnedCounts = new Map<string, number>();
  const matchedPrintings = new Map<string, Map<string, { label: string; quantity: number; proxy: boolean }>>();
  collection.forEach((card) => {
    const key = card.name.trim().toLocaleLowerCase();
    const counts = card.proxy ? proxyOwnedCounts : ownedCounts;
    counts.set(key, (counts.get(key) || 0) + Math.max(0, Number(card.quantity) || 0));
    const printingKey = [card.setCode || '', card.collectorNumber || '', card.finish || 'normal', card.language || 'en', card.proxy ? 'proxy' : 'owned'].join('::').toLocaleLowerCase();
    const printingMap = matchedPrintings.get(key) || new Map<string, { label: string; quantity: number; proxy: boolean }>();
    const setAndNumber = card.setCode
      ? `${card.setCode.toUpperCase()}${card.collectorNumber ? ` #${card.collectorNumber}` : ''}`
      : card.collectorNumber ? `#${card.collectorNumber}` : 'printing not specified';
    const finish = card.finish && !['normal', 'nonfoil', 'false'].includes(card.finish.toLocaleLowerCase()) ? ` · ${card.finish}` : '';
    const language = card.language && card.language.toLocaleLowerCase() !== 'en' ? ` · ${card.language.toUpperCase()}` : '';
    const existingPrinting = printingMap.get(printingKey);
    printingMap.set(printingKey, {
      label: `${setAndNumber}${finish}${language}`,
      quantity: (existingPrinting?.quantity || 0) + Math.max(0, Number(card.quantity) || 0),
      proxy: !!card.proxy,
    });
    matchedPrintings.set(key, printingMap);
  });

  decks.forEach((deck) => deck.groups.forEach((group) => group.cards.forEach((card) => {
    const key = card.name.trim().toLocaleLowerCase();
    const current = requirements.get(key) || { name: card.name, quantity: 0, owned: 0, proxyOwned: 0, shortage: 0, proxyPrintGap: 0, proxyMarked: 0, matchedPrintings: [], usedBy: [] };
    current.quantity += card.quantity;
    if (card.proxy) current.proxyMarked += card.quantity;
    if (!current.usedBy.includes(deck.name)) current.usedBy.push(deck.name);
    requirements.set(key, current);
  })));

  return Array.from(requirements.values()).map((item) => {
    const owned = ownedCounts.get(item.name.trim().toLocaleLowerCase()) || 0;
    const proxyOwned = proxyOwnedCounts.get(item.name.trim().toLocaleLowerCase()) || 0;
    return {
      ...item,
      owned,
      proxyOwned,
      shortage: Math.max(0, item.quantity - owned),
      proxyPrintGap: Math.max(0, item.quantity - owned - proxyOwned),
      matchedPrintings: Array.from(matchedPrintings.get(item.name.trim().toLocaleLowerCase())?.values() || []),
    };
  }).sort((a, b) => {
    const aQueued = a.shortage > 0 || a.proxyMarked > 0;
    const bQueued = b.shortage > 0 || b.proxyMarked > 0;
    return Number(bQueued) - Number(aQueued) || a.name.localeCompare(b.name);
  });
}

export function battleBoxPullListCsv(items: BattleBoxPullItem[], hasInventory = true, includeProxyDetails = true) {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = includeProxyDetails
    ? items.filter((item) => item.proxyMarked > 0 || (hasInventory && item.shortage > 0)).map((item) => [
        quote(item.name), item.quantity, hasInventory ? item.owned : '', hasInventory ? item.proxyOwned : '', hasInventory ? item.shortage : '', hasInventory ? item.proxyPrintGap : '', item.proxyMarked, quote(hasInventory ? item.matchedPrintings.map((printing) => `${printing.label} ×${printing.quantity}${printing.proxy ? ' (proxy)' : ''}`).join('; ') : ''), quote(item.usedBy.join('; ')),
      ].join(','))
    : items.filter((item) => hasInventory && item.shortage > 0).map((item) => [
        quote(item.name), item.quantity, item.owned, item.shortage, quote(item.matchedPrintings.filter((printing) => !printing.proxy).map((printing) => `${printing.label} ×${printing.quantity}`).join('; ')), quote(item.usedBy.join('; ')),
      ].join(','));
  return [
    includeProxyDetails
      ? 'Card,Required across box,Real copies owned,Proxy copies held,Order gap to real,Proxy print gap,Source proxy-marked copies,Matched local printings,Decks'
      : 'Card,Required across box,Real copies owned,Order gap,Matched local printings,Decks',
    ...rows,
  ].join('\n');
}

export function deckListText(deck: RetroBattleBoxDeck) {
  return [
    `// ${deck.name} — ${deck.subtitle} — 60 cards`,
    ...deck.groups.flatMap((group) => [
      `\n// ${group.label} (${group.expected})`,
      ...group.cards.map((card) => `${card.quantity} ${card.name}${card.proxy ? ' [PROXY]' : ''}`),
    ]),
  ].join('\n').trim();
}

export type ParsedDeckLine = { quantity: number; name: string };
export type ParsedBattleBoxList = { cards: ParsedDeckLine[]; total: number; invalidLines: string[]; isSixtyCards: boolean };

export function parseBattleBoxDeckList(text: string): ParsedBattleBoxList {
  const cards: ParsedDeckLine[] = [];
  const invalidLines: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const cleaned = line.trim();
    if (!cleaned || cleaned.startsWith('#') || cleaned.startsWith('//')) continue;
    const match = cleaned.match(/^(\d+)\s*x?\s+(.+)$/i);
    if (!match || Number(match[1]) < 1) {
      invalidLines.push(cleaned);
      continue;
    }
    cards.push({ quantity: Number(match[1]), name: match[2]!.trim() });
  }
  const total = cards.reduce((sum, card) => sum + card.quantity, 0);
  return { cards, total, invalidLines, isSixtyCards: total === 60 && invalidLines.length === 0 };
}

export type LocalBattleBoxDraft = {
  id: string;
  title: string;
  description: string;
  authorName: string;
  sourceCredit: string;
  createdAt: string;
  decks: Array<{ name: string; list: string }>;
};

export function loadLocalBattleBoxDrafts(): LocalBattleBoxDraft[] {
  try {
    if (typeof window === 'undefined') return [];
    const value: unknown = JSON.parse(window.localStorage.getItem(COMMUNITY_DRAFTS_STORAGE_KEY) || '[]');
    return Array.isArray(value)
      ? value
          .filter((draft) => draft && typeof draft.title === 'string' && Array.isArray(draft.decks))
          .map((draft) => ({
            ...draft,
            authorName: typeof draft.authorName === 'string' ? draft.authorName : '',
            sourceCredit: typeof draft.sourceCredit === 'string' ? draft.sourceCredit : '',
          }))
      : [];
  } catch {
    return [];
  }
}

export function saveLocalBattleBoxDrafts(drafts: LocalBattleBoxDraft[]) {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(COMMUNITY_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    return true;
  } catch {
    return false;
  }
}
