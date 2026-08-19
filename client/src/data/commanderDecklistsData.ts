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
  {
    name: "World Shaper",
    set_code: "eoc",
    set_name: "Edge of Eternities Commander",
    release_date: "2025-08-01",
    synopsis: "A resilient land-recursion and landfall engine that leverages graveyard synergies, sacrificing lands for immense value and board dominance.",
    approxValue: 145,
    commander: [{ name: "Hearthhull, the Worldseed", set_code: "eoc", number: "1", count: 1 }],
    cards: [
      { name: "Szarel, Genesis Shepherd", set_code: "eoc", number: "4", count: 1 },
      { name: "Eumidian Wastewaker", set_code: "eoc", number: "8", count: 1 },
      { name: "Evendo Brushrazer", set_code: "eoc", number: "10", count: 1 },
      { name: "Baloth Prime", set_code: "eoc", number: "13", count: 1 },
      { name: "Horizon Explorer", set_code: "eoc", number: "15", count: 1 },
      { name: "Scouring Swarm", set_code: "eoc", number: "16", count: 1 },
      { name: "Braids, Arisen Nightmare", set_code: "eoc", number: "82", count: 1 },
      { name: "God-Eternal Bontu", set_code: "eoc", number: "83", count: 1 },
      { name: "Moraug, Fury of Akoum", set_code: "eoc", number: "89", count: 1 },
      { name: "Sol Ring", set_code: "eoc", number: "150", count: 1 },
      { name: "Command Tower", set_code: "eoc", number: "180", count: 1 }
    ]
  },
  {
    name: "Counter Intelligence",
    set_code: "eoc",
    set_name: "Edge of Eternities Commander",
    release_date: "2025-08-01",
    synopsis: "A specialized artifact and counter-manipulation strategy utilizing modular mechanics, charge counters, and explosive artifact creature output.",
    approxValue: 155,
    commander: [{ name: "Kastral, the Windcrested", set_code: "eoc", number: "2", count: 1 }],
    cards: [
      { name: "Arcane Signet", set_code: "eoc", number: "145", count: 1 },
      { name: "Sol Ring", set_code: "eoc", number: "150", count: 1 },
      { name: "Command Tower", set_code: "eoc", number: "180", count: 1 }
    ]
  },
  {
    name: "Avengers Assemble",
    set_code: "msc",
    set_name: "Marvel Super Heroes Commander",
    release_date: "2026-06-26",
    synopsis: "A Jeskai heroic team-up deck leveraging powerful Earth's Mightiest Heroes synergies, artifact equipment, and explosive combat triggers.",
    approxValue: 165,
    commander: [{ name: "Captain America, First Avenger", set_code: "msc", number: "1", count: 1 }],
    cards: [
      { name: "Iron Man, Armored Avenger", set_code: "msc", number: "3", count: 1 },
      { name: "Thor, God of Thunder", set_code: "msc", number: "5", count: 1 },
      { name: "Arcane Signet", set_code: "msc", number: "45", count: 1 },
      { name: "Sol Ring", set_code: "msc", number: "50", count: 1 },
      { name: "Command Tower", set_code: "msc", number: "75", count: 1 }
    ]
  },
  {
    name: "The Fantastic Four",
    set_code: "msc",
    set_name: "Marvel Super Heroes Commander",
    release_date: "2026-06-26",
    synopsis: "A four-color family alliance deck emphasizing cooperative abilities, cosmic artifact synergy, and resilient tactical protection.",
    approxValue: 175,
    commander: [{ name: "Reed Richards, Elastic Genius", set_code: "msc", number: "2", count: 1 }],
    cards: [
      { name: "Sue Storm, Invisible Woman", set_code: "msc", number: "4", count: 1 },
      { name: "Johnny Storm, Human Torch", set_code: "msc", number: "6", count: 1 },
      { name: "The Thing, Yancy Street Brawler", set_code: "msc", number: "7", count: 1 },
      { name: "Arcane Signet", set_code: "msc", number: "45", count: 1 },
      { name: "Sol Ring", set_code: "msc", number: "50", count: 1 },
      { name: "Command Tower", set_code: "msc", number: "75", count: 1 }
    ]
  },
  {
    name: "Wakanda Forever",
    set_code: "msc",
    set_name: "Marvel Super Heroes Commander",
    release_date: "2026-06-26",
    synopsis: "A Selesnya vibranium-fueled tribal and artifact strategy centering around legendary Wakandan royalty, loyalty counters, and combat buffs.",
    approxValue: 155,
    commander: [{ name: "T'Challa, Black Panther", set_code: "msc", number: "8", count: 1 }],
    cards: [
      { name: "Shuri, Master Technologist", set_code: "msc", number: "9", count: 1 },
      { name: "Okoye, Dora Milaje General", set_code: "msc", number: "11", count: 1 },
      { name: "Arcane Signet", set_code: "msc", number: "45", count: 1 },
      { name: "Sol Ring", set_code: "msc", number: "50", count: 1 },
      { name: "Command Tower", set_code: "msc", number: "75", count: 1 }
    ]
  },
  {
    name: "Doom Prevails",
    set_code: "msc",
    set_name: "Marvel Super Heroes Commander",
    release_date: "2026-06-26",
    synopsis: "A dominant Grixis control and villainy deck featuring Doctor Doom, tactical doom counters, heavy removal, and supreme board command.",
    approxValue: 185,
    commander: [{ name: "Doctor Doom, Latverian Monarch", set_code: "msc", number: "12", count: 1 }],
    cards: [
      { name: "The Beyonder, Cosmic Arbitrator", set_code: "msc", number: "14", count: 1 },
      { name: "Klaw, Sonic Disruptor", set_code: "msc", number: "16", count: 1 },
      { name: "Arcane Signet", set_code: "msc", number: "45", count: 1 },
      { name: "Sol Ring", set_code: "msc", number: "50", count: 1 },
      { name: "Command Tower", set_code: "msc", number: "75", count: 1 }
    ]
  }
];
