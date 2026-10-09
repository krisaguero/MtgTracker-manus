export type MarketBriefSignalKind = 'confirmed-bullish' | 'confirmed-bearish' | 'developing';

export interface TodayMarketSignal {
  name: string;
  setCode: string;
  setName: string;
  priceLabel: string;
  changePercent: number;
  thesis: string;
  liquidityNote?: string;
  kind: MarketBriefSignalKind;
}

export const todayMarketBrief = {
  dateKey: '2026-10-07',
  publishedLabel: 'October 7, 2026',
  title: 'Spoilers, supply pressure, and a fragile rotation into Commander staples',
  status: 'Signal-first brief: confirmed daily movers are constructive, but low-liquidity and reprint risk make this a selective market rather than a broad repricing day.',
  marketRead: 'The tape is being pulled by spoiler and precon attention, collector treatments, and old-print scarcity. The strongest moves are real tracker signals, but several are thinly traded variants where percentage change can outrun underlying depth.',
  policyWatch: 'The next Banned & Restricted announcement is scheduled for October 12, 2026. Keep ban-watch names separate from confirmed price evidence.',
  supplyWatch: 'Festival in a Box: Atlanta 2026 and Mystery Booster Commander Edition keep reprint and supply expectations in the foreground.',
  confirmedBullish: [
    { name: 'Sonic Screwdriver', setCode: 'who', setName: 'Universes Beyond: Doctor Who', priceLabel: '$2.63 vs $1.03', changePercent: 155.3, thesis: 'Commander, casual, and collector demand.', liquidityNote: 'Low-price card; thin inventory can exaggerate the move.', kind: 'confirmed-bullish' },
    { name: 'Brushland', setCode: '6ed', setName: 'Classic Sixth Edition', priceLabel: '$9.04 vs $5.42', changePercent: 66.8, thesis: 'Old-printing and old-border crossover demand.', kind: 'confirmed-bullish' },
    { name: 'Xorn', setCode: 'sld', setName: 'Secret Lair Series', priceLabel: '$15.50 vs $11.00', changePercent: 40.9, thesis: 'Treasure synergy plus Secret Lair supply characteristics.', liquidityNote: 'Variant-specific move; watch depth before chasing.', kind: 'confirmed-bullish' },
    { name: 'Howling Mine', setCode: 'sld', setName: 'Secret Lair Series', priceLabel: '$13.48 vs $9.99', changePercent: 34.9, thesis: 'Casual and Commander demand in a constrained variant.', kind: 'confirmed-bullish' },
    { name: 'Wellwisher', setCode: 'cma', setName: 'Commander Anthology', priceLabel: '$4.97 vs $3.77', changePercent: 31.8, thesis: 'Casual and tribal Commander demand.', liquidityNote: 'Low-dollar move; inventory depth matters.', kind: 'confirmed-bullish' },
    { name: 'Winter Orb', setCode: '5ed', setName: 'Fifth Edition', priceLabel: '$15.49 vs $11.99', changePercent: 29.2, thesis: 'Commander and stax demand in an old printing.', kind: 'confirmed-bullish' },
    { name: 'Ob Nixilis, Captive Kingpin', setCode: 'mat', setName: 'March of the Machine: The Aftermath', priceLabel: '$50.28 vs $41.57', changePercent: 21, thesis: 'Commander and collector demand in a premium treatment.', kind: 'confirmed-bullish' },
    { name: 'Chrome Mox', setCode: '2xm', setName: 'Double Masters', priceLabel: '$254.99 vs $217.10', changePercent: 17.5, thesis: 'Eternal and Commander demand for a premium treatment.', liquidityNote: 'Premium variant liquidity is uneven.', kind: 'confirmed-bullish' },
    { name: "Teferi's Protection", setCode: 'sta', setName: 'Strixhaven Mystical Archive', priceLabel: '$101.96 vs $90.33', changePercent: 12.9, thesis: 'Commander staple plus collector premium.', kind: 'confirmed-bullish' },
    { name: 'Pact of Negation', setCode: 'ltc', setName: 'Tales of Middle-earth Commander', priceLabel: '$67.77 vs $61.23', changePercent: 10.7, thesis: 'Commander and premium-art crossover demand.', kind: 'confirmed-bullish' },
  ] as TodayMarketSignal[],
  confirmedBearish: [
    { name: 'Wedding Ring', setCode: 'who', setName: 'Doctor Who Commander', priceLabel: '$10.30 vs $14.99', changePercent: -31.3, thesis: 'Premium EDH staple cooling after demand faded.', kind: 'confirmed-bearish' },
    { name: 'Natural Order', setCode: 'ema', setName: 'Eternal Masters', priceLabel: '$32.99 vs $43.13', changePercent: -23.5, thesis: 'High-end staple unwinding as liquidity thins.', kind: 'confirmed-bearish' },
    { name: 'Dockside Extortionist', setCode: 'c19', setName: 'Commander 2019', priceLabel: '$16.70 vs $18.66', changePercent: -10.5, thesis: 'Confirmed weakness; remain cautious rather than assuming a blind buy.', kind: 'confirmed-bearish' },
    { name: 'Doubling Season', setCode: '2xm', setName: 'Double Masters', priceLabel: '$40.00 vs $45.78', changePercent: -12.6, thesis: 'Reprint-sensitive Commander staple softening.', kind: 'confirmed-bearish' },
    { name: 'Sting, the Glinting Dagger', setCode: 'ltr', setName: 'The Lord of the Rings', priceLabel: '$13.06 vs $15.34', changePercent: -14.9, thesis: 'Premium fantasy variant retracing after a burst.', kind: 'confirmed-bearish' },
  ] as TodayMarketSignal[],
  developing: [
    { name: 'Ink-Treader Nephilim', setCode: 'gpt', setName: 'Guildpact', priceLabel: '$5.28 latest public snapshot', changePercent: 0, thesis: 'Spoiler-driven repricing has retraced from the most aggressive highs; still fragile and speculative.', kind: 'developing' },
    { name: 'Leader, Super-Genius', setCode: 'msc', setName: 'Marvel Super Heroes Commander', priceLabel: 'Developing', changePercent: 0, thesis: 'Most common tracked Doom Prevails upgrade at 44%; a buy-singles-not-sealed signal without same-day price confirmation.', kind: 'developing' },
    { name: 'Norman Osborn // Green Goblin', setCode: 'msc', setName: 'Marvel Super Heroes Commander', priceLabel: 'Developing', changePercent: 0, thesis: 'Meaningful community-upgrade adoption; price confirmation remains outstanding.', kind: 'developing' },
    { name: 'Molecule Man', setCode: 'msc', setName: 'Marvel Super Heroes Commander', priceLabel: 'Developing', changePercent: 0, thesis: 'Portable utility in the stock deck makes it a name to monitor, not a confirmed mover.', kind: 'developing' },
    { name: "Doom's Time Platform", setCode: 'msc', setName: 'Marvel Super Heroes Commander', priceLabel: 'Developing', changePercent: 0, thesis: 'Portable utility thesis; needs broader market confirmation.', kind: 'developing' },
  ] as TodayMarketSignal[],
  sources: [
    { label: 'MTGStocks Interests', href: 'https://www.mtgstocks.com/interests' },
    { label: 'Doom Prevails upgrade guide', href: 'https://playgroup.gg/sets/marvel-super-heroes/precons/doom-prevails' },
    { label: 'Banned & Restricted', href: 'https://magic.wizards.com/en/banned-restricted-list' },
    { label: 'Ink-Treader Nephilim pricing', href: 'https://www.tcgplayer.com/product/13714/magic-guildpact-ink-treader-nephilim' },
    { label: 'Wizards official MTG news', href: 'https://magic.wizards.com/en' },
  ],
};

export type TodayMarketBrief = typeof todayMarketBrief;
