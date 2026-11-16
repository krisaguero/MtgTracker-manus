import data from '@/data/deckBreweryShowdowns.json';
import type { BreweryReviewEntry, BreweryReviewPayload } from '@/lib/deckBreweryReviews';

export type ShowdownCard = {
  name: string;
  role: string;
  where: string;
};

export type ShowdownSource = {
  title: string;
  url: string;
  supports: string;
};

export type DeckBreweryMatchup = {
  slug: string;
  headline: string;
  leftReviewSlug: string;
  rightReviewSlug: string;
  leftCards: ShowdownCard[];
  rightCards: ShowdownCard[];
  narrativeAngle: string;
  loreSources: ShowdownSource[];
  sourceCaveat: string;
};

export type DeckBreweryComboSpotlight = {
  slug: string;
  sourceReviewSlug: string;
  comboName: string;
  typeLabel: string;
  cards: ShowdownCard[];
  sequence: string;
  caveat: string;
  sources: ShowdownSource[];
};

export type DeckBreweryShowdownData = {
  schemaVersion: number;
  matchups: DeckBreweryMatchup[];
  comboSpotlights: DeckBreweryComboSpotlight[];
};

export const deckBreweryShowdowns = data as DeckBreweryShowdownData;

export function findBreweryReview(payload: BreweryReviewPayload, slug: string): BreweryReviewEntry | undefined {
  return payload.entries.find((entry) => entry.slug === slug);
}

export function breweryShowdownPath(slug: string): string {
  return `/deck-brewery/matchups/${encodeURIComponent(slug)}`;
}

export function breweryReviewPath(slug: string): string {
  return `/deck-brewery/reviews/${encodeURIComponent(slug)}`;
}
