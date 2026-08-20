import { MoverCard } from './dailyMoversEngine';

export interface CanonicalCardSnapshot {
  id: string;
  name: string;
  setCode: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  currentUsd: number;
  previousUsd: number;
  percentChange: number;
  recentPrices: number[];
  category: string;
  signalSource: MoverCard['signalSource'];
  thesis: string;
  cardKingdomUsd: number;
  tcgplayerMarketUsd: number;
  mtgGoldfishUsd: number;
  isCatalyst?: boolean;
  lastUpdated: string;
}

const STORAGE_KEY = 'mtg_canonical_market_snapshots_v3';

// 250-card Signal Matrix Sample Data mapping precisely to the 10 categories (25 cards per category)
const MATRIX_SEED_ROWS = [
  // 1. HIGH VALUE SPIKES
  { cat: 'high-spikes', name: 'Tyvar, the Pummeler', set: 'ppdsk', past: 4.87, present: 52.08, pct: 969.4, thesis: 'High-value positive mover; present quoted price is at least $25.00 (promopack printing).' },
  { cat: 'high-spikes', name: 'Anduril, Narsil Reforged (Borderless)', set: 'hoc', past: 11.0, present: 75.0, pct: 581.82, thesis: 'High-value positive mover; present quoted price is at least $25.00 (commander printing).' },
  { cat: 'high-spikes', name: 'Eluge, the Shoreless Sea', set: 'ppblb', past: 5.34, present: 27.57, pct: 416.29, thesis: 'High-value positive mover; present quoted price is at least $25.00 (promopack printing).' },
  { cat: 'high-spikes', name: 'Gimli of the Glittering Caves (Extended Art)', set: 'ltc', past: 7.92, present: 37.98, pct: 379.55, thesis: 'High-value positive mover; present quoted price is at least $25.00 (commander printing).' },
  { cat: 'high-spikes', name: 'Season of Gathering', set: 'ppblb', past: 6.42, present: 28.22, pct: 339.56, thesis: 'High-value positive mover; present quoted price is at least $25.00 (promopack printing).' },
  { cat: 'high-spikes', name: 'Fomori Vault', set: 'ppeoe', past: 16.63, present: 72.06, pct: 333.31, thesis: 'High-value positive mover; present quoted price is at least $25.00 (promos printing).' },
  { cat: 'high-spikes', name: 'Berserk', set: 'lea', past: 715.99, present: 2675.47, pct: 273.67, thesis: 'High-value positive mover; present quoted price is at least $25.00 (core printing).' },
  { cat: 'high-spikes', name: 'Gimli of the Glittering Caves (Showcase Scrolls)', set: 'ltc', past: 10.82, present: 37.17, pct: 243.53, thesis: 'High-value positive mover; present quoted price is at least $25.00 (commander printing).' },
  { cat: 'high-spikes', name: 'Archangel of Tithes', set: 'ppotj', past: 8.88, present: 29.44, pct: 231.53, thesis: 'High-value positive mover; present quoted price is at least $25.00 (promopack printing).' },
  { cat: 'high-spikes', name: 'Transmutation Font (Showcase)', set: 'big', past: 21.15, present: 53.78, pct: 154.28, thesis: 'High-value positive mover; present quoted price is at least $25.00 (expansion printing).' },
  { cat: 'high-spikes', name: 'Burrowing', set: 'lea', past: 44.58, present: 108.04, pct: 142.35, thesis: 'High-value positive mover; present quoted price is at least $25.00 (core printing).' },
  { cat: 'high-spikes', name: 'Galadriel, Light of Valinor (Borderless)', set: 'hoc', past: 32.09, present: 72.15, pct: 124.84, thesis: 'High-value positive mover; present quoted price is at least $25.00 (commander printing).' },
  { cat: 'high-spikes', name: 'Icy Manipulator', set: 'lea', past: 745.70, present: 1372.35, pct: 84.04, thesis: 'High-value positive mover; present quoted price is at least $25.00 (core printing).' },
  { cat: 'high-spikes', name: 'Lance', set: 'lea', past: 44.99, present: 80.48, pct: 78.88, thesis: 'High-value positive mover; present quoted price is at least $25.00 (core printing).' },
  { cat: 'high-spikes', name: 'Drudge Skeletons', set: 'lea', past: 51.74, present: 90.37, pct: 74.66, thesis: 'High-value positive mover; present quoted price is at least $25.00 (core printing).' },
  { cat: 'high-spikes', name: 'Lifeforce', set: 'lea', past: 104.99, present: 176.93, pct: 68.52, thesis: 'High-value positive mover; present quoted price is at least $25.00 (core printing).' },
  { cat: 'high-spikes', name: 'False Orders', set: 'lea', past: 52.49, present: 88.28, pct: 68.18, thesis: 'High-value positive mover; present quoted price is at least $25.00 (core printing).' },
  { cat: 'high-spikes', name: 'Basalt Monolith', set: '2ed', past: 41.74, present: 68.32, pct: 63.68, thesis: 'High-value positive mover; present quoted price is at least $25.00 (core printing).' },
  { cat: 'high-spikes', name: 'Goryo\'s Vengeance', set: 'bok', past: 30.00, present: 47.15, pct: 57.17, thesis: 'High-value positive mover; present quoted price is at least $25.00 (expansion printing).' },
  { cat: 'high-spikes', name: 'Tiamat', set: 'afr', past: 64.32, present: 99.48, pct: 54.66, thesis: 'High-value positive mover; present quoted price is at least $25.00 (promopack printing).' },
  { cat: 'high-spikes', name: 'Cyclonic Rift', set: 'rtr', past: 24.50, present: 38.20, pct: 55.9, thesis: 'High-value positive mover; essential blue format sweeper.' },
  { cat: 'high-spikes', name: 'Rhystic Study', set: 'pcy', past: 28.00, present: 44.50, pct: 58.9, thesis: 'High-value positive mover; elite casual blue enchantment.' },
  { cat: 'high-spikes', name: 'Smothering Tithe', set: 'rna', past: 18.00, present: 29.50, pct: 63.8, thesis: 'High-value positive mover; white treasure tax engine.' },
  { cat: 'high-spikes', name: 'Dockside Extortionist', set: 'c21', past: 45.00, present: 74.00, pct: 64.4, thesis: 'High-value positive mover; explosive red treasure generation.' },
  { cat: 'high-spikes', name: 'Mana Crypt', set: 'mps', past: 120.00, present: 195.00, pct: 62.5, thesis: 'High-value positive mover; premium collector artifact.' },

  // 2. PENNY RISERS & BUYOUT TARGETS
  { cat: 'penny-risers', name: 'Circle of Protection: Black', set: '2ed', past: 2.3, present: 13.65, pct: 493.48, thesis: 'Positive mover with present regular-price at or below $3.00, plus scarcity screen.' },
  { cat: 'penny-risers', name: 'Dwarven Recruiter', set: 'ody', past: 1.85, present: 8.50, pct: 359.4, thesis: 'Penny riser with Dwarf tribal and Hobbit mechanic synergy.' },
  { cat: 'penny-risers', name: 'Dwarven Bloodboiler', set: 'jud', past: 1.50, present: 6.56, pct: 337.3, thesis: 'Low-price buyout target absorbing tribal combat demand.' },
  { cat: 'penny-risers', name: 'Reyav, Master Smith', set: 'cmr', past: 0.12, present: 0.25, pct: 108.3, thesis: 'Budget equipment smithing engine.' },
  { cat: 'penny-risers', name: 'Thran Temporal Gateway', set: 'dom', past: 0.25, present: 0.55, pct: 120.0, thesis: 'Historic permanent cheat engine.' },
  { cat: 'penny-risers', name: 'Jhoira\'s Familiar', set: 'dom', past: 0.95, present: 2.15, pct: 126.3, thesis: 'Cost reducer for historic spells.' },
  { cat: 'penny-risers', name: 'Stone-Seeder Hierophant', set: 'rav', past: 0.22, present: 0.54, pct: 145.4, thesis: 'Land untap combo staple for landfall.' },
  { cat: 'penny-risers', name: 'Preeminent Captain', set: 'm15', past: 0.35, present: 0.85, pct: 142.8, thesis: 'Tribal soldier attack trigger.' },
  { cat: 'penny-risers', name: 'Command Tower', set: 'cmd', past: 0.15, present: 0.30, pct: 100.0, thesis: 'Ubiquitous commander mana fix.' },
  { cat: 'penny-risers', name: 'Arcane Signet', set: 'eld', past: 0.35, present: 0.75, pct: 114.2, thesis: 'Universal commander rock.' },
  { cat: 'penny-risers', name: 'Llanowar Elves', set: 'lea', past: 0.20, present: 0.45, pct: 125.0, thesis: 'Classic green dork absorption.' },
  { cat: 'penny-risers', name: 'Lightning Greaves', set: 'mrd', past: 1.50, present: 2.90, pct: 93.3, thesis: 'Haste and shroud equipment.' },
  { cat: 'penny-risers', name: 'Swiftfoot Boots', set: 'm12', past: 0.80, present: 1.65, pct: 106.2, thesis: 'Budget protection boots.' },
  { cat: 'penny-risers', name: 'Cultivate', set: 'm21', past: 0.40, present: 0.85, pct: 112.5, thesis: 'Ramp staple.' },
  { cat: 'penny-risers', name: 'Kodama\'s Reach', set: 'chk', past: 0.50, present: 1.10, pct: 120.0, thesis: 'Cloned ramp spell.' },
  { cat: 'penny-risers', name: 'Sol Ring', set: 'c16', past: 0.90, present: 1.85, pct: 105.5, thesis: 'Commander mandatory artifact.' },
  { cat: 'penny-risers', name: 'Mind Stone', set: 'wth', past: 0.25, present: 0.55, pct: 120.0, thesis: 'Card-drawing mana rock.' },
  { cat: 'penny-risers', name: 'Thought Vessel', set: 'c15', past: 1.20, present: 2.60, pct: 116.6, thesis: 'No maximum hand size rock.' },
  { cat: 'penny-risers', name: 'Fellwar Stone', set: 'drk', past: 0.30, present: 0.70, pct: 133.3, thesis: 'Any color fixing rock.' },
  { cat: 'penny-risers', name: 'Wayfarer\'s Bauble', set: 'mma', past: 0.20, present: 0.45, pct: 125.0, thesis: 'Colorless ramp artifact.' },
  { cat: 'penny-risers', name: 'Pillar of Origins', set: 'xln', past: 0.15, present: 0.35, pct: 133.3, thesis: 'Tribal mana rock.' },
  { cat: 'penny-risers', name: 'Bojuka Bog', set: 'wwk', past: 0.50, present: 1.10, pct: 120.0, thesis: 'Graveyard hate land.' },
  { cat: 'penny-risers', name: 'Reliquary Tower', set: 'con', past: 0.80, present: 1.70, pct: 112.5, thesis: 'Hand size utility land.' },
  { cat: 'penny-risers', name: 'Path of Ancestry', set: 'c17', past: 0.30, present: 0.70, pct: 133.3, thesis: 'Tribal fixing land.' },
  { cat: 'penny-risers', name: 'Exotic Orchard', set: 'con', past: 0.25, present: 0.60, pct: 140.0, thesis: 'Multiplayer land.' },

  // 3. COMMANDER FORMAT STAPLES
  { cat: 'commander-picks', name: 'Idol of Oblivion', set: 'plst', past: 4.0, present: 19.9, pct: 397.5, thesis: 'Commander staple with strong EDHREC rank for token strategies.' },
  { cat: 'commander-picks', name: 'Gimli of the Glittering Caves (Extended Art)', set: 'ltc', past: 7.92, present: 37.98, pct: 379.55, thesis: 'Commander staple with Lord of the Rings dwarf synergies.' },
  { cat: 'commander-picks', name: 'Gimli of the Glittering Caves (Showcase Scrolls)', set: 'ltc', past: 10.82, present: 37.17, pct: 243.53, thesis: 'Commander staple showcase treatment.' },
  { cat: 'commander-picks', name: 'Gloin, Dwarf Emissary (Extended Art)', set: 'ltr', past: 1.5, present: 5.12, pct: 241.33, thesis: 'Commander staple historic trigger.' },
  { cat: 'commander-picks', name: 'Alchemist\'s Talent', set: 'blc', past: 5.48, present: 18.99, pct: 246.53, thesis: 'Commander precon standout class.' },
  { cat: 'commander-picks', name: 'Prime Speaker Vannifar', set: 'rna', past: 7.0, present: 17.13, pct: 144.71, thesis: 'Commander staple pod commander.' },
  { cat: 'commander-picks', name: 'Galadriel, Light of Valinor (Borderless)', set: 'hoc', past: 32.09, present: 72.15, pct: 124.84, thesis: 'Commander staple elf/human monarch.' },
  { cat: 'commander-picks', name: 'Gimli of the Glittering Caves', set: 'ltc', past: 5.67, present: 12.42, pct: 119.05, thesis: 'Commander staple standard printing.' },
  { cat: 'commander-picks', name: 'The Great Henge', set: 'eld', past: 35.0, present: 58.0, pct: 65.7, thesis: 'Elite green card draw and ramp.' },
  { cat: 'commander-picks', name: 'Teferi\'s Protection', set: 'sta', past: 28.0, present: 45.0, pct: 60.7, thesis: 'Defensive white staple.' },
  { cat: 'commander-picks', name: 'Demonic Tutor', set: 'lea', past: 38.0, present: 62.0, pct: 63.1, thesis: 'Black tutor standard.' },
  { cat: 'commander-picks', name: 'Vampiric Tutor', set: 'vis', past: 32.0, present: 54.0, pct: 68.7, thesis: 'Instant speed black tutor.' },
  { cat: 'commander-picks', name: 'Fierce Guardianship', set: 'c20', past: 30.0, present: 49.0, pct: 63.3, thesis: 'Free blue counterspell.' },
  { cat: 'commander-picks', name: 'Deflecting Swat', set: 'c20', past: 26.0, present: 42.0, pct: 61.5, thesis: 'Free red redirection.' },
  { cat: 'commander-picks', name: 'Bolas\'s Citadel', set: 'war', past: 7.0, present: 13.5, pct: 92.8, thesis: 'Topdeck black storm engine.' },
  { cat: 'commander-picks', name: 'Monologue Tax', set: 'c21', past: 4.0, present: 8.2, pct: 105.0, thesis: 'White treasure generation.' },
  { cat: 'commander-picks', name: 'Esper Sentinel', set: 'mh2', past: 22.0, present: 36.0, pct: 63.6, thesis: 'White rhystic study variant.' },
  { cat: 'commander-picks', name: 'Dockside Extortionist', set: 'c19', past: 40.0, present: 72.0, pct: 80.0, thesis: 'Explosive red treasure maker.' },
  { cat: 'commander-picks', name: 'Craterhoof Behemoth', set: 'avr', past: 25.0, present: 41.0, pct: 64.0, thesis: 'Green overrun finisher.' },
  { cat: 'commander-picks', name: 'Torment of Hailfire', set: 'hou', past: 12.0, present: 22.0, pct: 83.3, thesis: 'Black mana sink wincon.' },
  { cat: 'commander-picks', name: 'Panharmonicon', set: 'kld', past: 6.0, present: 11.5, pct: 91.6, thesis: 'ETB trigger doubler.' },
  { cat: 'commander-picks', name: 'Strionic Resonator', set: 'gtc', past: 3.5, present: 7.0, pct: 100.0, thesis: 'Trigger copier artifact.' },
  { cat: 'commander-picks', name: 'Parallel Lives', set: 'isd', past: 30.0, present: 52.0, pct: 73.3, thesis: 'Token doubler.' },
  { cat: 'commander-picks', name: 'Doubling Season', set: 'rav', past: 35.0, present: 59.0, pct: 68.5, thesis: 'Counter and token doubler.' },
  { cat: 'commander-picks', name: 'Anointed Procession', set: 'akh', past: 40.0, present: 68.0, pct: 70.0, thesis: 'White token doubler.' },

  // 4. RC RULE-CHANGE WATCHERS
  { cat: 'rule-watchers', name: 'Lutri, the Spellchaser', set: 'iko', past: 2.0, present: 4.5, pct: 125.0, thesis: 'Companion rule discussion focal point.' },
  { cat: 'rule-watchers', name: 'Biorhythm', set: '9ed', past: 20.0, present: 35.0, pct: 75.0, thesis: 'Historical banned list card watched by panel.' },
  { cat: 'rule-watchers', name: 'Iona, Shield of Emeria', set: 'zen', past: 8.0, present: 15.0, pct: 87.5, thesis: 'Panel discussion unban candidate.' },
  { cat: 'rule-watchers', name: 'Sundering Titan', set: 'dst', past: 5.0, present: 9.8, pct: 96.0, thesis: 'Artifact land destruction discussion.' },
  { cat: 'rule-watchers', name: 'Prophet of Kruphix', set: 'ths', past: 4.0, present: 7.9, pct: 97.5, thesis: 'Simic powerhouse watch item.' },
  { cat: 'rule-watchers', name: 'Panoptic Mirror', set: 'dst', past: 2.5, present: 5.2, pct: 108.0, thesis: 'Infinite turn combo watch.' },
  { cat: 'rule-watchers', name: 'Coalition Victory', set: 'inv', past: 1.5, present: 3.2, pct: 113.3, thesis: 'Five-color win condition.' },
  { cat: 'rule-watchers', name: 'Gifts Ungiven', set: 'chk', past: 3.0, present: 6.1, pct: 103.3, thesis: 'Tutor package restriction watch.' },
  { cat: 'rule-watchers', name: 'Sylvan Primordial', set: 'gtc', past: 1.0, present: 2.4, pct: 140.0, thesis: 'Extortion and destruction titan.' },
  { cat: 'rule-watchers', name: 'Primeval Titan', set: 'm11', past: 15.0, present: 26.0, pct: 73.3, thesis: 'Green land titan discussion.' },
  { cat: 'rule-watchers', name: 'Flash', set: '6ed', past: 4.0, present: 8.0, pct: 100.0, thesis: 'Instant speed cheat engine.' },
  { cat: 'rule-watchers', name: 'Fastbond', set: '2ed', past: 12.0, present: 21.0, pct: 75.0, thesis: 'Extra land drop engine.' },
  { cat: 'rule-watchers', name: 'Library of Alexandria', set: 'arn', past: 900.0, present: 1450.0, pct: 61.1, thesis: 'Vintage and RC archive watch.' },
  { cat: 'rule-watchers', name: 'Tolarian Academy', set: 'usg', past: 25.0, present: 45.0, pct: 80.0, thesis: 'Artifact mana powerhouse.' },
  { cat: 'rule-watchers', name: 'Channel', set: '2ed', past: 6.0, present: 12.0, pct: 100.0, thesis: 'Mana conversion classic.' },
  { cat: 'rule-watchers', name: 'Wheel of Fortune', set: '3ed', past: 110.0, present: 180.0, pct: 63.6, thesis: 'Red hand refiller.' },
  { cat: 'rule-watchers', name: 'Time Vault', set: '2ed', past: 300.0, present: 480.0, pct: 60.0, thesis: 'Extra turn artifact.' },
  { cat: 'rule-watchers', name: 'Yawgmoth\'s Bargain', set: 'uds', past: 8.0, present: 16.0, pct: 100.0, thesis: 'Life-to-card draw.' },
  { cat: 'rule-watchers', name: 'Tinker', set: 'ulg', past: 5.0, present: 10.5, pct: 110.0, thesis: 'Artifact sacrifice tutor.' },
  { cat: 'rule-watchers', name: 'Demonic Consultation', set: 'ice', past: 3.0, present: 6.5, pct: 116.6, thesis: 'Oracle combo piece.' },
  { cat: 'rule-watchers', name: 'Necropotence', set: 'ice', past: 14.0, present: 25.0, pct: 78.5, thesis: 'Black card draw powerhouse.' },
  { cat: 'rule-watchers', name: 'Mox Diamond', set: 'sth', past: 350.0, present: 520.0, pct: 48.5, thesis: 'Reserved list fast mana.' },
  { cat: 'rule-watchers', name: 'Mana Vault', set: '3ed', past: 45.0, present: 75.0, pct: 66.6, thesis: 'Explosive colorless rock.' },
  { cat: 'rule-watchers', name: 'Sol Ring', set: 'lea', past: 80.0, present: 140.0, pct: 75.0, thesis: 'Vintage fast mana printing.' },
  { cat: 'rule-watchers', name: 'Mox Sapphire', set: 'lea', past: 3500.0, present: 5200.0, pct: 48.5, thesis: 'Power nine benchmark.' },

  // 5. REDDIT / R/MTGFINANCE SPECULATION
  { cat: 'reddit-spec', name: 'Goblin Matron', set: 'p02', past: 4.31, present: 13.4, pct: 210.9, thesis: 'Community sentiment queue based on indexed post topics.' },
  { cat: 'reddit-spec', name: 'Dwarven Recruiter', set: 'ody', past: 2.50, present: 7.80, pct: 212.0, thesis: 'Reddit finance spec on Dwarf deck density.' },
  { cat: 'reddit-spec', name: 'Dwarven Bloodboiler', set: 'jud', past: 2.00, present: 5.90, pct: 195.0, thesis: 'Speculative buyout interest on old red dwarves.' },
  { cat: 'reddit-spec', name: 'Thran Temporal Gateway', set: 'dom', past: 0.40, present: 1.20, pct: 200.0, thesis: 'Community historic cheat spec.' },
  { cat: 'reddit-spec', name: 'Stone-Seeder Hierophant', set: 'rav', past: 0.30, present: 0.95, pct: 216.6, thesis: 'Reddit land combo discussion lead.' },
  { cat: 'reddit-spec', name: 'Preeminent Captain', set: 'm15', past: 0.45, present: 1.30, pct: 188.8, thesis: 'Soldier tribal spike speculation.' },
  { cat: 'reddit-spec', name: 'Lutri, the Spellchaser', set: 'iko', past: 1.80, present: 4.20, pct: 133.3, thesis: 'Speculative unban chatter.' },
  { cat: 'reddit-spec', name: 'Biorhythm', set: '9ed', past: 15.0, present: 31.0, pct: 106.6, thesis: 'Rule change speculation lead.' },
  { cat: 'reddit-spec', name: 'Squee, Goblin Nabob', set: 'mmq', past: 2.0, present: 4.8, pct: 140.0, thesis: 'Discard fodder spec.' },
  { cat: 'reddit-spec', name: ' Goblin Lackey', set: 'usg', past: 8.0, present: 17.5, pct: 118.7, thesis: 'Goblin tribal momentum.' },
  { cat: 'reddit-spec', name: 'Krenko, Mob Boss', set: 'm13', past: 3.0, present: 6.9, pct: 130.0, thesis: 'Casual goblin favorite.' },
  { cat: 'reddit-spec', name: 'Purphoros, God of the Forge', set: 'ths', past: 18.0, present: 32.0, pct: 77.7, thesis: 'Token burn commander.' },
  { cat: 'reddit-spec', name: 'Impact Tremors', set: 'dtk', past: 1.5, present: 3.4, pct: 126.6, thesis: 'Pauper and EDH burn staple.' },
  { cat: 'reddit-spec', name: 'Witty Roastmaster', set: 'snc', past: 0.5, present: 1.2, pct: 140.0, thesis: 'Common token ping.' },
  { cat: 'reddit-spec', name: 'Solphim, Mayhem Dominus', set: 'one', past: 6.0, present: 12.5, pct: 108.3, thesis: 'Damage doubler spec.' },
  { cat: 'reddit-spec', name: 'Ojer Axonil, Deepest Might', set: 'lci', past: 4.0, present: 8.9, pct: 122.5, thesis: 'Mono-red burn synergy.' },
  { cat: 'reddit-spec', name: 'Torbran, Thane of Red Fell', set: 'eld', past: 2.0, present: 4.6, pct: 130.0, thesis: 'Red damage booster.' },
  { cat: 'reddit-spec', name: 'Chandra, Dressed to Kill', set: 'vow', past: 5.0, present: 10.5, pct: 110.0, thesis: 'Red planeswalker impulse.' },
  { cat: 'reddit-spec', name: 'Fable of the Mirror-Breaker', set: 'neo', past: 15.0, present: 28.0, pct: 86.6, thesis: 'All-format red enchantment.' },
  { cat: 'reddit-spec', name: 'Blood Moon', set: 'chr', past: 12.0, present: 23.0, pct: 91.6, thesis: 'Nonbasic land hate.' },
  { cat: 'reddit-spec', name: 'Magus of the Moon', set: 'fut', past: 6.0, present: 12.0, pct: 100.0, thesis: 'Creature blood moon.' },
  { cat: 'reddit-spec', name: 'Dockside Extortionist', set: 'c19', past: 35.0, present: 65.0, pct: 85.7, thesis: 'Finance discussion focus.' },
  { cat: 'reddit-spec', name: 'Gaea\'s Cradle', set: 'usg', past: 650.0, present: 980.0, pct: 50.7, thesis: 'High-end reserved list spec.' },
  { cat: 'reddit-spec', name: 'Serra\'s Sanctum', set: 'usg', past: 250.0, present: 390.0, pct: 56.0, thesis: 'Enchantment cradle counterpart.' },
  { cat: 'reddit-spec', name: 'Tolarian Academy', set: 'usg', past: 25.0, present: 48.0, pct: 92.0, thesis: 'Artifact cradle counterpart.' },

  // 6. STANDARD BREAKOUT CANDIDATES
  { cat: 'standard-breakouts', name: 'Eluge, the Shoreless Sea', set: 'ppblb', past: 5.34, present: 27.57, pct: 416.29, thesis: 'Standard-legal card with positive mover signal or verified mechanic.' },
  { cat: 'standard-breakouts', name: 'Season of Gathering', set: 'ppblb', past: 6.42, present: 28.22, pct: 339.56, thesis: 'Standard-legal green powerhouse.' },
  { cat: 'standard-breakouts', name: 'Fomori Vault', set: 'ppeoe', past: 16.63, present: 72.06, pct: 333.31, thesis: 'Standard set promo breakout.' },
  { cat: 'standard-breakouts', name: 'Gwenna, Eyes of Gaea', set: 'ppbro', past: 6.52, present: 17.74, pct: 172.09, thesis: 'Standard dork breakout.' },
  { cat: 'standard-breakouts', name: 'Fade from History', set: 'ppbro', past: 9.49, present: 19.99, pct: 110.64, thesis: 'Standard sweeper absorption.' },
  { cat: 'standard-breakouts', name: 'Sheoldred, the Apocalypse', set: 'dmu', past: 45.0, present: 74.0, pct: 64.4, thesis: 'Standard black powerhouse.' },
  { cat: 'standard-breakouts', name: 'The Wandering Emperor', set: 'neo', past: 18.0, present: 31.0, pct: 72.2, thesis: 'Standard white flash planeswalker.' },
  { cat: 'standard-breakouts', name: 'Meathook Massacre', set: 'mid', past: 25.0, present: 42.0, pct: 68.0, thesis: 'Standard black board wipe.' },
  { cat: 'standard-breakouts', name: 'Ossification', set: 'one', past: 1.0, present: 2.5, pct: 150.0, thesis: 'Standard white removal.' },
  { cat: 'standard-breakouts', name: 'Bankbuster', set: 'neo', past: 2.0, present: 4.8, pct: 140.0, thesis: 'Standard vehicle card draw.' },
  { cat: 'standard-breakouts', name: 'Temporary Lockdown', set: 'dmu', past: 4.0, present: 9.2, pct: 130.0, thesis: 'Standard sweeper for low drops.' },
  { cat: 'standard-breakouts', name: 'Leyline Binding', set: 'dmu', past: 6.0, present: 13.0, pct: 116.6, thesis: 'Domain removal spell.' },
  { cat: 'standard-breakouts', name: 'Up the Beanstalk', set: 'woe', past: 1.5, present: 3.8, pct: 153.3, thesis: 'Value green enchantment.' },
  { cat: 'standard-breakouts', name: 'Slickshot Show-Off', set: 'otj', past: 3.0, present: 7.5, pct: 150.0, thesis: 'Prowess aggro finisher.' },
  { cat: 'standard-breakouts', name: 'Insidious Roots', set: 'mkm', past: 0.5, present: 1.4, pct: 180.0, thesis: 'Graveyard plant token maker.' },
  { cat: 'standard-breakouts', name: 'Case of the Stashed Skeleton', set: 'mkm', past: 1.0, present: 2.6, pct: 160.0, thesis: 'Sacrifice tutor case.' },
  { cat: 'standard-breakouts', name: 'Deep-Cavern Bat', set: 'lci', past: 1.5, present: 3.6, pct: 140.0, thesis: 'Hand disruption flyer.' },
  { cat: 'standard-breakouts', name: 'Get Lost', set: 'lci', past: 2.5, present: 5.8, pct: 132.0, thesis: 'Flexible white removal.' },
  { cat: 'standard-breakouts', name: 'Inti, Seneschal of the Sun', set: 'lci', past: 3.0, present: 7.0, pct: 133.3, thesis: 'Red card advantage.' },
  { cat: 'standard-breakouts', name: 'Cavern of Souls', set: 'lci', past: 25.0, present: 42.0, pct: 68.0, thesis: 'Tribal land reprint.' },
  { cat: 'standard-breakouts', name: 'Soul-Guide Lantern', set: 'thb', past: 0.5, present: 1.2, pct: 140.0, thesis: 'Artifact graveyard hate.' },
  { cat: 'standard-breakouts', name: 'Rest in Peace', set: 'rtr', past: 3.0, present: 6.8, pct: 126.6, thesis: 'Enchantment graveyard lock.' },
  { cat: 'standard-breakouts', name: 'Damping Sphere', set: 'dom', past: 1.0, present: 2.3, pct: 130.0, thesis: 'Tron and storm hate.' },
  { cat: 'standard-breakouts', name: 'Grafdigger\'s Cage', set: 'm14', past: 1.5, present: 3.5, pct: 133.3, thesis: 'Creature cheat hate.' },
  { cat: 'standard-breakouts', name: 'Pithing Needle', set: 'rtr', past: 0.8, present: 1.9, pct: 137.5, thesis: 'Activated ability hate.' },

  // 7. MODERN META MOVERS
  { cat: 'modern-movers', name: 'Archangel of Tithes', set: 'ppotj', past: 8.88, present: 29.44, pct: 231.53, thesis: 'Modern-legal card with positive mover signal or meta relevance.' },
  { cat: 'modern-movers', name: 'Tyvar, Jubilant Brawler', set: 'ppone', past: 3.0, present: 8.09, pct: 169.67, thesis: 'Modern graveyard recursion piece.' },
  { cat: 'modern-movers', name: 'Ragavan, Nimble Pilferer', set: 'mh2', past: 35.0, present: 58.0, pct: 65.7, thesis: 'Modern red one-drop staple.' },
  { cat: 'modern-movers', name: 'The One Ring', set: 'ltr', past: 45.0, present: 78.0, pct: 73.3, thesis: 'Universal modern artifact engine.' },
  { cat: 'modern-movers', name: 'Orcish Bowmasters', set: 'ltr', past: 30.0, present: 52.0, pct: 73.3, thesis: 'Black flash ping creature.' },
  { cat: 'modern-movers', name: 'Scam Subtlety', set: 'mh2', past: 12.0, present: 22.0, pct: 83.3, thesis: 'Free pitch elemental.' },
  { cat: 'modern-movers', name: 'Fury', set: 'mh2', past: 15.0, present: 27.0, pct: 80.0, thesis: 'Red pitch sweeper.' },
  { cat: 'modern-movers', name: 'Grief', set: 'mh2', past: 10.0, present: 19.0, pct: 90.0, thesis: 'Black hand disruption.' },
  { cat: 'modern-movers', name: 'Solitude', set: 'mh2', past: 20.0, present: 34.0, pct: 70.0, thesis: 'White swords elemental.' },
  { cat: 'modern-movers', name: 'Endurance', set: 'mh2', past: 18.0, present: 31.0, pct: 72.2, thesis: 'Green graveyard hate elemental.' },
  { cat: 'modern-movers', name: 'Urza\'s Saga', set: 'mh2', past: 25.0, present: 43.0, pct: 72.0, thesis: 'Modern enchantment land.' },
  { cat: 'modern-movers', name: 'Wrenn and Six', set: 'mh1', past: 22.0, present: 38.0, pct: 72.7, thesis: 'Jund and control planeswalker.' },
  { cat: 'modern-movers', name: 'Force of Negation', set: 'mh1', past: 30.0, present: 49.0, pct: 63.3, thesis: 'Free counterspell.' },
  { cat: 'modern-movers', name: 'Prismatic Ending', set: 'mh2', past: 1.0, present: 2.6, pct: 160.0, thesis: 'Flexible white removal.' },
  { cat: 'modern-movers', name: 'Unholy Heat', set: 'mh2', past: 0.5, present: 1.4, pct: 180.0, thesis: 'Red delirium removal.' },
  { cat: 'modern-movers', name: 'Darcy\'s Channeler', set: 'mh2', past: 1.5, present: 3.5, pct: 133.3, thesis: 'Delirium red delver.' },
  { cat: 'modern-movers', name: 'Monastery Swiftspear', set: 'ktk', past: 1.0, present: 2.4, pct: 140.0, thesis: 'Prowess aggro staple.' },
  { cat: 'modern-movers', name: 'Lurrus of the Dream-Den', set: 'iko', past: 12.0, present: 22.0, pct: 83.3, thesis: 'Banned companion / modern fixture.' },
  { cat: 'modern-movers', name: 'Scalding Tarn', set: 'zen', past: 18.0, present: 31.0, pct: 72.2, thesis: 'Modern fetchland.' },
  { cat: 'modern-movers', name: 'Arid Mesa', set: 'zen', past: 15.0, present: 26.0, pct: 73.3, thesis: 'Modern fetchland.' },
  { cat: 'modern-movers', name: 'Verdant Catacombs', set: 'zen', past: 16.0, present: 28.0, pct: 75.0, thesis: 'Modern fetchland.' },
  { cat: 'modern-movers', name: 'Misty Rainforest', set: 'zen', past: 19.0, present: 33.0, pct: 73.6, thesis: 'Modern fetchland.' },
  { cat: 'modern-movers', name: 'Marsh Flats', set: 'zen', past: 14.0, present: 25.0, pct: 78.5, thesis: 'Modern fetchland.' },
  { cat: 'modern-movers', name: 'Boseiju, Who Endures', set: 'neo', past: 24.0, present: 40.0, pct: 66.6, thesis: 'Channel land staple.' },
  { cat: 'modern-movers', name: 'Otawara, Soaring City', set: 'neo', past: 8.0, present: 15.0, pct: 87.5, thesis: 'Channel land staple.' },

  // 8. PAUPER HIDDEN GEMS
  { cat: 'pauper-gems', name: 'Welcoming Vampire', set: 'plst', past: 1.51, present: 4.9, pct: 224.5, thesis: 'Pauper-legal card with positive movement or recurring engine.' },
  { cat: 'pauper-gems', name: 'Lightning Bolt', set: 'plst', past: 3.0, present: 7.2, pct: 140.0, thesis: 'Pauper red removal pillar.' },
  { cat: 'pauper-gems', name: 'Counterspell', set: 'ice', past: 1.0, present: 2.5, pct: 150.0, thesis: 'Pauper blue permission.' },
  { cat: 'pauper-gems', name: 'Artifact Land (Ancient Den)', set: 'mrd', past: 1.5, present: 3.6, pct: 140.0, thesis: 'Affinity artifact land.' },
  { cat: 'pauper-gems', name: 'Galvanic Blast', set: 'som', past: 0.8, present: 2.0, pct: 150.0, thesis: 'Affinity metalcraft burn.' },
  { cat: 'pauper-gems', name: 'All That Glitters', set: 'eld', past: 2.0, present: 4.5, pct: 125.0, thesis: 'Affinity enchantment aura.' },
  { cat: 'pauper-gems', name: 'Kuldotha Rebirth', set: 'som', past: 0.5, present: 1.3, pct: 160.0, thesis: 'Kuldotha red token maker.' },
  { cat: 'pauper-gems', name: 'Monastery Swiftspear', set: 'ktk', past: 1.0, present: 2.4, pct: 140.0, thesis: 'Pauper red aggro.' },
  { cat: 'pauper-gems', name: 'Spear Spewer', set: 'rna', past: 0.3, present: 0.9, pct: 200.0, thesis: 'Rakdos burn pinger.' },
  { cat: 'pauper-gems', name: 'Snuff Out', set: 'mmq', past: 3.5, present: 7.5, pct: 114.2, thesis: 'Free black removal.' },
  { cat: 'pauper-gems', name: 'Cast Down', set: 'dom', past: 0.5, present: 1.3, premium: false, pct: 160.0, thesis: 'Efficient black kill spell.' },
  { cat: 'pauper-gems', name: 'Deadly Dispute', set: 'afr', past: 0.8, present: 1.9, pct: 137.5, thesis: 'Sacrifice card draw.' },
  { cat: 'pauper-gems', name: 'Tithing Blade', set: 'lci', past: 0.3, present: 0.8, pct: 166.6, thesis: 'Artifact edict.' },
  { cat: 'pauper-gems', name: 'Llanowar Elves', set: 'lea', past: 0.2, present: 0.5, pct: 150.0, thesis: 'Pauper green dork.' },
  { cat: 'pauper-gems', name: 'Basking Rootwalla', set: 'tor', past: 0.4, present: 1.0, pct: 150.0, thesis: 'Madness green threat.' },
  { cat: 'pauper-gems', name: 'Vines of Vastwood', set: 'zen', past: 0.5, present: 1.2, pct: 140.0, thesis: 'Green protection pump.' },
  { cat: 'pauper-gems', name: 'Rancor', set: 'ulg', past: 1.0, present: 2.3, pct: 130.0, thesis: 'Recurring aura.' },
  { cat: 'pauper-gems', name: 'Tolarian Terror', set: 'dmu', past: 0.5, present: 1.2, pct: 140.0, thesis: 'Blue common threat.' },
  { cat: 'pauper-gems', name: 'Deep Analysis', set: 'tor', past: 0.4, present: 1.0, pct: 150.0, thesis: 'Flashback draw spell.' },
  { cat: 'pauper-gems', name: 'Preordain', set: 'm11', past: 0.6, present: 1.4, pct: 133.3, thesis: 'Blue cantrip.' },
  { cat: 'pauper-gems', name: 'Ponder', set: 'm12', past: 0.8, present: 1.8, pct: 125.0, thesis: 'Blue library manipulation.' },
  { cat: 'pauper-gems', name: 'Brainstorm', set: 'ice', past: 0.5, present: 1.2, pct: 140.0, thesis: 'Instant cantrip.' },
  { cat: 'pauper-gems', name: 'Gleeful Sabotage', set: 'shm', past: 0.3, present: 0.8, pct: 166.6, thesis: 'Green artifact removal.' },
  { cat: 'pauper-gems', name: 'Dust to Dust', set: 'atq', past: 2.5, present: 5.5, pct: 120.0, thesis: 'Sideboard artifact hate.' },
  { cat: 'pauper-gems', name: 'Hydroblast', set: 'ice', past: 1.5, present: 3.4, pct: 126.6, thesis: 'Blue sideboard staple.' },

  // 9. PREMIUM FOIL MULTIPLIERS
  { cat: 'foil-multipliers', name: 'Transmutation Font (Showcase)', set: 'big', past: 21.15, present: 53.78, pct: 154.28, thesis: 'Premium foil multiplier; foil reference exceeds nonfoil.' },
  { cat: 'foil-multipliers', name: 'Tyvar, the Pummeler', set: 'ppdsk', past: 4.87, present: 52.08, pct: 969.4, thesis: 'Promopack foil premium.' },
  { cat: 'foil-multipliers', name: 'Berserk', set: 'lea', past: 715.99, present: 2675.47, pct: 273.67, thesis: 'Alpha foil/collector premium.' },
  { cat: 'foil-multipliers', name: 'Lightning Bolt', set: 'plst', past: 11.82, present: 36.7, pct: 210.49, thesis: 'Special promo foil treatment.' },
  { cat: 'foil-multipliers', name: 'Burrowing', set: 'lea', past: 44.58, present: 108.04, pct: 142.35, thesis: 'Vintage core foil multiplier.' },
  { cat: 'foil-multipliers', name: 'Geddon', set: 'lea', past: 120.0, present: 240.0, pct: 100.0, thesis: 'Alpha collector foil premium.' },
  { cat: 'foil-multipliers', name: 'Demonic Tutor', set: 'lea', past: 350.0, present: 650.0, pct: 85.7, thesis: 'Alpha tutor multiplier.' },
  { cat: 'foil-multipliers', name: 'Shivan Dragon', set: 'lea', past: 250.0, present: 480.0, pct: 92.0, thesis: 'Classic alpha collector piece.' },
  { cat: 'foil-multipliers', name: 'Vampiric Tutor', set: 'vis', past: 45.0, present: 85.0, pct: 88.8, thesis: 'Foil multiplier on dark tutor.' },
  { cat: 'foil-multipliers', name: 'Force of Will', set: 'all', past: 70.0, present: 125.0, pct: 78.5, thesis: 'Alliances foil multiplier.' },
  { cat: 'foil-multipliers', name: 'Gaea\'s Cradle', set: 'usg', past: 800.0, present: 1350.0, pct: 68.7, thesis: 'Urza\'s saga foil rarity.' },
  { cat: 'foil-multipliers', name: 'Serra\'s Sanctum', set: 'usg', past: 300.0, present: 540.0, pct: 80.0, thesis: 'Urza\'s sanctum multiplier.' },
  { cat: 'foil-multipliers', name: 'Grim Monolith', set: 'ulh', past: 220.0, present: 380.0, pct: 72.7, thesis: 'Urza\'s legacy artifact foil.' },
  { cat: 'foil-multipliers', name: 'Memory Jar', set: 'uds', past: 40.0, present: 78.0, pct: 95.0, thesis: 'Urza\'s destiny foil.' },
  { cat: 'foil-multipliers', name: 'Gilded Drake', set: 'usg', past: 150.0, present: 270.0, pct: 80.0, thesis: 'Reserved list foil.' },
  { cat: 'foil-multipliers', name: 'Palinchron', set: 'ulg', past: 60.0, present: 110.0, pct: 83.3, thesis: 'Combo drake foil.' },
  { cat: 'foil-multipliers', name: 'Yawgmoth\'s Will', set: 'usg', past: 90.0, present: 160.0, pct: 77.7, thesis: 'Black powerhouse foil.' },
  { cat: 'foil-multipliers', name: 'Time Spiral', set: 'usg', past: 50.0, present: 92.0, pct: 84.0, thesis: 'Urza\'s saga sorcery foil.' },
  { cat: 'foil-multipliers', name: 'Rofellos, Llanowar Emissary', set: 'uds', past: 45.0, present: 82.0, pct: 82.2, thesis: 'Banned commander foil.' },
  { cat: 'foil-multipliers', name: 'Metalworker', set: 'uds', past: 110.0, present: 195.0, pct: 77.2, thesis: 'Artifact mana foil.' },
  { cat: 'foil-multipliers', name: 'Transmute Artifact', set: 'atq', past: 180.0, present: 310.0, pct: 72.2, thesis: 'Antiquities collector foil.' },
  { cat: 'foil-multipliers', name: 'Candelabra of Tawnos', set: 'atq', past: 600.0, present: 980.0, pct: 63.3, thesis: 'Antiquities land untapper.' },
  { cat: 'foil-multipliers', name: 'Mishra\'s Workshop', set: 'atq', past: 2200.0, present: 3400.0, pct: 54.5, thesis: 'Vintage artifact powerhouse.' },
  { cat: 'foil-multipliers', name: 'Bazaar of Baghdad', set: 'arn', past: 1800.0, present: 2750.0, pct: 52.7, thesis: 'Arabian nights dredge engine.' },
  { cat: 'foil-multipliers', name: 'Library of Alexandria', set: 'arn', past: 1200.0, present: 1850.0, pct: 54.1, thesis: 'Arabian nights land legend.' },

  // 10. REPRINT FLOOR SQUASHES
  { cat: 'reprint-squashes', name: 'Goblin Bombardment (MH2)', set: 'plst', past: 3.07, present: 9.6, pct: 212.7, thesis: 'Recent reprint or readily reprinted card with negative mover signal or floor test.' },
  { cat: 'reprint-squashes', name: 'Counterspell', set: 'mh2', past: 4.0, present: 1.8, pct: -55.0, thesis: 'Modern horizons reprint floor compression.' },
  { cat: 'reprint-squashes', name: 'Path to Exile', set: 'sta', past: 3.5, present: 1.5, pct: -57.1, thesis: 'Mystical archive reprint price correction.' },
  { cat: 'reprint-squashes', name: 'Wrath of God', set: '2xm', past: 6.0, present: 2.8, pct: -53.3, thesis: 'Double masters wipe compression.' },
  { cat: 'reprint-squashes', name: 'Birds of Paradise', set: 'dmr', past: 8.0, present: 3.9, pct: -51.2, thesis: 'Dominaria remastered dork correction.' },
  { cat: 'reprint-squashes', name: 'Demonic Tutor', set: 'dmr', past: 45.0, present: 24.0, pct: -46.6, thesis: 'Remastered set supply absorption.' },
  { cat: 'reprint-squashes', name: 'Vampiric Tutor', set: 'cmr', past: 40.0, present: 22.0, pct: -45.0, thesis: 'Commander legends reprint dip.' },
  { cat: 'reprint-squashes', name: 'Force of Will', set: '2xm', past: 85.0, present: 48.0, pct: -43.5, thesis: 'Double masters counterspell dip.' },
  { cat: 'reprint-squashes', name: 'Mana Crypt', set: '2xm', past: 160.0, present: 95.0, pct: -40.6, thesis: 'Masterpiece reprint downward pressure.' },
  { cat: 'reprint-squashes', name: 'Crucible of Worlds', set: 'm19', past: 22.0, present: 9.5, pct: -56.8, thesis: 'Core set reprint correction.' },
  { cat: 'reprint-squashes', name: 'Snapcaster Mage', set: 'umr', past: 35.0, present: 14.0, pct: -60.0, thesis: 'Ultimate masters wizard dip.' },
  { cat: 'reprint-squashes', name: 'Scalding Tarn', set: 'mh2', past: 40.0, present: 18.0, pct: -55.0, thesis: 'Modern horizons fetchland reprint floor.' },
  { cat: 'reprint-squashes', name: 'Verdant Catacombs', set: 'mh2', past: 30.0, present: 13.5, pct: -55.0, thesis: 'Fetchland reprint compression.' },
  { cat: 'reprint-squashes', name: 'Cavern of Souls', set: '2xm', past: 70.0, present: 32.0, pct: -54.2, thesis: 'Tribal land reprint correction.' },
  { cat: 'reprint-squashes', name: 'Executioner\'s Capsule', set: 'mma', past: 1.5, present: 0.4, pct: -73.3, thesis: 'Modern masters common drop.' },
  { cat: 'reprint-squashes', name: 'Rhystic Study', set: 'jmp', past: 45.0, present: 22.0, pct: -51.1, thesis: 'Jumpstart reprint floor test.' },
  { cat: 'reprint-squashes', name: 'Smothering Tithe', set: '2x2', past: 35.0, present: 16.5, pct: -52.8, thesis: 'Double masters 2022 correction.' },
  { cat: 'reprint-squashes', name: 'Teferi\'s Protection', set: '2x2', past: 38.0, present: 18.0, pct: -52.6, thesis: 'Reprint supply normalization.' },
  { cat: 'reprint-squashes', name: 'Cyclonic Rift', set: '2xm', past: 32.0, present: 15.0, pct: -53.1, thesis: 'Masterpiece reprint absorption.' },
  { cat: 'reprint-squashes', name: 'Parallel Lives', set: '2x2', past: 40.0, present: 19.0, pct: -52.5, thesis: 'Token doubler reprint dip.' },
  { cat: 'reprint-squashes', name: 'Doubling Season', set: '2xm', past: 65.0, present: 31.0, pct: -52.3, thesis: 'Master series floor test.' },
  { cat: 'reprint-squashes', name: 'Anointed Procession', set: 'akh', past: 45.0, present: 24.0, pct: -46.6, thesis: 'Amonkhet reprint correction.' },
  { cat: 'reprint-squashes', name: 'Heroic Intervention', set: 'm21', past: 12.0, present: 5.2, pct: -56.6, thesis: 'Core set green protection dip.' },
  { cat: 'reprint-squashes', name: 'Assassins Trophy', set: 'grn', past: 15.0, present: 4.5, pct: -70.0, thesis: 'Standard rotation floor compression.' },
  { cat: 'reprint-squashes', name: 'Teferi, Time Raveler', set: 'war', past: 20.0, present: 7.5, pct: -62.5, thesis: 'War of the spark rotation drop.' }
];

export function loadCanonicalSnapshots(): CanonicalCardSnapshot[] {
  if (typeof window === 'undefined') return generateSnapshotsFromMatrix();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = generateSnapshotsFromMatrix();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return generateSnapshotsFromMatrix();
}

export function saveCanonicalSnapshots(snapshots: CanonicalCardSnapshot[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // ignore
  }
}

export function generateSnapshotsFromMatrix(): CanonicalCardSnapshot[] {
  const snapshots: CanonicalCardSnapshot[] = [];
  let idCounter = 1;

  MATRIX_SEED_ROWS.forEach((row, idx) => {
    const step = (row.present - row.past) / 4;
    const recentPrices = [
      Number(row.past.toFixed(2)),
      Number((row.past + step).toFixed(2)),
      Number((row.past + step * 2).toFixed(2)),
      Number((row.past + step * 3).toFixed(2)),
      Number(row.present.toFixed(2)),
    ];

    snapshots.push({
      id: `matrix-mover-${idx}-${idCounter++}`,
      name: row.name,
      setCode: row.set,
      rarity: row.present > 25 ? 'mythic' : row.present > 5 ? 'rare' : 'uncommon',
      currentUsd: row.present,
      previousUsd: row.past,
      percentChange: row.pct,
      recentPrices,
      category: row.cat,
      signalSource: row.cat === 'penny-risers' ? 'Buyout Tracker' : row.cat === 'commander-picks' ? 'Commander Recs' : row.cat === 'rule-watchers' ? 'RC Rule Watch' : row.cat === 'reddit-spec' ? 'Reddit /r/mtgfinance' : 'Scryfall Snapshot',
      thesis: row.thesis,
      cardKingdomUsd: Number((row.present * 1.03).toFixed(2)),
      tcgplayerMarketUsd: Number((row.present * 0.98).toFixed(2)),
      mtgGoldfishUsd: Number((row.present * 1.01).toFixed(2)),
      isCatalyst: row.name.includes('Anduril') || row.name.includes('Gimli') || row.name.includes('Tyvar') || row.name.includes('Recruiter'),
      lastUpdated: new Date().toISOString(),
    });
  });

  return snapshots;
}
