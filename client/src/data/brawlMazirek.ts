export type BrawlDeckVersion = 'baseline' | 'optimized';

export interface BrawlDeckSection {
  label: string;
  cards: string[];
}

export interface BrawlDeckVersionData {
  label: string;
  description: string;
  sections: BrawlDeckSection[];
}

export const brawlMazirekDeck = {
  name: 'Mazirek, Kraul Death Priest — Commander 60',
  slug: 'mazirek-commander-60',
  commander: 'Mazirek, Kraul Death Priest',
  colors: 'Golgari · black / green',
  formatNote: 'Brawl-style 60-card singleton construction; not a claim of current Standard Brawl legality.',
  versions: {
    baseline: {
      label: 'Baseline conversion',
      description: 'A strict 60-card trim from the original Commander pool, preserving the sacrifice shell while removing the slowest backup plans.',
      sections: [
        { label: 'Token engines & sacrifice outlets', cards: ['Viscera Feeder', 'Catacomb Sifter', 'Awakening Zone', 'From Beyond', 'Brood Monitor', 'Eyeless Watcher', 'Blisterpod', 'Call the Scions', 'Spawning Bed', 'Swiftfoot Boots'] },
        { label: 'Counters & combat payoffs', cards: ['Corpsejack Menace', 'Ivy Lane Denizen', 'Tuskguard Captain', 'Mer-Ek Nightblade', 'Longshot Squad', 'Rancor', 'Fruit of the First Tree'] },
        { label: 'Graveyard recursion & spells', cards: ['Zombify', 'Rise from the Grave', 'Necromantic Summons', 'Putrefy', 'Murder', "Kodama's Reach"] },
        { label: 'Lands & mana', cards: ['Golgari Guildgate', 'Jungle Hollow', 'Llanowar Wastes', 'Evolving Wilds', 'Terramorphic Expanse', 'Myriad Landscape', 'Mortuary Mire', 'Barren Moor', 'Grim Backwoods', ...Array(14).fill('Forest'), ...Array(13).fill('Swamp')] },
      ],
    },
    optimized: {
      label: 'Optimized upgrade path',
      description: 'A lower-curve version that trades expensive haymakers for sacrifice-enabled ramp, tutors, reanimation, and a stronger Living Death finish.',
      sections: [
        { label: 'Sacrifice outlets & fast token engines', cards: ['Viscera Feeder', 'Sakura-Tribe Elder', 'Catacomb Sifter', 'Awakening Zone', 'From Beyond', 'Brood Monitor', 'Eyeless Watcher', 'Blisterpod', 'Call the Scions', 'Spawning Bed', 'Swiftfoot Boots'] },
        { label: 'Counter multipliers & combat evasion', cards: ['Corpsejack Menace', 'Ivy Lane Denizen', 'Tuskguard Captain', 'Mer-Ek Nightblade', 'Longshot Squad', 'Disciple of Bolas', 'Rancor'] },
        { label: 'Tutors, reanimation & interaction', cards: ['Animate Dead', 'Dance of the Dead', 'Exhume', 'Dread Return', 'Stitch Together', 'Sidisi, Undead Vizier', 'Living Death', 'Jarad, Golgari Lich Lord', 'Putrefy', 'Tragic Slip', 'Murder', 'Grisly Salvage', 'Buried Alive'] },
        { label: 'Lands & mana', cards: ['Llanowar Elves', 'Elves of Deep Shadow', "Kodama's Reach", 'Llanowar Wastes', 'Golgari Guildgate', 'Jungle Hollow', 'Evolving Wilds', 'Terramorphic Expanse', 'Myriad Landscape', 'Mortuary Mire', 'Barren Moor', 'Grim Backwoods', ...Array(9).fill('Forest'), ...Array(7).fill('Swamp')] },
      ],
    },
  } satisfies Record<BrawlDeckVersion, BrawlDeckVersionData>,
} as const;

export function flattenBrawlDeck(version: BrawlDeckVersion) {
  const sections = brawlMazirekDeck.versions[version].sections;
  return [brawlMazirekDeck.commander, ...sections.flatMap((section) => section.cards)];
}

export function countBrawlDeck(version: BrawlDeckVersion) {
  return flattenBrawlDeck(version).length;
}
