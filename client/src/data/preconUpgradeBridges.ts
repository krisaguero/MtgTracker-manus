export interface PreconUpgradeBridgeCard {
  name: string;
  role: string;
  budgetTier: 'budget' | 'mid' | 'premium';
}

export interface PreconUpgradeBridge {
  id: string;
  targetDeck: string;
  targetSetCode: string;
  lane: string;
  headline: string;
  description: string;
  sourceDecks: string[];
  cards: PreconUpgradeBridgeCard[];
  transferRule: string;
  edhrecUrl: string;
}

/**
 * Curated bridges are intentionally separate from EDHREC's deck pages: they
 * express how a card can move between the user's precon ecosystem. Ownership
 * is resolved at render time against the local ManaBox layer.
 */
export const preconUpgradeBridges: PreconUpgradeBridge[] = [
  {
    id: 'msc-invisible-woman-spells-to-bodies', targetDeck: 'The Fantastic Four', targetSetCode: 'msc', lane: 'Spellslinger tokens',
    headline: 'Turn cheap interaction into a board',
    description: 'Invisible Woman wants every noncreature spell to do two jobs. Pull low-cost protection and token payoffs from other blue, red, or white shells before buying premium doublers.',
    sourceDecks: ['The Fantastic Four', 'Peace Offering', 'Breed Lethality', 'Stalwart Unity'],
    cards: [
      { name: 'An Offer You Can’t Refuse', role: 'One-mana protection that also triggers Invisible Woman', budgetTier: 'budget' },
      { name: 'Third Path Iconoclast', role: 'Turns ordinary noncreature spells into artifact bodies', budgetTier: 'budget' },
      { name: 'Storm-Kiln Artist', role: 'Converts spell velocity into Treasures for multi-spell turns', budgetTier: 'mid' },
      { name: 'Shark Typhoon', role: 'Provides cycling-triggered and permanent evasive token output', budgetTier: 'premium' },
    ],
    transferRule: 'Only mark as transferable after the full ManaBox export confirms an unreserved copy in the source pool.',
    edhrecUrl: 'https://edhrec.com/precons/the-fantastic-four/invisible-woman',
  },
  {
    id: 'msc-invisible-woman-wall-conversion', targetDeck: 'The Fantastic Four', targetSetCode: 'msc', lane: 'Wall conversion',
    headline: 'Make the defensive shell a win condition',
    description: 'Borrow the toughness-matters package from Abzan Armor or other defensive builds. These cards give Invisible Woman a second route to lethal combat when flying tokens are not enough.',
    sourceDecks: ['The Fantastic Four', 'Abzan Armor', 'Explorers of the Deep'],
    cards: [
      { name: 'High Alert', role: 'Lets high-toughness creatures attack as power', budgetTier: 'budget' },
      { name: 'Assault Formation', role: 'Redundant toughness combat payoff with an activated pump mode', budgetTier: 'budget' },
      { name: 'Axebane Guardian', role: 'Turns a Wall board into colored mana', budgetTier: 'budget' },
      { name: 'Impact Tremors', role: 'Makes every new token advance the damage plan', budgetTier: 'budget' },
    ],
    transferRule: 'Prioritize copies not needed by Abzan Armor’s active toughness package; otherwise classify the card as conditional transfer.',
    edhrecUrl: 'https://edhrec.com/precons/the-fantastic-four/invisible-woman',
  },
  {
    id: 'most-wanted-treasure-engine', targetDeck: 'Most Wanted', targetSetCode: 'otc', lane: 'Treasure and sacrifice',
    headline: 'Consolidate the Mardu engine',
    description: 'Most Wanted is a natural recipient for spare Treasure, sacrifice, and death-trigger cards from other Mardu or artifact-token decks. This bridge raises the deck’s floor without abandoning its Outlaw identity.',
    sourceDecks: ['Most Wanted', 'The Fantastic Four', 'Food and Fellowship'],
    cards: [
      { name: 'Academy Manufactor', role: 'Multiplies Food, Clue, and Treasure production', budgetTier: 'premium' },
      { name: 'Impact Tremors', role: 'Converts token production into reach', budgetTier: 'budget' },
      { name: 'Skullclamp', role: 'Turns expendable tokens into cards', budgetTier: 'mid' },
      { name: 'Professional Face-Breaker', role: 'Transforms attacks into Treasures and impulse draw', budgetTier: 'mid' },
    ],
    transferRule: 'Reserve one copy for the strongest token engine first; do not count a card as free merely because it is present in another deck list.',
    edhrecUrl: 'https://edhrec.com/precon/most-wanted',
  },
  {
    id: 'breed-lethality-counter-core', targetDeck: 'Breed Lethality', targetSetCode: 'c16', lane: 'Counters and proliferate',
    headline: 'Use the existing four-color mana to support every counter deck',
    description: 'Atraxa can act as the collection’s reusable counter package. Cards that are redundant in a second counters shell can become high-value transfers, while premium proliferate pieces should remain shared only by plan.',
    sourceDecks: ['Breed Lethality', 'Peace Offering', 'Abzan Armor'],
    cards: [
      { name: 'Evolution Sage', role: 'Turns land drops into proliferate', budgetTier: 'budget' },
      { name: 'Winding Constrictor', role: 'Amplifies +1/+1 counters', budgetTier: 'budget' },
      { name: 'Fertilid', role: 'Converts counters into basic-land ramp', budgetTier: 'budget' },
      { name: 'The Ozolith', role: 'Preserves counters through creature removal', budgetTier: 'mid' },
    ],
    transferRule: 'Transfer only surplus copies or cards from a deliberately parked counters list; the engine is too concentrated to strip blindly.',
    edhrecUrl: 'https://edhrec.com/precon/breed-lethality',
  },
  {
    id: 'simic-explorers-draw-engine', targetDeck: 'Explorers of the Deep', targetSetCode: 'lcc', lane: 'Simic tribal velocity',
    headline: 'Fill the Simic gap with cards that scale across decks',
    description: 'Explorers of the Deep benefits from a compact Merfolk core plus reusable Simic draw and counter engines. This is a good place to route cards that do not fit the Fantastic Four’s four-color spell plan.',
    sourceDecks: ['Explorers of the Deep', 'Peace Offering', 'The Fantastic Four'],
    cards: [
      { name: 'Deeproot Pilgrimage', role: 'Rewards tapped Merfolk with a steady token stream', budgetTier: 'mid' },
      { name: 'Herald’s Horn', role: 'Tribal cost reduction and card selection', budgetTier: 'mid' },
      { name: 'Kumena, Tyrant of Orazca', role: 'Alternate Merfolk commander and tap payoff', budgetTier: 'budget' },
      { name: 'Roaming Throne', role: 'Doubles a chosen creature type’s triggered abilities', budgetTier: 'premium' },
    ],
    transferRule: 'Keep one copy of each core Merfolk payoff in the active deck; only extra copies become unconditional transfer candidates.',
    edhrecUrl: 'https://edhrec.com/precon/explorers-of-the-deep',
  },
];

export function getPreconUpgradeBridges(setCode: string, deckName: string): PreconUpgradeBridge[] {
  const normalizedSet = setCode.toLowerCase();
  const normalizedName = deckName.trim().toLowerCase();
  return preconUpgradeBridges.filter(bridge => bridge.targetSetCode.toLowerCase() === normalizedSet && bridge.targetDeck.toLowerCase() === normalizedName);
}
