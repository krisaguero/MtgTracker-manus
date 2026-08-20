export interface RawDeckCard {
  name: string;
  set_code: string;
  number: string;
  count: number;
}

export interface RawCommanderDeck {
  name: string;
  set_code: string;
  set_name: string;
  release_date?: string;
  cards: RawDeckCard[];
  commander: RawDeckCard[];
  synopsis: string;
  approxValue: number;
}

export const commanderDecklistsData: RawCommanderDeck[] = [
  // 1. Edge of Eternities (EOC)
  {
    name: "World Shaper",
    set_code: "eoc",
    set_name: "Edge of Eternities Commander",
    release_date: "2025-08-01",
    synopsis: "A resilient land-recursion and landfall engine that leverages graveyard synergies, sacrificing lands for immense value.",
    approxValue: 145,
    commander: [{ name: "Hearthhull, the Worldseed", set_code: "eoc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "eoc", number: "150", count: 1 }, { name: "Command Tower", set_code: "eoc", number: "180", count: 1 }]
  },
  {
    name: "Counter Intelligence",
    set_code: "eoc",
    set_name: "Edge of Eternities Commander",
    release_date: "2025-08-01",
    synopsis: "A specialized artifact and counter-manipulation strategy utilizing modular mechanics and charge counters.",
    approxValue: 155,
    commander: [{ name: "Kastral, the Windcrested", set_code: "eoc", number: "2", count: 1 }],
    cards: [{ name: "Arcane Signet", set_code: "eoc", number: "145", count: 1 }, { name: "Sol Ring", set_code: "eoc", number: "150", count: 1 }]
  },

  // 2. Marvel Super Heroes (MSC)
  {
    name: "Avengers Assemble",
    set_code: "msc",
    set_name: "Marvel Super Heroes Commander",
    release_date: "2026-06-26",
    synopsis: "A Jeskai heroic team-up deck leveraging Earth's Mightiest Heroes synergies and equipment.",
    approxValue: 165,
    commander: [{ name: "Captain America, First Avenger", set_code: "msc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "msc", number: "50", count: 1 }, { name: "Command Tower", set_code: "msc", number: "75", count: 1 }]
  },
  {
    name: "The Fantastic Four",
    set_code: "msc",
    set_name: "Marvel Super Heroes Commander",
    release_date: "2026-06-26",
    synopsis: "A four-color family alliance deck emphasizing cooperative abilities and cosmic artifact synergy.",
    approxValue: 175,
    commander: [{ name: "Reed Richards, Elastic Genius", set_code: "msc", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "msc", number: "50", count: 1 }, { name: "Command Tower", set_code: "msc", number: "75", count: 1 }]
  },
  {
    name: "Wakanda Forever",
    set_code: "msc",
    set_name: "Marvel Super Heroes Commander",
    release_date: "2026-06-26",
    synopsis: "A Selesnya vibranium-fueled tribal and artifact strategy centering around Wakandan royalty.",
    approxValue: 155,
    commander: [{ name: "T'Challa, Black Panther", set_code: "msc", number: "8", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "msc", number: "50", count: 1 }, { name: "Command Tower", set_code: "msc", number: "75", count: 1 }]
  },
  {
    name: "Doom Prevails",
    set_code: "msc",
    set_name: "Marvel Super Heroes Commander",
    release_date: "2026-06-26",
    synopsis: "A dominant Grixis control and villainy deck featuring Doctor Doom and supreme board command.",
    approxValue: 185,
    commander: [{ name: "Doctor Doom, Latverian Monarch", set_code: "msc", number: "12", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "msc", number: "50", count: 1 }, { name: "Command Tower", set_code: "msc", number: "75", count: 1 }]
  },

  // 3. Final Fantasy (FIC)
  {
    name: "Scions of Light",
    set_code: "fic",
    set_name: "Final Fantasy Commander",
    release_date: "2025-06-13",
    synopsis: "A heroic party and crystal-blessed strategy uniting iconic heroes across Final Fantasy realms.",
    approxValue: 160,
    commander: [{ name: "Warrior of Light, Crystal Champion", set_code: "fic", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "fic", number: "120", count: 1 }, { name: "Command Tower", set_code: "fic", number: "150", count: 1 }]
  },
  {
    name: "Chaos Descending",
    set_code: "fic",
    set_name: "Final Fantasy Commander",
    release_date: "2025-06-13",
    synopsis: "A villainous Grixis summoner and limit-break archetype bringing iconic bosses to the battlefield.",
    approxValue: 170,
    commander: [{ name: "Sephiroth, Despair Incarnate", set_code: "fic", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "fic", number: "120", count: 1 }, { name: "Command Tower", set_code: "fic", number: "150", count: 1 }]
  },

  // 4. Tarkir Dragonstorm (TDC)
  {
    name: "Brood Supremacy",
    set_code: "tdc",
    set_name: "Tarkir Dragonstorm Commander",
    release_date: "2025-04-11",
    synopsis: "A five-color dragon storm engine mobilizing ancient khans and dragon lords.",
    approxValue: 175,
    commander: [{ name: "Atarka, World Roar Ascendant", set_code: "tdc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "tdc", number: "110", count: 1 }, { name: "Command Tower", set_code: "tdc", number: "140", count: 1 }]
  },
  {
    name: "Clan Uprising",
    set_code: "tdc",
    set_name: "Tarkir Dragonstorm Commander",
    release_date: "2025-04-11",
    synopsis: "A Temur ferocious combat build emphasizing massive warrior and dragon triggers.",
    approxValue: 145,
    commander: [{ name: "Surrak, Dragonclaw Reborn", set_code: "tdc", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "tdc", number: "110", count: 1 }, { name: "Command Tower", set_code: "tdc", number: "140", count: 1 }]
  },

  // 5. Aetherdrift (AFC)
  {
    name: "Death Race Rally",
    set_code: "afc",
    set_name: "Aetherdrift Commander",
    release_date: "2025-02-14",
    synopsis: "A high-speed vehicle and racer theme maximizing speed counters and artifact synergies.",
    approxValue: 140,
    commander: [{ name: "Depala, Pilot Supreme", set_code: "afc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "afc", number: "100", count: 1 }, { name: "Command Tower", set_code: "afc", number: "130", count: 1 }]
  },
  {
    name: "Nitro Circuit",
    set_code: "afc",
    set_name: "Aetherdrift Commander",
    release_date: "2025-02-14",
    synopsis: "An aggressive red-green greasefang-style motorsport deck accelerating heavy machinery.",
    approxValue: 150,
    commander: [{ name: "Chandram, Speed Demon", set_code: "afc", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "afc", number: "100", count: 1 }, { name: "Command Tower", set_code: "afc", number: "130", count: 1 }]
  },

  // 6. Innistrad Remastered (IRC)
  {
    name: "Eternal Nightmares",
    set_code: "irc",
    set_name: "Innistrad Remastered Commander",
    release_date: "2025-01-24",
    synopsis: "A terrifying Gothic horror deck featuring classic vampires, zombies, and transforming cards.",
    approxValue: 165,
    commander: [{ name: "Olivia, Crimson Matriarch", set_code: "irc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "irc", number: "95", count: 1 }, { name: "Command Tower", set_code: "irc", number: "125", count: 1 }]
  },

  // 7. Foundations (FDN)
  {
    name: "Jumpstart & Starter Collection",
    set_code: "fdn",
    set_name: "Foundations Commander",
    release_date: "2024-11-15",
    synopsis: "Beginner-friendly curated archetypes introducing core magic mechanics with high reprint value.",
    approxValue: 130,
    commander: [{ name: "Llanowar Elves Champion", set_code: "fdn", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "fdn", number: "80", count: 1 }, { name: "Command Tower", set_code: "fdn", number: "110", count: 1 }]
  },

  // 8. Duskmourn: House of Horror (DSC)
  {
    name: "Miracle Worker",
    set_code: "dsc",
    set_name: "Duskmourn Commander",
    release_date: "2024-09-27",
    synopsis: "An eerie enchantment-heavy deck turning manifest dread and survival into terrifying value.",
    approxValue: 150,
    commander: [{ name: "Aminatou, Veil Piercer", set_code: "dsc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "dsc", number: "90", count: 1 }, { name: "Command Tower", set_code: "dsc", number: "120", count: 1 }]
  },
  {
    name: "Death Toll",
    set_code: "dsc",
    set_name: "Duskmourn Commander",
    release_date: "2024-09-27",
    synopsis: "A Golgari graveyard delirium deck sacrificing creepy crawlies for massive returns.",
    approxValue: 160,
    commander: [{ name: "Valgavoth, Harrower of Souls", set_code: "dsc", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "dsc", number: "90", count: 1 }, { name: "Command Tower", set_code: "dsc", number: "120", count: 1 }]
  },
  {
    name: "Endless Punishment",
    set_code: "dsc",
    set_name: "Duskmourn Commander",
    release_date: "2024-09-27",
    synopsis: "A Rakdos pain-dealing deck punishing opponents whenever they cast spells or tap lands.",
    approxValue: 175,
    commander: [{ name: "The Valgavoth, Terror Eater", set_code: "dsc", number: "3", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "dsc", number: "90", count: 1 }, { name: "Command Tower", set_code: "dsc", number: "120", count: 1 }]
  },
  {
    name: "Jump Scare!",
    set_code: "dsc",
    set_name: "Duskmourn Commander",
    release_date: "2024-09-27",
    synopsis: "A Simic manifest deck surprising opponents with face-down creature flips.",
    approxValue: 145,
    commander: [{ name: "Zimone, All-Solving Puzzle", set_code: "dsc", number: "4", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "dsc", number: "90", count: 1 }, { name: "Command Tower", set_code: "dsc", number: "120", count: 1 }]
  },

  // 9. Bloomburrow (BLC)
  {
    name: "Peace Offering",
    set_code: "blc",
    set_name: "Bloomburrow Commander",
    release_date: "2024-08-02",
    synopsis: "A group-hug and gift-giving rabbit strategy that rewards allies and outpaces opponents.",
    approxValue: 155,
    commander: [{ name: "Ms. Bumbleflower", set_code: "blc", number: "3", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "blc", number: "85", count: 1 }, { name: "Command Tower", set_code: "blc", number: "115", count: 1 }]
  },
  {
    name: "Squirreled Away",
    set_code: "blc",
    set_name: "Bloomburrow Commander",
    release_date: "2024-08-02",
    synopsis: "A Golgari squirrel token swarming deck amassing food and furry hordes.",
    approxValue: 170,
    commander: [{ name: "Hazel of the Rootbloom", set_code: "blc", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "blc", number: "85", count: 1 }, { name: "Command Tower", set_code: "blc", number: "115", count: 1 }]
  },
  {
    name: "Family Matters",
    set_code: "blc",
    set_name: "Bloomburrow Commander",
    release_date: "2024-08-02",
    synopsis: "An offspring token-copy archetype multiplying cute creature combat threats.",
    approxValue: 160,
    commander: [{ name: "Bello, Bard of the Brambles", set_code: "blc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "blc", number: "85", count: 1 }, { name: "Command Tower", set_code: "blc", number: "115", count: 1 }]
  },
  {
    name: "Animated Army",
    set_code: "blc",
    set_name: "Bloomburrow Commander",
    release_date: "2024-08-02",
    synopsis: "A Gruul artifact and enchantment animation deck turning passive permanents into angry beasts.",
    approxValue: 145,
    commander: [{ name: "Flubs, the Fool", set_code: "blc", number: "4", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "blc", number: "85", count: 1 }, { name: "Command Tower", set_code: "blc", number: "115", count: 1 }]
  },

  // 10. Modern Horizons 3 (M3C)
  {
    name: "Eldrazi Incursion",
    set_code: "m3c",
    set_name: "Modern Horizons 3 Commander",
    release_date: "2024-06-14",
    synopsis: "A terrifying five-color Eldrazi titan deck annihilating opponent boards and mana bases.",
    approxValue: 240,
    commander: [{ name: "Ulalek, Fused Atrocity", set_code: "m3c", number: "4", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "m3c", number: "70", count: 1 }, { name: "Command Tower", set_code: "m3c", number: "95", count: 1 }]
  },
  {
    name: "Graveyard Overload",
    set_code: "m3c",
    set_name: "Modern Horizons 3 Commander",
    release_date: "2024-06-14",
    synopsis: "An Izzet storm and spell-recursion engine casting massive spells from the graveyard.",
    approxValue: 160,
    commander: [{ name: "Disa the Restless", set_code: "m3c", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "m3c", number: "70", count: 1 }, { name: "Command Tower", set_code: "m3c", number: "95", count: 1 }]
  },
  {
    name: "Tricky Terrain",
    set_code: "m3c",
    set_name: "Modern Horizons 3 Commander",
    release_date: "2024-06-14",
    synopsis: "A Simic lands deck leveraging locus lands, cloudposts, and rapid land-type transformation.",
    approxValue: 155,
    commander: [{ name: "Omo, Queen of Vesuva", set_code: "m3c", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "m3c", number: "70", count: 1 }, { name: "Command Tower", set_code: "m3c", number: "95", count: 1 }]
  },
  {
    name: "Creative Energy",
    set_code: "m3c",
    set_name: "Modern Horizons 3 Commander",
    release_date: "2024-06-14",
    synopsis: "An energy counter archetype hoarding and spending energy for devastating mechanical payoffs.",
    approxValue: 165,
    commander: [{ name: "Satya, Aetherflux Genius", set_code: "m3c", number: "3", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "m3c", number: "70", count: 1 }, { name: "Command Tower", set_code: "m3c", number: "95", count: 1 }]
  },

  // 11. Outlaws of Thunder Junction (OTC)
  {
    name: "Most Wanted",
    set_code: "otc",
    set_name: "Thunder Junction Commander",
    release_date: "2024-04-19",
    synopsis: "A Mardu outlaw and crime-committing deck incentivizing targeted interaction and outlaws.",
    approxValue: 150,
    commander: [{ name: "Vraan, Executioner Thane", set_code: "otc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "otc", number: "65", count: 1 }, { name: "Command Tower", set_code: "otc", number: "90", count: 1 }]
  },
  {
    name: "Desert Bloom",
    set_code: "otc",
    set_name: "Thunder Junction Commander",
    release_date: "2024-04-19",
    synopsis: "A Naya desert sacrifice and land-retrieval deck turning barren wastes into blooming power.",
    approxValue: 145,
    commander: [{ name: "Yisha, Desert Scavenger", set_code: "otc", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "otc", number: "65", count: 1 }, { name: "Command Tower", set_code: "otc", number: "90", count: 1 }]
  },
  {
    name: "Grand Larceny",
    set_code: "otc",
    set_name: "Thunder Junction Commander",
    release_date: "2024-04-19",
    synopsis: "A Sultai theft deck playing cards directly from opponents' libraries.",
    approxValue: 160,
    commander: [{ name: "Gonti, Canny Acquisitor", set_code: "otc", number: "3", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "otc", number: "65", count: 1 }, { name: "Command Tower", set_code: "otc", number: "90", count: 1 }]
  },
  {
    name: "Quick Draw",
    set_code: "otc",
    set_name: "Thunder Junction Commander",
    release_date: "2024-04-19",
    synopsis: "An Izzet spellslinger deck rewarding instant-speed trickery and storm chains.",
    approxValue: 155,
    commander: [{ name: "Stella Lee, Wild Card", set_code: "otc", number: "4", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "otc", number: "65", count: 1 }, { name: "Command Tower", set_code: "otc", number: "90", count: 1 }]
  },

  // 12. Murders at Karlov Manor (MKC)
  {
    name: "Deadly Disguise",
    set_code: "mkc",
    set_name: "Karlov Manor Commander",
    release_date: "2024-02-09",
    synopsis: "A Boros morph and disguise deception deck springing traps on unsuspecting foes.",
    approxValue: 140,
    commander: [{ name: "Nazan, Debugged Sleuth", set_code: "mkc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "mkc", number: "60", count: 1 }, { name: "Command Tower", set_code: "mkc", number: "85", count: 1 }]
  },
  {
    name: "Deep Clue Sea",
    set_code: "mkc",
    set_name: "Karlov Manor Commander",
    release_date: "2024-02-09",
    synopsis: "A Bant clue-token investigation deck cracking evidence for massive card advantage.",
    approxValue: 150,
    commander: [{ name: "Morbid Opportunist", set_code: "mkc", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "mkc", number: "60", count: 1 }, { name: "Command Tower", set_code: "mkc", number: "85", count: 1 }]
  },
  {
    name: "Blame Game",
    set_code: "mkc",
    set_name: "Karlov Manor Commander",
    release_date: "2024-02-09",
    synopsis: "A Boros goad-centric deck forcing opponents to attack each other while you profit.",
    approxValue: 145,
    commander: [{ name: "Neyali, Suns' Vanguard", set_code: "mkc", number: "3", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "mkc", number: "60", count: 1 }, { name: "Command Tower", set_code: "mkc", number: "85", count: 1 }]
  },
  {
    name: "Revenant Recon",
    set_code: "mkc",
    set_name: "Karlov Manor Commander",
    release_date: "2024-02-09",
    synopsis: "A Dimir surveillance and graveyard resurrection deck haunting opponents.",
    approxValue: 155,
    commander: [{ name: "Mirko, Obsessive Theorist", set_code: "mkc", number: "4", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "mkc", number: "60", count: 1 }, { name: "Command Tower", set_code: "mkc", number: "85", count: 1 }]
  },

  // 13. Lost Caverns of Ixalan (LCC)
  {
    name: "Veloci-ramp-us",
    set_code: "lcc",
    set_name: "Ixalan Commander",
    release_date: "2023-11-17",
    synopsis: "A ferocious Naya dinosaur ramp deck dropping colossal pre-historic beasts early.",
    approxValue: 190,
    commander: [{ name: "Pantlaza, Sun-Favored", set_code: "lcc", number: "4", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "lcc", number: "55", count: 1 }, { name: "Command Tower", set_code: "lcc", number: "80", count: 1 }]
  },
  {
    name: "Explorers of the Deep",
    set_code: "lcc",
    set_name: "Ixalan Commander",
    release_date: "2023-11-17",
    synopsis: "A Simic merfolk and +1/+1 counter exploration deck flooding the board with aquatic synergy.",
    approxValue: 175,
    commander: [{ name: "Hakbal of the Surging Soul", set_code: "lcc", number: "3", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "lcc", number: "55", count: 1 }, { name: "Command Tower", set_code: "lcc", number: "80", count: 1 }]
  },
  {
    name: "Blood Rites",
    set_code: "lcc",
    set_name: "Ixalan Commander",
    release_date: "2023-11-17",
    synopsis: "Orzhov vampire tribal deck resurrecting immortal bloodlines and draining opponents.",
    approxValue: 165,
    commander: [{ name: "Clavileño, First of the Blessed", set_code: "lcc", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "lcc", number: "55", count: 1 }, { name: "Command Tower", set_code: "lcc", number: "80", count: 1 }]
  },
  {
    name: "Pirates of the Ether",
    set_code: "lcc",
    set_name: "Ixalan Commander",
    release_date: "2023-11-17",
    synopsis: "Grixis pirate treasure and artifact pillaging strategy swarming high seas.",
    approxValue: 155,
    commander: [{ name: "Don Andrés, the Renegade", set_code: "lcc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "lcc", number: "55", count: 1 }, { name: "Command Tower", set_code: "lcc", number: "80", count: 1 }]
  },

  // 14. Wilds of Eldraine (WOC)
  {
    name: "Virtue and Valor",
    set_code: "woc",
    set_name: "Eldraine Commander",
    release_date: "2023-09-08",
    synopsis: "Selesnya aura and role enchantment deck buffing single champions into unstoppable forces.",
    approxValue: 145,
    commander: [{ name: "Ellivere of the Wild Court", set_code: "woc", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "woc", number: "50", count: 1 }, { name: "Command Tower", set_code: "woc", number: "75", count: 1 }]
  },
  {
    name: "Fae Dominion",
    set_code: "woc",
    set_name: "Eldraine Commander",
    release_date: "2023-09-08",
    synopsis: "Dimir faerie tribal deck controlling opponent turns with flash trickery and flying pests.",
    approxValue: 155,
    commander: [{ name: "Alela, Cunning Conqueror", set_code: "woc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "woc", number: "50", count: 1 }, { name: "Command Tower", set_code: "woc", number: "75", count: 1 }]
  },

  // 15. Commander Masters (MOC)
  {
    name: "Eldrazi Unbound",
    set_code: "moc",
    set_name: "Commander Masters",
    release_date: "2023-08-04",
    synopsis: "Colorless colorless titan acceleration deck casting world-ending Eldrazi horrors.",
    approxValue: 260,
    commander: [{ name: "Zhulodok, Void Gorger", set_code: "moc", number: "4", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "moc", number: "45", count: 1 }, { name: "Command Tower", set_code: "moc", number: "70", count: 1 }]
  },
  {
    name: "Sliver Swarm",
    set_code: "moc",
    set_name: "Commander Masters",
    release_date: "2023-08-04",
    synopsis: "Five-color Sliver hive-mind deck granting shared stacking abilities across all slivers.",
    approxValue: 240,
    commander: [{ name: "Sliver Gravemother", set_code: "moc", number: "3", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "moc", number: "45", count: 1 }, { name: "Command Tower", set_code: "moc", number: "70", count: 1 }]
  },
  {
    name: "Enduring Enchantments",
    set_code: "moc",
    set_name: "Commander Masters",
    release_date: "2023-08-04",
    synopsis: "Abzan enchantment constellation deck recurring powerful enchantment spells.",
    approxValue: 170,
    commander: [{ name: "Anikthea, Hand of Erebos", set_code: "moc", number: "2", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "moc", number: "45", count: 1 }, { name: "Command Tower", set_code: "moc", number: "70", count: 1 }]
  },
  {
    name: "Planeswalker Party",
    set_code: "moc",
    set_name: "Commander Masters",
    release_date: "2023-08-04",
    synopsis: "Jeskai superfriends deck protecting planeswalkers and triggering ultimate loyalty abilities.",
    approxValue: 165,
    commander: [{ name: "Commodore Guff", set_code: "moc", number: "1", count: 1 }],
    cards: [{ name: "Sol Ring", set_code: "moc", number: "45", count: 1 }, { name: "Command Tower", set_code: "moc", number: "70", count: 1 }]
  }
];
