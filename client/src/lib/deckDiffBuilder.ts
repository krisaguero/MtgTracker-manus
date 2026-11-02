import type { RawCommanderDeck, RawDeckCard } from '@/data/commanderDecklistsData';

export interface DeckDiffEntry {
  name: string;
  count: number;
  reason?: string;
}

export interface DeckValidation {
  totalCards: number;
  commanderCards: number;
  mainboardCards: number;
  legalSize: boolean;
  commanderCountValid: boolean;
  duplicateViolations: string[];
  warnings: string[];
}

export interface DeckDiffResult {
  additions: DeckDiffEntry[];
  cuts: DeckDiffEntry[];
  finalMainboard: DeckDiffEntry[];
  finalCommander: DeckDiffEntry[];
  validation: DeckValidation;
  balanced: boolean;
}

function aggregate(cards: Array<{ name: string; count?: number }>): DeckDiffEntry[] {
  const map = new Map<string, DeckDiffEntry>();
  for (const card of cards) {
    const name = card.name.trim();
    const key = name.toLowerCase();
    const existing = map.get(key);
    map.set(key, { name: existing?.name || name, count: (existing?.count || 0) + Math.max(1, card.count || 1) });
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function applyDelta(base: DeckDiffEntry[], entries: DeckDiffEntry[], direction: 1 | -1): DeckDiffEntry[] {
  const map = new Map(base.map(entry => [entry.name.toLowerCase(), { ...entry }]));
  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    const existing = map.get(key);
    const next = (existing?.count || 0) + direction * entry.count;
    if (next > 0) map.set(key, { name: existing?.name || entry.name, count: next, reason: entry.reason });
    else map.delete(key);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function validateCommanderDeck(commander: DeckDiffEntry[], mainboard: DeckDiffEntry[]): DeckValidation {
  const commanderCards = commander.reduce((sum, card) => sum + card.count, 0);
  const mainboardCards = mainboard.reduce((sum, card) => sum + card.count, 0);
  const totalCards = commanderCards + mainboardCards;
  const duplicateViolations = mainboard.filter(card => card.count > 1 && !['basic land — plains', 'basic land — island', 'basic land — swamp', 'basic land — mountain', 'basic land — forest', 'plains', 'island', 'swamp', 'mountain', 'forest', 'wastes'].includes(card.name.toLowerCase())).map(card => `${card.name} (${card.count})`);
  const warnings: string[] = [];
  if (commanderCards !== 1) warnings.push(`Expected 1 commander card; diff contains ${commanderCards}.`);
  if (mainboardCards !== 99) warnings.push(`Expected 99 mainboard cards; diff contains ${mainboardCards}.`);
  if (duplicateViolations.length) warnings.push(`Singleton review required: ${duplicateViolations.join(', ')}.`);
  return { totalCards, commanderCards, mainboardCards, legalSize: totalCards === 100, commanderCountValid: commanderCards === 1, duplicateViolations, warnings };
}

export function buildDeckDiff(deck: RawCommanderDeck, additions: DeckDiffEntry[], cuts: DeckDiffEntry[]): DeckDiffResult {
  const finalCommander = aggregate(deck.commander);
  const baseMainboard = aggregate(deck.cards);
  const finalMainboard = applyDelta(applyDelta(baseMainboard, cuts, -1), additions, 1);
  const validation = validateCommanderDeck(finalCommander, finalMainboard);
  const additionCount = additions.reduce((sum, entry) => sum + entry.count, 0);
  const cutCount = cuts.reduce((sum, entry) => sum + entry.count, 0);
  return { additions, cuts, finalMainboard, finalCommander, validation, balanced: additionCount === cutCount };
}

export function deckCardsForExport(result: DeckDiffResult): string {
  return [...result.finalCommander, ...result.finalMainboard].flatMap(card => Array.from({ length: card.count }, () => card.name)).join('\n');
}

export function defaultWallCutCandidates(deck: RawCommanderDeck): DeckDiffEntry[] {
  const names = new Set(deck.cards.map(card => card.name.toLowerCase()));
  const preferred = ['Mind\'s Dilation', 'Into the Time Vortex', 'Genesis Ultimatum', 'Annie Joins Up', 'Path of Discovery', 'Nova Flame', 'The Fantasticar'];
  return preferred.filter(name => names.has(name.toLowerCase())).map(name => ({ name, count: 1, reason: 'Suggested cut for a focused Invisible Woman Wall conversion; review before applying.' }));
}
