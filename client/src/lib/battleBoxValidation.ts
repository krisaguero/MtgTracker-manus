import decks from '@/data/battleBoxDecks.json';

export type BattleBoxCard = { name: string; quantity: number };
export type BattleBoxGroup = { label: string; expected: number; cards: BattleBoxCard[] };
export type BattleBoxDeck = (typeof decks)[number];

export function deckCardTotal(deck: BattleBoxDeck) {
  return deck.groups.reduce((total, group) => total + group.cards.reduce((sum, card) => sum + card.quantity, 0), 0);
}

export function deckListLines(deck: BattleBoxDeck) {
  return deck.groups.flatMap((group) => group.cards.map((card) => `${card.quantity} ${card.name}`));
}

export function combinedPullList(decksToUse: BattleBoxDeck[]) {
  const quantities = new Map<string, number>();
  for (const deck of decksToUse) for (const line of deck.groups.flatMap((group) => group.cards)) quantities.set(line.name, (quantities.get(line.name) || 0) + line.quantity);
  return Array.from(quantities.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([name, quantity]) => ({ name, quantity }));
}

export function validateBattleBox() {
  const deckTotals = decks.map((deck) => ({ name: deck.name, total: deckCardTotal(deck), groupTotals: deck.groups.map((group) => ({ label: group.label, expected: group.expected, actual: group.cards.reduce((sum, card) => sum + card.quantity, 0) })) }));
  const totalCards = deckTotals.reduce((sum, deck) => sum + deck.total, 0);
  const basicNames = new Set(['Forest', 'Plains', 'Island', 'Swamp', 'Mountain']);
  const basicLands = decks.reduce((sum, deck) => sum + deck.groups.flatMap((group) => group.cards).filter((card) => basicNames.has(card.name)).reduce((subtotal, card) => subtotal + card.quantity, 0), 0);
  return { deckTotals, totalCards, basicLands, expectedTotalCards: 240, expectedBasicLands: 95, allDecksAre60: deckTotals.every((deck) => deck.total === 60) };
}

export const battleBoxDecks = decks;
