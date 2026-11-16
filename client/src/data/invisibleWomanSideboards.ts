export type InvisibleWomanSideboardCard = {
  name: string;
  role: string;
  reason: string;
};

export type InvisibleWomanSideboardPackage = {
  id: string;
  name: string;
  label: string;
  matchups: string;
  identity: string;
  description: string;
  swapNote: string;
  cards: InvisibleWomanSideboardCard[];
};

/**
 * Commander does not use a tournament sideboard by default. These are pre-game
 * personality packages: choose one, swap a similar number of cards, then keep
 * the resulting 100-card deck legal for the table's agreed rules.
 */
export const invisibleWomanSideboardPackages: InvisibleWomanSideboardPackage[] = [
  {
    id: 'federation-tempo',
    name: 'Federation Tempo',
    label: 'Cantrip + selection',
    matchups: 'Fast pods, 1v1, combo-heavy tables',
    identity: 'Make every cheap spell replace itself while Invisible Woman builds the first Wall.',
    description: 'The cleanest Star Trek overlay. This package keeps mana low, finds the right answer, and turns pre-combat cantrips into both selection and board development.',
    swapNote: 'Swap out slow six-mana haymakers, expensive sorceries, and creatures that do not trigger or protect the engine.',
    cards: [
      { name: 'Anthropological Mission', role: 'Spell-flow engine', reason: 'Turns each noncreature spell into early selection and later clean draw.' },
      { name: 'Spock, Always Your Friend', role: 'Four-card selection', reason: 'Finds the missing payoff, protection spell, or cheap trigger.' },
      { name: 'Nyota Uhura, Communications', role: 'Pod-aware card flow', reason: 'Rewards reading the mana value your opponents are likely to cast.' },
      { name: 'Brainstorm', role: 'One-mana trigger', reason: 'Improves the top of the deck while triggering Invisible Woman before combat.' },
      { name: 'Consider', role: 'Instant-speed trigger', reason: 'Filters a card, fills the graveyard, and keeps interaction available.' },
      { name: 'Preordain', role: 'Setup cantrip', reason: 'Finds lands, protection, or the next engine without spending a full turn.' },
      { name: 'Caretaker’s Talent', role: 'Token card draw', reason: 'Pays the deck for creating the Walls it already wants to make.' },
      { name: 'Idol of Oblivion', role: 'Low-cost draw', reason: 'Turns a token turn into a card without adding another expensive spell.' },
    ],
  },
  {
    id: 'corbomite-control',
    name: 'Corbomite Control',
    label: 'Bluff + protection',
    matchups: 'Removal-heavy pods, control decks, must-answer combo',
    identity: 'Make the opponent’s best noncreature spell awkward while protecting the commander and token engine.',
    description: 'This is the personality for games where the table is waiting to remove Invisible Woman or sweep the Wall board. It leaves up mana and turns a defensive posture into political leverage.',
    swapNote: 'Swap out narrow creature payoffs and redundant Wall bodies for cheap stack interaction and protection that still triggers the commander.',
    cards: [
      { name: 'Brazen Bluff', role: 'Stack bluff', reason: 'Forces an opponent to choose between exiling their spell and giving you a free noncreature spell.' },
      { name: 'Slip Out the Back', role: 'Commander protection', reason: 'Phases out a key creature and adds a counter for one blue mana.' },
      { name: 'Dovin’s Veto', role: 'Unconditional protection', reason: 'Stops the noncreature spells most likely to dismantle the engine.' },
      { name: 'Swan Song', role: 'Efficient answer', reason: 'Trades one mana for a critical enchantment, instant, sorcery, or artifact.' },
      { name: 'An Offer You Can’t Refuse', role: 'Trigger + protection', reason: 'Protects your engine while leaving mana for an activation or second spell.' },
      { name: 'Heroic Intervention', role: 'Sweeper insurance', reason: 'Preserves the wide Wall and token board through a reset.' },
      { name: 'Clever Concealment', role: 'Precon protection', reason: 'Keep the existing team-wide protection as the package’s high-impact backup.' },
      { name: 'Propaganda', role: 'Combat tax', reason: 'Buys the time needed to keep mana open and win the stack exchange.' },
    ],
  },
  {
    id: 'historic-away-team',
    name: 'Historic Away Team',
    label: 'Artifacts + second draw',
    matchups: 'Long games, grindy pods, artifact-friendly tables',
    identity: 'Let every noncreature spell create value while historic permanents turn Wall mana into inevitability.',
    description: 'This is the slower Star Trek personality. It adds historic density, second-draw rewards, and threats that remain useful after the first Wall conversion is answered.',
    swapNote: 'Swap out the most disposable token-only cards and one-shot combat tricks for historic permanents that provide value before and after combat.',
    cards: [
      { name: 'The Vision', role: 'Historic bridge', reason: 'Chooses draw, indestructibility, or double strike from each noncreature spell.' },
      { name: 'Captain Jean-Luc Picard', role: 'Second-draw scaling', reason: 'Turns the cantrip lane into a growing attack threat.' },
      { name: 'U.S.S. Enterprise-D, Galaxy-Class', role: 'Historic finisher', reason: 'Gives surplus Wall mana a late-game Spacecraft outlet.' },
      { name: 'Reed Richards, Smartest Man', role: 'Top-deck value', reason: 'Rewards a list with enough artifacts, legends, and deliberate card selection.' },
      { name: 'Iron Lad, Young Avenger', role: 'Permanent selection', reason: 'Copies useful enters-the-battlefield effects from a dense value creature package.' },
      { name: 'Restoration Seminar', role: 'Long-game engine', reason: 'Turns a slower table into a resource contest the deck can keep winning.' },
      { name: 'Jeskai Ascendancy', role: 'Spell-chain payoff', reason: 'Turns cheap noncreature spells into filtering, pump, and mana smoothing.' },
      { name: 'Cryptolith Rite', role: 'Wall-to-mana bridge', reason: 'Makes a wide token board cast historic threats and multiple spells in one turn.' },
    ],
  },
  {
    id: 'wall-breaker',
    name: 'Wall Breaker',
    label: 'Toughness + lethal combat',
    matchups: 'Creature pods, stalled boards, combat-oriented tables',
    identity: 'Stop playing defense once the board is wide: make toughness, tokens, and mana convert into lethal pressure.',
    description: 'The original Fantastic Four identity, sharpened. This package is for tables where the fastest route to victory is not another counterspell but a high-toughness board that attacks through the ground.',
    swapNote: 'Swap out the slowest selection cards and reactive spells when opponents are presenting creatures rather than stack threats.',
    cards: [
      { name: 'High Alert', role: 'Wall conversion', reason: 'Lets the defensive board attack using toughness.' },
      { name: 'Assault Formation', role: 'Redundant conversion', reason: 'Adds a second toughness-matters engine and a mana sink.' },
      { name: 'Arcades, the Strategist', role: 'Alternate Wall payoff', reason: 'Makes defenders replace themselves and turns the package into a real combat deck.' },
      { name: 'Axebane Guardian', role: 'Defender mana', reason: 'Converts a cluster of Walls into the colored mana for a finishing turn.' },
      { name: 'Tower Defense', role: 'Lethal combat trick', reason: 'Turns a wide high-toughness board into a sudden damage event.' },
      { name: 'Impact Tremors', role: 'Noncombat finisher', reason: 'Keeps token production relevant when combat is blocked or unsafe.' },
      { name: 'Shark Typhoon', role: 'Evasive token engine', reason: 'Adds flying threats so the deck is not dependent on ground combat.' },
      { name: 'Second Harvest', role: 'Burst multiplier', reason: 'Copies the board at instant speed after the Wall engine is established.' },
    ],
  },
];
