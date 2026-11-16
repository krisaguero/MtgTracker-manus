import { getPrivateDeckStatusLabel, readPrivateDeckTheme } from '@/lib/privateBreweryIdeas';
import type { DeckboxSourceRecord } from '@/lib/privateDeckBrewery';

export interface PrivateDeckReview {
  commander: string | null;
  colorIdentity: string | null;
  sourceStatus: string;
  mainCopies: number;
  sideboardCopies: number;
  landCopies: number | null;
  themeLabel: string;
  themeFrame: string;
  themeEvidence: string;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function commanderFromSource(deck: DeckboxSourceRecord): string | null {
  const direct = firstText(deck.commander, deck.commanderName, deck.leader);
  if (direct) return direct;
  if (!Array.isArray(deck.commanders)) return null;
  for (const candidate of deck.commanders) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (candidate && typeof candidate === 'object' && 'name' in candidate) {
      const name = firstText((candidate as { name?: unknown }).name);
      if (name) return name;
    }
  }
  return null;
}

function identityFromSource(deck: DeckboxSourceRecord): string | null {
  const value = deck.colorIdentity ?? deck.commanderColorIdentity;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const colors = value.filter((color): color is string => typeof color === 'string' && Boolean(color.trim()));
    if (colors.length) return colors.join('');
  }
  return null;
}

function countCopies(rows: DeckboxSourceRecord['main']): number {
  return rows.reduce((sum, card) => sum + card.quantity, 0);
}

export function buildPrivateDeckReview(deck: DeckboxSourceRecord): PrivateDeckReview {
  const theme = readPrivateDeckTheme(deck);
  return {
    commander: commanderFromSource(deck),
    colorIdentity: identityFromSource(deck),
    sourceStatus: getPrivateDeckStatusLabel(deck),
    mainCopies: countCopies(deck.main),
    sideboardCopies: countCopies(deck.sideboard),
    landCopies: typeof deck.mainLandCopies === 'number' ? deck.mainLandCopies : null,
    themeLabel: theme.label,
    themeFrame: theme.frame,
    themeEvidence: theme.evidence,
  };
}
