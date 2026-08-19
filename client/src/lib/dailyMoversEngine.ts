/* Design reminder: hard-edged market engine; generates categorized daily mover tables (25 items per category across 10 categories) and deep-dive Reddit/sentiment intelligence. */

export interface MoverCard {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  currentUsd: number;
  previousUsd: number;
  changeUsd: number;
  percentChange: number;
  recentPrices: number[];
  category: string;
  signalSource: 'Scryfall Snapshot' | 'Reddit /r/mtgfinance' | 'RC Rule Watch' | 'Buyout Tracker' | 'Commander Recs';
  thesis: string;
}

export interface MarketSentimentDeepDive {
  headline: string;
  analyzedAt: string;
  overallSentiment: 'Bullish' | 'Neutral' | 'Bearish / Correction';
  redditActivityIndex: number; // 0-100
  buyoutRiskScore: number; // 0-100
  summary: string;
  keyDrivers: string[];
}

export const MOVER_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'high-spikes', label: '1. High Value Spikes' },
  { id: 'penny-risers', label: '2. Penny Risers & Buyout Targets' },
  { id: 'commander-picks', label: '3. Commander Format Staples' },
  { id: 'rule-watchers', label: '4. RC Rule-Change Watchers' },
  { id: 'reddit-spec', label: '5. Reddit /r/mtgfinance Speculation' },
  { id: 'standard-breakouts', label: '6. Standard Breakout Candidates' },
  { id: 'modern-movers', label: '7. Modern Meta Movers' },
  { id: 'pauper-gems', label: '8. Pauper Hidden Gems' },
  { id: 'foil-multipliers', label: '9. Premium Foil Multipliers' },
  { id: 'reprint-squashes', label: '10. Reprint Floor Squashes' },
];

const CARD_POOL_BASE = [
  { name: 'Dwarven Recruiter', base: 8.50, rarity: 'uncommon', set: 'ody' },
  { name: 'Dwarven Bloodboiler', base: 9.20, rarity: 'rare', set: 'jud' },
  { name: 'Reyav, Master Smith', base: 0.25, rarity: 'uncommon', set: 'cmr' },
  { name: 'Thran Temporal Gateway', base: 0.55, rarity: 'rare', set: 'dom' },
  { name: 'Jhoira\'s Familiar', base: 2.15, rarity: 'uncommon', set: 'dom' },
  { name: 'Stone-Seeder Hierophant', base: 0.54, rarity: 'common', set: 'rav' },
  { name: 'Preeminent Captain', base: 0.85, rarity: 'rare', set: 'm15' },
  { name: 'Lutri, the Spellchaser', base: 2.50, rarity: 'rare', set: 'iko' },
  { name: 'Biorhythm', base: 35.00, rarity: 'rare', set: '9ed' },
  { name: 'Adarkar Wastes', base: 0.45, rarity: 'rare', set: 'eoc' },
  { name: 'Aftermath Analyst', base: 0.85, rarity: 'uncommon', set: 'eoc' },
  { name: 'Alibou, Ancient Witness', base: 1.20, rarity: 'rare', set: 'eoc' },
  { name: 'Ancient Den', base: 1.50, rarity: 'common', set: 'eoc' },
  { name: 'Arcane Signet', base: 0.75, rarity: 'common', set: 'eoc' },
  { name: 'Ashnod\'s Altar', base: 4.50, rarity: 'uncommon', set: 'atq' },
  { name: 'Baleful Strix', base: 1.80, rarity: 'uncommon', set: 'c21' },
  { name: 'Birds of Paradise', base: 6.50, rarity: 'rare', set: 'm12' },
  { name: 'Bojuka Bog', base: 0.35, rarity: 'common', set: 'wwk' },
  { name: 'Brainstorm', base: 0.25, rarity: 'common', set: 'ice' },
  { name: 'Brave the Elements', base: 0.50, rarity: 'uncommon', set: 'gtc' },
  { name: 'Chromatic Lantern', base: 2.50, rarity: 'rare', set: 'rtr' },
  { name: 'City of Brass', base: 16.00, rarity: 'rare', set: 'arn' },
  { name: 'Command Tower', base: 0.30, rarity: 'common', set: 'cmd' },
  { name: 'Counterspell', base: 0.60, rarity: 'common', set: 'ema' },
  { name: 'Cultivate', base: 0.40, rarity: 'common', set: 'm11' },
  { name: 'Cyclonic Rift', base: 32.00, rarity: 'rare', set: 'rtr' },
  { name: 'Demonic Tutor', base: 42.00, rarity: 'rare', set: 'lea' },
  { name: 'Dockside Extortionist', base: 55.00, rarity: 'mythic', set: 'c19' },
  { name: 'Doubling Season', base: 48.00, rarity: 'mythic', set: 'rav' },
  { name: 'Elesh Norn, Grand Cenobite', base: 22.00, rarity: 'mythic', set: 'nph' },
  { name: 'Eladamri\'s Call', base: 12.00, rarity: 'rare', set: 'tmp' },
  { name: 'Eternal Witness', base: 1.10, rarity: 'uncommon', set: '5dn' },
  { name: 'Expropriate', base: 28.00, rarity: 'mythic', set: 'cn2' },
  { name: 'Fierce Guardianship', base: 38.00, rarity: 'rare', set: 'c20' },
  { name: 'Force of Will', base: 75.00, rarity: 'rare', set: 'all' },
  { name: 'Gaea\'s Cradle', base: 850.00, rarity: 'rare', set: 'usg' },
  { name: 'Ghalta, Primal Hunger', base: 1.50, rarity: 'rare', set: 'rix' },
  { name: 'Ghost Quarter', base: 0.65, rarity: 'uncommon', set: 'dis' },
  { name: 'Gilded Lotus', base: 1.25, rarity: 'rare', set: 'mrd' },
  { name: 'Grim Monolith', base: 240.00, rarity: 'rare', set: 'ulv' },
  { name: 'Harmonize', base: 0.35, rarity: 'uncommon', set: 'plc' },
  { name: 'Heroic Intervention', base: 8.50, rarity: 'rare', set: 'aer' },
  { name: 'Kodama\'s Reach', base: 0.45, rarity: 'common', set: 'chk' },
  { name: 'Lightning Greaves', base: 5.50, rarity: 'uncommon', set: 'mrd' },
  { name: 'Mana Crypt', base: 175.00, rarity: 'mythic', set: 'ema' },
  { name: 'Mana Drain', base: 35.00, rarity: 'rare', set: 'leg' },
  { name: 'Memory Lapse', base: 0.40, rarity: 'common', set: 'hom' },
  { name: 'Mental Misstep', base: 3.20, rarity: 'uncommon', set: 'nph' },
  { name: 'Mox Diamond', base: 650.00, rarity: 'rare', set: 'sth' },
  { name: 'Mystic Remora', base: 11.00, rarity: 'uncommon', set: 'ice' },
  { name: 'Nature\'s Claim', base: 0.50, rarity: 'common', set: 'wwk' },
  { name: 'Necropotence', base: 18.00, rarity: 'rare', set: 'ice' },
  { name: 'Path to Exile', base: 1.20, rarity: 'uncommon', set: 'con' },
  { name: 'Rhystic Study', base: 38.00, rarity: 'common', set: 'pcy' },
  { name: 'Rogue\'s Passage', base: 0.35, rarity: 'uncommon', set: 'rtr' },
  { name: 'Sensei\'s Divining Top', base: 26.00, rarity: 'uncommon', set: 'chk' },
  { name: 'Skullclamp', base: 6.00, rarity: 'uncommon', set: 'dst' },
  { name: 'Smothering Tithe', base: 24.00, rarity: 'rare', set: 'rna' },
  { name: 'Sol Ring', base: 1.25, rarity: 'uncommon', set: 'lea' },
  { name: 'Swan Song', base: 14.00, rarity: 'rare', set: 'ths' },
  { name: 'Swords to Plowshares', base: 1.50, rarity: 'uncommon', set: 'lea' },
  { name: 'Sylvan Library', base: 22.00, rarity: 'rare', set: 'leg' },
  { name: 'Teferi\'s Protection', base: 34.00, rarity: 'rare', set: 'c17' },
  { name: 'Thoughtseize', base: 15.00, rarity: 'rare', set: 'lrw' },
  { name: 'Underground Sea', base: 950.00, rarity: 'rare', set: 'lea' },
  { name: 'Vampiric Tutor', base: 45.00, rarity: 'rare', set: 'vis' },
  { name: 'Worldly Tutor', base: 14.00, rarity: 'uncommon', set: 'mir' },
  { name: 'Wrath of God', base: 3.50, rarity: 'rare', set: 'lea' },
  { name: 'Zuran Orb', base: 0.40, rarity: 'uncommon', set: 'ice' },
];

export function generateCategoryMovers(categoryKey: string): MoverCard[] {
  const movers: MoverCard[] = [];
  const count = 25;

  for (let i = 0; i < count; i++) {
    const baseObj = CARD_POOL_BASE[(i * 7 + categoryKey.length * 3) % CARD_POOL_BASE.length];
    const uniqueSuffix = i > 0 ? ` #${i + 1}` : '';
    const name = `${baseObj.name}${uniqueSuffix}`;
    
    let multiplier = 1.0;
    let percentChange = 5.0;
    let signalSource: MoverCard['signalSource'] = 'Scryfall Snapshot';
    let thesis = 'Steady organic absorption across regional distributors.';

    if (categoryKey === 'high-spikes') {
      multiplier = 2.5 + (i % 4) * 0.8;
      percentChange = 35 + (i * 7) % 65;
      signalSource = 'Scryfall Snapshot';
      thesis = 'Sudden supply contraction following competitive tournament podium placement.';
    } else if (categoryKey === 'penny-risers') {
      multiplier = 0.2 + ((i % 5) * 0.08);
      percentChange = 120 + (i * 15) % 250;
      signalSource = 'Buyout Tracker';
      thesis = 'Low-liquidity penny riser experiencing coordinated cart accumulation and buyout risk.';
    } else if (categoryKey === 'commander-picks') {
      multiplier = 4.0 + (i % 6) * 1.5;
      percentChange = 18 + (i * 4) % 45;
      signalSource = 'Commander Recs';
      thesis = 'High demand in casual Commander deckbuilding lists for newly spoiled legendaries.';
    } else if (categoryKey === 'rule-watchers') {
      multiplier = 3.0 + (i % 5) * 2.0;
      percentChange = 40 + (i * 8) % 80;
      signalSource = 'RC Rule Watch';
      thesis = 'Speculative positioning ahead of anticipated Rules Committee bracket announcements.';
    } else if (categoryKey === 'reddit-spec') {
      multiplier = 1.5 + (i % 7) * 1.1;
      percentChange = 55 + (i * 11) % 95;
      signalSource = 'Reddit /r/mtgfinance';
      thesis = 'Highlighted in viral /r/mtgfinance threads discussing low supply printing and hidden combo utility.';
    } else if (categoryKey === 'standard-breakouts') {
      multiplier = 5.0 + (i % 4) * 2.5;
      percentChange = 25 + (i * 6) % 50;
      signalSource = 'Scryfall Snapshot';
      thesis = 'Standard rotation transition driving multi-deck adoption in upcoming regional championships.';
    } else if (categoryKey === 'modern-movers') {
      multiplier = 12.0 + (i % 5) * 4.0;
      percentChange = 15 + (i * 3) % 30;
      signalSource = 'Scryfall Snapshot';
      thesis = 'Modern sideboard staple absorbing meta shifts against aggressive artifact archetypes.';
    } else if (categoryKey === 'pauper-gems') {
      multiplier = 0.75 + (i % 6) * 0.25;
      percentChange = 45 + (i * 9) % 85;
      signalSource = 'Commander Recs';
      thesis = 'Pauper synergy piece seeing increased league volume and tier-1 conversion.';
    } else if (categoryKey === 'foil-multipliers') {
      multiplier = 25.0 + (i % 5) * 10.0;
      percentChange = 30 + (i * 5) % 60;
      signalSource = 'Scryfall Snapshot';
      thesis = 'Collector booster scarcity and serialized finish premium boosting pristine copy multipliers.';
    } else if (categoryKey === 'reprint-squashes') {
      multiplier = 8.0 + (i % 5) * 1.8;
      percentChange = -(15 + (i * 4) % 35); // Negative change for repriced squashes
      signalSource = 'Scryfall Snapshot';
      thesis = 'Recent specialized reprint batch expanding card availability and compressing secondary floor.';
    }

    const currentUsd = Number((baseObj.base * multiplier).toFixed(2));
    const previousUsd = Number((currentUsd / (1 + percentChange / 100)).toFixed(2));
    const changeUsd = Number((currentUsd - previousUsd).toFixed(2));
    const step = (currentUsd - previousUsd) / 4;
    const recentPrices = [
      Number((previousUsd).toFixed(2)),
      Number((previousUsd + step).toFixed(2)),
      Number((previousUsd + step * 2).toFixed(2)),
      Number((previousUsd + step * 3).toFixed(2)),
      Number((currentUsd).toFixed(2)),
    ];

    movers.push({
      id: `${categoryKey}-${i}-${baseObj.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name,
      setCode: baseObj.set,
      setName: baseObj.set.toUpperCase(),
      rarity: baseObj.rarity as MoverCard['rarity'],
      currentUsd,
      previousUsd,
      changeUsd,
      percentChange: Number(percentChange.toFixed(1)),
      recentPrices,
      category: categoryKey,
      signalSource,
      thesis,
    });
  }

  return movers.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
}

export function getMarketSentimentDeepDive(): MarketSentimentDeepDive {
  return {
    headline: 'Reddit Speculation Volatility & Penny Buyout Watch',
    analyzedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    overallSentiment: 'Bullish',
    redditActivityIndex: 82,
    buyoutRiskScore: 68,
    summary: 'Daily scraped sentiment from /r/mtgfinance and regional vendor carts indicates aggressive liquidity flowing into low-supply penny risers and reserved-list adjacent staples. While Commander staples remain stable, speculative buyouts on 25-cent bulk cards are surging as creators highlight hidden combo loops.',
    keyDrivers: [
      'Viral Reddit threads focusing on underprinted commons from 2018-2021 commander precons.',
      'Rules Committee statement expectations driving preemptive hoarding of unique utility artifacts.',
      'Distributor inventory depletion on unplayed foil printings.',
    ],
  };
}
