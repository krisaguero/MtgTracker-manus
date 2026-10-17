export type HistoricalWatchSource = {
  label: string;
  url: string;
};

export type HistoricalPriceWatchSignal = {
  reportDate: string;
  card: string;
  printing: string;
  measurementWindow: string;
  reportedPrice: string;
  reportedMove: string;
  catalyst: string;
  risk: string;
  sourceConfidence: string;
  verificationStatus: string;
  sources: HistoricalWatchSource[];
};

const october5 = 'October 5, 2026';
const october11 = 'October 11, 2026';

export const october5WatchSignals: HistoricalPriceWatchSignal[] = [
  {
    reportDate: october5,
    card: 'Ink-Treader Nephilim',
    printing: 'Guildpact · nonfoil',
    measurementWindow: 'Spoiler window; the report describes a multi-source weekly-window estimate and explicitly says it is not a single-day move.',
    reportedPrice: 'About $8–$10 from recent listings; exact report-date price unverified and liquidity described as thin.',
    reportedMove: 'About +450% from a ~$1.45 baseline.',
    catalyst: 'Nephilim Epochal spoiler enabling Nephilim tribal in Mystery Booster Commander Edition.',
    risk: 'Reprint exposure (not Reserved List), spoiler-season enthusiasm, and low-liquidity spike risk.',
    sourceConfidence: 'Confirmed in the source (multi-site coverage and completed-sale evidence, though still pre-release); not independently re-verified here.',
    verificationStatus: 'Historical spoiler-window signal. The source says exact current price is unverified; this is not a verified 24-hour move or live quote.',
    sources: [
      { label: '[1] TechTimes', url: 'https://www.techtimes.com/articles/325772/20260827/mtgs-ink-treader-nephilim-surges-450-why-this-pre-release-spike-risky.htm' },
      { label: '[8] MTG Rocks', url: 'https://mtgrocks.com/mtg-ink-treader-nephilim-price-spike/' },
      { label: '[7] Draftsim weekly spikes', url: 'https://draftsim.com/mtg-weekly-price-spikes-8-1-8-7/' },
    ],
  },
  {
    reportDate: october5,
    card: 'Dune-Brood Nephilim',
    printing: 'Guildpact · foil',
    measurementWindow: 'July 26–August 31, 2026 recap window cited by the source; multi-week, not daily.',
    reportedPrice: 'Unverified; the report cites an EU-market range of about €5 to €15.',
    reportedMove: 'About +200% over the July 26–August 31 recap window.',
    catalyst: 'The same Nephilim Epochal spoiler window; tribal interest lifting multiple original Nephilim.',
    risk: 'Reprint exposure, narrow archetype demand, and thin-supply euro-spike risk.',
    sourceConfidence: 'Developing (source-reported).',
    verificationStatus: 'EU-market historical range; exact price is unverified and no prior-day move is established.',
    sources: [
      { label: '[9] MTG Finance recap', url: 'https://www.reddit.com/r/mtgfinance/comments/1w3uidz/mtg_finance_recap_july_26_august_31/' },
      { label: '[7] Draftsim weekly spikes', url: 'https://draftsim.com/mtg-weekly-price-spikes-8-1-8-7/' },
    ],
  },
  {
    reportDate: october5,
    card: 'Caller of the Claw',
    printing: 'Scourge · nonfoil',
    measurementWindow: 'Weekly Winners week-over-week window; exact comparison dates are not stated in the report.',
    reportedPrice: 'Unverified; the report cites a Weekly Winners snapshot near $22.47.',
    reportedMove: '+152% week over week, as reported by the source.',
    catalyst: 'Bear-tribal Commander interest and synergies with new bear-support pieces.',
    risk: 'Reprint risk and Commander-only demand concentration.',
    sourceConfidence: 'Confirmed in the source (price-tracker and article coverage); not independently re-verified here.',
    verificationStatus: 'Weekly source-reported move; exact price is unverified and this is not daily/current market data.',
    sources: [
      { label: '[19] MTGStocks Weekly Winners 2026–35', url: 'https://www.mtgstocks.com/news/24722-weekly-winners-2026---35' },
    ],
  },
  {
    reportDate: october5,
    card: 'Bearscape',
    printing: 'Odyssey · nonfoil',
    measurementWindow: 'Weekly Winners week-over-week window; exact comparison dates are not stated in the report.',
    reportedPrice: 'Unverified; the source cites a Weekly Winners snapshot near $14.77.',
    reportedMove: '+75% week over week, as reported by the source.',
    catalyst: 'Bear-tribal hype and graveyard-value Commander shells.',
    risk: 'Reprint risk, narrow archetype demand, and possible overextension.',
    sourceConfidence: 'Confirmed in the source; not independently re-verified here.',
    verificationStatus: 'Historical weekly signal; exact price is unverified and this is not a verified prior-day move.',
    sources: [
      { label: '[19] MTGStocks Weekly Winners 2026–35', url: 'https://www.mtgstocks.com/news/24722-weekly-winners-2026---35' },
    ],
  },
  {
    reportDate: october5,
    card: 'Ayula, Queen Among Bears',
    printing: 'Modern Horizons · nonfoil',
    measurementWindow: 'Weekly Winners week-over-week window; exact comparison dates are not stated in the report.',
    reportedPrice: 'Unverified; the report cites about $5.60.',
    reportedMove: '+37% week over week, as reported by the source.',
    catalyst: 'Ongoing bear-tribal interest linked to recent set and Commander tools.',
    risk: 'Metagame dependency and reprint exposure.',
    sourceConfidence: 'Confirmed in the source; not independently re-verified here.',
    verificationStatus: 'Historical weekly signal; exact price is unverified and this is not current quote data.',
    sources: [
      { label: '[19] MTGStocks Weekly Winners 2026–35', url: 'https://www.mtgstocks.com/news/24722-weekly-winners-2026---35' },
    ],
  },
  {
    reportDate: october5,
    card: 'Sergeant John Benton',
    printing: 'Universes Beyond · nonfoil; exact set/printing not specified in the report',
    measurementWindow: 'Spike window; the cited weekly-spike article [21] covers February 21–27, 2026, but exact per-card comparison timestamps are not specified.',
    reportedPrice: 'Unverified; the report cites around $8.35 after the spike.',
    reportedMove: 'About +2,400–3,000% from a ~$0.35 bulk baseline over the spike window.',
    catalyst: 'Dimir Excruciator reanimator success at Pro Tour.',
    risk: 'Rotation risk, tournament-results dependency, and buyout-style volatility.',
    sourceConfidence: 'Confirmed in the source; not independently re-verified here.',
    verificationStatus: 'Large historical spike claim; exact price is unverified and the move is not a verified 24-hour change.',
    sources: [
      { label: '[21] Draftsim weekly spikes', url: 'https://draftsim.com/mtg-weekly-price-spikes-2-21-2-27/' },
      { label: '[22] Draftsim weekly spikes', url: 'https://draftsim.com/mtg-weekly-price-spikes-1-31-2-6/' },
    ],
  },
  {
    reportDate: october5,
    card: 'Sunderflock',
    printing: 'Standard set · nonfoil; exact set not specified in the report',
    measurementWindow: 'Single weekly spike window; the cited weekly-spike article [22] is dated January 31–February 6, 2026; exact card-level endpoints are not supplied.',
    reportedPrice: 'Unverified; the report cites spike data only.',
    reportedMove: 'More than +700% from near-bulk levels over a weekly window.',
    catalyst: 'Pro Tour success and inclusion as a key removal/tempo piece in Dimir Excruciator.',
    risk: 'Standard rotation, ban watch if the deck dominates, and metagame reversion.',
    sourceConfidence: 'Confirmed in the source (tournament plus tracker); not independently re-verified here.',
    verificationStatus: 'Price unverified; historical weekly report, not a verified daily mover or current quote.',
    sources: [
      { label: '[22] Draftsim weekly spikes', url: 'https://draftsim.com/mtg-weekly-price-spikes-1-31-2-6/' },
    ],
  },
  {
    reportDate: october5,
    card: 'Nurgle’s Rot',
    printing: 'Warhammer 40,000 · nonfoil',
    measurementWindow: 'Week-window spike; exact dates are not stated in the report. Cited source [22] is a January 31–February 6, 2026 weekly-spike report.',
    reportedPrice: 'Unverified.',
    reportedMove: 'About +400% from bulk over a week-window, as reported by the source.',
    catalyst: 'New synergies highlighted in weekly spike analysis.',
    risk: 'Thin Commander-only demand and reprint risk.',
    sourceConfidence: 'Developing (source-reported).',
    verificationStatus: 'Historical weekly claim; no current exact price or prior-day change is established.',
    sources: [
      { label: '[22] Draftsim weekly spikes', url: 'https://draftsim.com/mtg-weekly-price-spikes-1-31-2-6/' },
    ],
  },
  {
    reportDate: october5,
    card: 'Harvester of Misery',
    printing: 'Standard set · nonfoil; exact set not specified in the report',
    measurementWindow: 'Pro Tour-linked spike; exact measurement dates are not stated. Cited source [22] is a January 31–February 6, 2026 weekly-spike report.',
    reportedPrice: 'Unverified.',
    reportedMove: 'About +350%, tied to Pro Tour decklists in the source report.',
    catalyst: 'Tournament spotlight as a flexible sweeper/removal spell.',
    risk: 'Metagame changes and sideboard-tech rotation.',
    sourceConfidence: 'Confirmed in the source; not independently re-verified here.',
    verificationStatus: 'Price unverified; historical spike rather than a verified 24-hour movement.',
    sources: [
      { label: '[22] Draftsim weekly spikes', url: 'https://draftsim.com/mtg-weekly-price-spikes-1-31-2-6/' },
    ],
  },
  {
    reportDate: october5,
    card: 'Insatiable Avarice',
    printing: 'Standard set · nonfoil; exact set not specified in the report',
    measurementWindow: 'Spike-coverage window; exact dates are not stated. Cited source [22] is a January 31–February 6, 2026 weekly-spike report.',
    reportedPrice: 'Unverified; the report says the card was paired in spike coverage.',
    reportedMove: 'About +350% as part of a new reanimator shell, as reported by the source.',
    catalyst: 'Synergy with graveyard/big-spell strategies.',
    risk: 'Spoiler-driven interest fading and reprint risk.',
    sourceConfidence: 'Developing (source-reported).',
    verificationStatus: 'Price unverified; historical weekly-source claim, not a verified daily move.',
    sources: [
      { label: '[22] Draftsim weekly spikes', url: 'https://draftsim.com/mtg-weekly-price-spikes-1-31-2-6/' },
    ],
  },
];

export const october11WatchSignals: HistoricalPriceWatchSignal[] = [
  {
    reportDate: october11,
    card: 'Ink-Treader Nephilim',
    printing: 'Guildpact · nonfoil',
    measurementWindow: 'Historical spoiler window; the report explicitly says the +400–500% move is not a single-day move.',
    reportedPrice: 'About $7–$10 multi-source range; not precise.',
    reportedMove: '+400–500% versus an approximately $1.45 baseline.',
    catalyst: 'Nephilim Epochal spoiler enabling Nephilim tribal in Mystery Booster Commander Edition.',
    risk: 'Reprint risk, spoiler-season enthusiasm, and low-liquidity risk.',
    sourceConfidence: 'Developing (source-reported).',
    verificationStatus: 'Historical multi-source range, not a precise current price or verified 24-hour change.',
    sources: [
      { label: '[4] TechTimes', url: 'https://www.techtimes.com/articles/325772/20260827/mtgs-ink-treader-nephilim-surges-450-why-this-pre-release-spike-risky.htm' },
      { label: '[5] MTG Rocks', url: 'https://mtgrocks.com/mtg-ink-treader-nephilim-price-spike/' },
      { label: '[6] MTGDecks price page', url: 'https://mtgdecks.net/prices/ink-treader-nephilim' },
    ],
  },
  {
    reportDate: october11,
    card: 'Vronos, Masked Inquisitor',
    printing: 'Recent-set mythic · nonfoil; exact set/printing not specified in the report',
    measurementWindow: 'Multi-day window; exact comparison dates are not stated in the report.',
    reportedPrice: 'About $24.99 in a Weekly Winners snapshot.',
    reportedMove: '+400% or more from a prior $6–$7 range, as reported by the source.',
    catalyst: 'Planeswalker-style value engine highlighted in Weekly Winners Commander coverage.',
    risk: 'Reprint exposure and hype-cycle retrace risk.',
    sourceConfidence: 'Developing (source-reported).',
    verificationStatus: 'Historical multi-day comparison; exact printing and current price are not independently verified.',
    sources: [
      { label: '[8] MTGStocks Weekly Winners 2026–41', url: 'https://www.mtgstocks.com/news/25415-weekly-winners-2026---41' },
    ],
  },
  {
    reportDate: october11,
    card: 'Onakke Oathkeeper',
    printing: 'Commander / Universes Beyond mythic · nonfoil; exact set not specified in the report',
    measurementWindow: 'Multi-day window; exact dates are not stated in the report.',
    reportedPrice: 'About $19 in a Weekly Winners snapshot.',
    reportedMove: 'Large percentage move over a low-teens baseline; the report gives no exact percentage.',
    catalyst: 'Graveyard-recursion and value engine highlighted in Weekly Winners Commander coverage.',
    risk: 'Reprint exposure and thin-supply spike risk.',
    sourceConfidence: 'Developing (source-reported).',
    verificationStatus: 'Historical multi-day signal; exact percentage, printing, and current price are unverified.',
    sources: [
      { label: '[7] MTGStocks Weekly Winners 2026–40', url: 'https://www.mtgstocks.com/news/25283-weekly-winners-2026---40' },
    ],
  },
  {
    reportDate: october11,
    card: 'Oath of Teferi',
    printing: 'Dominaria / reprint variants · nonfoil',
    measurementWindow: 'Multi-source, multi-week appreciation; exact endpoints are not stated in the report.',
    reportedPrice: 'About $14 in a Weekly Winners snapshot.',
    reportedMove: 'Steady appreciation rather than an overnight spike; no exact percentage is reported.',
    catalyst: 'Superfriends strategies and planeswalker synergies in Commander.',
    risk: 'Reprint risk.',
    sourceConfidence: 'Confirmed in the source as multi-source, multi-week; not independently re-verified here.',
    verificationStatus: 'Historical multi-week trend, not a verified 24-hour move or current quote.',
    sources: [
      { label: '[7] MTGStocks Weekly Winners 2026–40', url: 'https://www.mtgstocks.com/news/25283-weekly-winners-2026---40' },
    ],
  },
  {
    reportDate: october11,
    card: 'Impossible Man',
    printing: 'Universes Beyond · nonfoil; exact set not specified in the report',
    measurementWindow: 'Multi-week window; exact endpoints are not stated in the report.',
    reportedPrice: 'About $18 in a Weekly Winners snapshot.',
    reportedMove: '+1,500% from near-bulk levels over a multi-week window, as reported by the source.',
    catalyst: 'Unique, chaotic effect and Universes Beyond novelty.',
    risk: 'Thin-supply spike, reprint risk, and hype reversal.',
    sourceConfidence: 'Developing (source-reported).',
    verificationStatus: 'Historical multi-week movement; exact current price is not independently verified.',
    sources: [
      { label: '[19] MTGStocks Weekly Winners 2026–29', url: 'https://www.mtgstocks.com/news/23996-weekly-winners-2026---29' },
    ],
  },
  {
    reportDate: october11,
    card: 'Nicol Bolas, Dragon-God',
    printing: 'War of the Spark / special printings · nonfoil; exact printing not specified in the report',
    measurementWindow: 'Historical-low-to-snapshot comparison; elapsed time is not specified in the report.',
    reportedPrice: 'Mid-$20s in a Weekly Winners snapshot.',
    reportedMove: '+300% or more from historical low-teens levels, as reported by the source.',
    catalyst: 'High-profile planeswalker commander and Superfriends payoff.',
    risk: 'Reprint risk and narrow-archetype exposure.',
    sourceConfidence: 'Developing (source-reported).',
    verificationStatus: 'Historical comparison with no stated date range; exact printing and current price are unverified.',
    sources: [
      { label: '[7] MTGStocks Weekly Winners 2026–40', url: 'https://www.mtgstocks.com/news/25283-weekly-winners-2026---40' },
    ],
  },
  {
    reportDate: october11,
    card: 'Jet Medallion',
    printing: 'Commander 2014 · nonfoil',
    measurementWindow: 'Recent comparison window; exact dates are not stated in the report.',
    reportedPrice: 'About $17.49 in an Interests snapshot.',
    reportedMove: '+22.6% versus a prior $14.26 in the recent window.',
    catalyst: 'Black mana-cost reduction for spell-heavy Commander decks.',
    risk: 'Reprint risk.',
    sourceConfidence: 'Confirmed in the source (clear percentage and price data); not independently re-verified here.',
    verificationStatus: 'Source reports a defined comparison, but it is not a verified current quote or 24-hour move.',
    sources: [
      { label: '[2] MTGStocks Interests', url: 'https://www.mtgstocks.com/interests' },
    ],
  },
  {
    reportDate: october11,
    card: 'Combat Celebrant',
    printing: 'Amonkhet · nonfoil',
    measurementWindow: 'Multi-week trend; exact comparison dates are not stated in the report.',
    reportedPrice: 'About $2.26 in a Weekly Winners snapshot.',
    reportedMove: 'Up from near $1 over a multi-week trend; the report gives no exact percentage.',
    catalyst: 'Extra combat steps and combo potential in red Commander decks.',
    risk: 'Reprint exposure and Commander-only demand.',
    sourceConfidence: 'Developing (source-reported).',
    verificationStatus: 'Historical multi-week trend; exact current price and daily change are not verified.',
    sources: [
      { label: '[9] MTGStocks Weekly Winners 2026–34', url: 'https://www.mtgstocks.com/news/24623-weekly-winners-2026---34' },
    ],
  },
];
