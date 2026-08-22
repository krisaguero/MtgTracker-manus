import { moversForCard, type LinkedMarketMover } from '@/lib/marketMoverLinks';
import { resolveCardPrice } from '@/lib/marketPriceIndex';

export interface PreconMarketHighlight {
  cardName: string;
  historicalRank: number;
  weeklyVolatilityPercent: number;
  movementNote: string;
  currentUsd: number;
  source: string;
  articleHref: string;
  cardHref: string;
}

export interface PreconMarketContextSummary {
  totalHighlightedCards: number;
  highlights: PreconMarketHighlight[];
  summaryBanner: string;
  indexedCards: number;
  pricedCards: number;
}

function toHighlight(mover: LinkedMarketMover, rank: number, currentUsd: number): PreconMarketHighlight {
  return {
    cardName: mover.name,
    historicalRank: rank,
    weeklyVolatilityPercent: Math.abs(mover.percentChange),
    movementNote: mover.reason,
    currentUsd,
    source: mover.source,
    articleHref: mover.articleHref,
    cardHref: mover.cardHref,
  };
}

export function getPreconMarketContext(deckCards: Array<{ name: string; set_code?: string; usd?: string | number }>): PreconMarketContextSummary {
  const highlights: PreconMarketHighlight[] = [];
  let pricedCards = 0;
  const seen = new Set<string>();

  for (const card of deckCards) {
    const price = resolveCardPrice(card.name, card.set_code);
    if (price) pricedCards += 1;
    const movers = moversForCard(card.name, card.set_code);
    const mover = movers.find((item) => item.percentChange > 0) || movers[0];
    if (!mover || seen.has(card.name.toLowerCase())) continue;
    seen.add(card.name.toLowerCase());
    const rank = highlights.length + 1;
    highlights.push(toHighlight(mover, rank, price?.usd ?? (Number(card.usd) || 0)));
  }

  highlights.sort((a, b) => Math.abs(b.weeklyVolatilityPercent) - Math.abs(a.weeklyVolatilityPercent));
  const rankedHighlights = highlights.map((highlight, index) => ({ ...highlight, historicalRank: index + 1 }));
  const totalHighlightedCards = rankedHighlights.length;
  const indexedCards = deckCards.filter((card) => Boolean(resolveCardPrice(card.name, card.set_code))).length;
  const summaryBanner = totalHighlightedCards > 0
    ? `Market Context: ${totalHighlightedCards} card${totalHighlightedCards === 1 ? '' : 's'} in this deck match the current canonical mover snapshot. Prices and reasons are source-linked below.`
    : `Market Context: No current canonical mover rows match this deck. Indexed price coverage is ${indexedCards}/${deckCards.length} card entries.`;

  return { totalHighlightedCards, highlights: rankedHighlights, summaryBanner, indexedCards, pricedCards };
}
