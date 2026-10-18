import brawlBoxData from '@/data/brawlBox2026.json';

export type BrawlBoxCard = { name: string; quantity: number; colorIdentity: string[]; commanderLegal: boolean; note?: string };
export type BrawlBoxGroup = { label: string; cards: BrawlBoxCard[] };
export type BrawlBoxDeck = {
  id: string;
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
  sideboardGroups?: BrawlBoxGroup[];
  sideboardNote?: string;
  deckType?: string;
  setupNotes?: string[];
  storageNotes?: string[];
  houseRuleExtras?: string[];
  formatNote?: string;
};

export const brawlDecks = brawlBoxData.decks as BrawlBoxDeck[];
export const brawlDeckPath = (id: string) => `/brawl-box/${encodeURIComponent(id)}`;
export const findBrawlDeck = (id: string) => brawlDecks.find((deck) => deck.id === id);
export const cardSearch = (name: string) => `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)}`;
export const cardImage = (name: string) => `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
