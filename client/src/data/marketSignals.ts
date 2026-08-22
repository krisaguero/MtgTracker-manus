// Design philosophy: hard-edged financial intelligence module providing transparent separation between observed price momentum and external speculation commentary.

export interface MarketSignalItem {
  cardName: string;
  setCode: string;
  setName: string;
  trendType: 'observed-spike' | 'speculation-watch' | 'format-demand';
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  asOf: string;
}

export const marketSignalsData: MarketSignalItem[] = [
  {
    cardName: 'World Shaper',
    setCode: 'eoc',
    setName: 'Edge of Eternities',
    trendType: 'observed-spike',
    summary: 'Observed 30-day market price increase of +24% across completed Scryfall refreshes and TCGplayer market data.',
    sourceLabel: 'Scryfall & TCGplayer Market Snapshot',
    sourceUrl: 'https://seller.tcgplayer.com/blog/price-trends-magic-the-gathering-cards-climbing-in-price-03-24-2026',
    asOf: 'August 2026',
  },
  {
    cardName: 'Counter Intelligence Staples',
    setCode: 'eoc',
    setName: 'Edge of Eternities',
    trendType: 'format-demand',
    summary: 'Strong artifact and counter synergy demand in Commander format driving steady single liquidity.',
    sourceLabel: 'EDHREC Format Demand Analysis',
    sourceUrl: 'https://edhrec.com/',
    asOf: 'August 2026',
  },
  {
    cardName: 'Reserved List & Format Staples',
    setCode: 'mh3',
    setName: 'Modern Horizons 3',
    trendType: 'speculation-watch',
    summary: 'Speculative community discussion surrounding eternal format shifts and reprint timing. Not a guaranteed buy recommendation.',
    sourceLabel: 'MTGStocks Speculation Watch',
    sourceUrl: 'https://www.mtgstocks.com/',
    asOf: 'August 2026',
  },
];

export function signalsForSet(setCode: string): MarketSignalItem[] {
  return marketSignalsData.filter((item) => item.setCode.toLowerCase() === setCode.toLowerCase());
}
