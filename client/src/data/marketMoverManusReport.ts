export type ManusMoverTone = 'positive' | 'watch' | 'risk' | 'supply';

export interface ManusMoverCard {
  name: string;
  setCode?: string;
  setLabel: string;
  movement: string;
  thesis: string;
  tags: string[];
  tone: ManusMoverTone;
}

export interface ManusMoverDashboard {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  read: string;
  tone: ManusMoverTone;
  cards: ManusMoverCard[];
}

export const manusMoverReport = {
  published: 'October 9, 2026',
  updated: '2026-10-09',
  title: 'Four ways to read the MTG mover tape',
  dek: 'A signal-first market note separating broad demand, portable budget cards, fragile inventory shocks, and product-driven supply events.',
  metrics: [
    { value: '40+', label: 'movers and searched names surfaced' },
    { value: '7', label: 'catalyst clusters in the report' },
    { value: '6', label: 'high-risk buyout flags' },
    { value: '4', label: 'precon and supply events' },
  ],
};

export const manusMoverDashboards: ManusMoverDashboard[] = [
  {
    slug: 'confirmed',
    label: 'Confirmed / headline movers',
    shortLabel: 'Confirmed',
    description: 'Large, visible moves with a plausible demand or scarcity story behind them.',
    read: 'Use this desk for names that deserve follow-up across more than one price snapshot. A move can be real without being a clean entry: premium staples, Reserved List scarcity, and thin variant inventory can all produce the same chart shape.',
    tone: 'positive',
    cards: [
      { name: 'Ink-Treader Nephilim', setCode: 'gpt', setLabel: 'Guildpact', movement: 'About $1.45 toward $8–$10', thesis: 'A spoiler-driven Commander catalyst tied to Nephilim Epochal. Treat the spike as a thesis to monitor, not a guaranteed new floor.', tags: ['Commander', 'Spec spike', 'Reprint risk'], tone: 'watch' },
      { name: 'Chrome Mox', setCode: '2xm', setLabel: 'Double Masters · Borderless', movement: 'Observed around $254.99 with a major weekly gain', thesis: 'Premium fast-mana demand is a stronger explanation than a narrow tribal impulse, but the treatment and liquidity still matter.', tags: ['Premium', 'Combo', 'Fast mana'], tone: 'positive' },
      { name: 'Mox Diamond', setCode: 'sth', setLabel: 'Stronghold', movement: 'High-end multiday appreciation', thesis: 'Reserved List scarcity and eternal demand form a durable narrative, though a five-figure card market is not frictionless.', tags: ['Reserved List', 'Collector', 'High value'], tone: 'positive' },
      { name: 'Grave Pact', setCode: 'sth', setLabel: 'Stronghold', movement: 'Large weekly appreciation', thesis: 'Sacrifice and aristocrats Commander demand is a portable use case that can support organic interest beyond one event.', tags: ['Commander staple', 'Aristocrats', 'Organic demand'], tone: 'positive' },
      { name: 'Sonic Screwdriver', setCode: 'who', setLabel: 'Doctor Who variants', movement: 'Multiple printings posted outsized percentage gains', thesis: 'Collector attention and thin inventory may be working together. Compare listings and treatment premiums before calling it broad demand.', tags: ['Universes Beyond', 'Low liquidity', 'Variants'], tone: 'watch' },
    ],
  },
  {
    slug: 'penny',
    label: 'Penny movers to watch',
    shortLabel: 'Penny & portable',
    description: 'Lower-cost or broadly useful cards where the catalyst matters more than the headline percentage.',
    read: 'This is the budget basket: cards that can travel between Commander shells, not just one narrow build. The supplied report calls out upside potential, but these remain developing names until repeat sales confirm the signal.',
    tone: 'positive',
    cards: [
      { name: 'Carth the Lion', setCode: 'cmr', setLabel: 'Commander / Superfriends basket', movement: 'Low-cost basket entry', thesis: 'A Superfriends overlap piece with a recognizable deckbuilding catalyst and a budget-friendly starting point.', tags: ['Budget', 'Superfriends', 'Portable'], tone: 'positive' },
      { name: 'Deepglow Skate', setCode: 'c16', setLabel: 'Commander 2016', movement: 'Counters demand with wider utility', thesis: 'Broader counters utility gives this a stronger floor than a planeswalker-only hype card.', tags: ['Counters', 'Commander', 'Portable'], tone: 'positive' },
      { name: 'Azor, the Lawbringer', setCode: 'rix', setLabel: 'Rivals of Ixalan', movement: 'Lower-cost Sphinx thesis', thesis: 'A way to express the Ur-Sphinx / Reality Fracture Sphinx theme without chasing the most extended names.', tags: ['Sphinx basket', 'Developing', 'Budget'], tone: 'watch' },
      { name: 'Raffine, Scheming Seer', setCode: 'snc', setLabel: 'Streets of New Capenna · Showcase', movement: 'Treatment dislocation', thesis: 'The report highlights a premium-looking version trading below regular copies during the spike window—a treatment-arbitrage watch, not a certainty.', tags: ['Treatment arb', 'Esper', 'Showcase'], tone: 'watch' },
      { name: 'Wellwisher', setCode: 'cma', setLabel: 'Commander Anthology', movement: 'Confirmed tribal move; monitor pullback', thesis: 'A recognizable Elf tribal winner that has already moved hard enough to shift from chase candidate to monitor.', tags: ['Elf tribal', 'Monitor', 'Pullback risk'], tone: 'watch' },
    ],
  },
  {
    slug: 'buyout-risk',
    label: 'Buyout-risk names',
    shortLabel: 'Buyout risk',
    description: 'Large percentage moves where thin inventory, one bulk order, or a niche treatment may be doing most of the work.',
    read: 'This dashboard is deliberately defensive. These are not “best buys”; they are names to separate from organic demand before a chart is used as evidence. Wait for fresh listings, transaction count, and repeat closes.',
    tone: 'risk',
    cards: [
      { name: 'Vronos, Masked Inquisitor', setCode: 'cma', setLabel: 'Commander Anthology', movement: 'Suspected inventory shock', thesis: 'The supplied report says a bulk order dominated sales. That is a warning that the displayed move may not represent broad player demand.', tags: ['Do not chase', 'Buyout suspected', 'Low depth'], tone: 'risk' },
      { name: 'Forest', setCode: 'sld', setLabel: 'Secret Lair 1651', movement: 'Extreme percentage move', thesis: 'A handful of thin listings can create a dramatic percentage move in premium basics; look for broad buyer participation before extrapolating.', tags: ['Collector only', 'Thin supply', 'Fragile'], tone: 'risk' },
      { name: 'Unesh, Criosphinx Sovereign', setCode: 'c17', setLabel: 'Commander 2017', movement: 'Reported 1,100% move', thesis: 'This is an event to document, not a fresh entry. The distance from the old price is itself the risk signal.', tags: ['Headline spike', 'Extended', 'Watch only'], tone: 'risk' },
      { name: 'Sphinx Ambassador', setCode: 'c16', setLabel: 'Commander 2016', movement: 'Archetype spillover', thesis: 'A Sphinx-hype winner that has already moved; require a second catalyst before treating the new price as durable.', tags: ['Archetype spillover', 'Watch only', 'Sphinx'], tone: 'watch' },
      { name: 'Secret Lair basics and niche printings', setCode: 'sld', setLabel: 'Premium treatments', movement: 'Relisting-sensitive moves', thesis: 'These often move on a small number of transactions and mean-revert once fresh inventory appears.', tags: ['Low liquidity', 'Fragile pricing', 'Relisting'], tone: 'risk' },
    ],
  },
  {
    slug: 'supply-clock',
    label: 'Precon and supply movers',
    shortLabel: 'Supply clock',
    description: 'Product releases, reprints, and Commander legality dates that can change the supply equation before the chart moves.',
    read: 'The right question here is not “is this card up?” but “what product event changes access, legality, or sealed supply next?” This desk is useful for buying singles from a deck, avoiding sealed exposure, and timing reprint risk.',
    tone: 'supply',
    cards: [
      { name: 'Molecule Man', setLabel: 'Doom Prevails', movement: 'Portable colorless utility target', thesis: 'The report identifies this as a strongest singles-first target from the Marvel Villains precon discussion, with utility that can travel across decks.', tags: ['Precon singles', 'Portable demand', 'Marvel'], tone: 'positive' },
      { name: 'Doom’s Time Platform', setLabel: 'Doom Prevails', movement: 'Cross-archetype graveyard engine', thesis: 'A broader upgrade thesis than a Villain-only card; watch the singles curve as the precon reaches players.', tags: ['Commander tech', 'Upgrade piece', 'Graveyard'], tone: 'positive' },
      { name: 'Warhammer 40K Commander decks', setLabel: 'Universes Beyond · sealed product', movement: 'Confirmed reprint shock', thesis: 'Reprint supply can pressure sealed decks and deck-exclusive singles. Monitor downside before treating legacy premiums as stable.', tags: ['Reprint event', 'Supply pressure', 'Sealed watch'], tone: 'supply' },
      { name: 'Mystery Booster Commander Edition targets', setLabel: 'Upcoming Commander Draft product', movement: 'Commander-legal supply clock', thesis: 'The upcoming product and legality date create a calendar-driven category rather than a simple price-spike category.', tags: ['Supply calendar', 'Commander legal Nov. 13', 'Draft product'], tone: 'supply' },
    ],
  },
];

export const manusMoverBaskets = [
  { label: 'Reality Fracture / archetype basket', cards: 'Nicol Bolas, Dragon-God · Oath of Teferi · Tam the Possibility · The Ur-Sphinx · Azor, the Lawbringer · Raffine, Scheming Seer · Unesh, Criosphinx Sovereign · Sphinx Ambassador · Vronos, Masked Inquisitor · Carth the Lion · Deepglow Skate · The Chain Veil' },
  { label: 'Doom Prevails / upgrade basket', cards: 'Molecule Man · Doom’s Time Platform · Leader, Super-Genius · Norman Osborn // Green Goblin · Doctor Octopus · Master Planner · Green Goblin · Revenant · Monument to Endurance · Archfiend of Ifnir · Vandalblast · Syphon Mind' },
  { label: 'Supply-event products', cards: 'Doom Prevails sealed precon · Warhammer 40K Commander decks · Mystery Booster Commander Edition · Festival in a Box: Atlanta 2026 · Reality Fracture sealed products and chase treatments' },
];
