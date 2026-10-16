import researchData from './commanderPreconUpgradeResearch.json';
import type { OwnedCard } from '@/lib/manaboxParser';

export interface PreconOwnershipMatch {
  status: 'owned' | 'unknown';
  quantity?: number;
  printings?: string[];
  note?: string;
}

export interface PreconUpgradePick {
  name: string;
  slug: string;
  reason: string;
  budgetNote?: string;
  sourceUrls?: string[];
}

export interface PreconAlternatePath {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  sourceUrls?: string[];
}

export interface PreconSuggestedSwap {
  cardsIn: string[];
  cardsOut: string[];
  rationale: string;
  sourceUrls: string[];
}

export interface CommanderPreconUpgradeGuide {
  id: string;
  setCode: string;
  deckName: string;
  commanderNames: string[];
  theme: string;
  picks: PreconUpgradePick[];
  alternatePaths: PreconAlternatePath[];
  swaps: PreconSuggestedSwap[];
  sourceUrls: string[];
  sourceLabel: string;
  preconUrl: string;
  coverage: 'full' | 'partial' | 'none';
  coverageNote: string;
  researchStatus?: 'complete' | 'pending';
}

interface GeneratedResearchData {
  researchComplete?: boolean;
  guides?: CommanderPreconUpgradeGuide[];
}

const generated = researchData as GeneratedResearchData;

const sampleGuide = (guide: Omit<CommanderPreconUpgradeGuide, 'researchStatus'>): CommanderPreconUpgradeGuide => ({
  ...guide,
  researchStatus: 'complete',
});

export const samplePreconUpgradeGuides: CommanderPreconUpgradeGuide[] = [
  sampleGuide({
    id: 'sample-explorers-lcc', setCode: 'lcc', deckName: 'Explorers of the Deep', commanderNames: ['Hakbal of the Surging Soul'],
    theme: 'Keep the Merfolk-and-Explore plan; add pieces that make the same board develop faster without turning the deck into generic Simic good-stuff.',
    picks: [
      { name: 'Roaming Throne', slug: 'roaming-throne', reason: 'Choose Merfolk to double Hakbal’s combat trigger and get more Explore value across the team.' },
      { name: 'Deeproot Pilgrimage', slug: 'deeproot-pilgrimage', reason: 'Turns your Merfolk tapping into a steady stream of hexproof Merfolk tokens.' },
      { name: 'Herald’s Horn', slug: 'heralds-horn', reason: 'A tribal cost reducer that can also help find more Merfolk.' },
    ],
    alternatePaths: [{ title: 'Kumena, Tyrant of Orazca — tap-synergy Merfolk', description: 'Reuse most of the tribal shell, but make tapping Merfolk for counters, cards, and unblockable attacks the centerpiece instead of repeated Explore triggers.', href: 'https://edhrec.com/precon/explorers-of-the-deep/kumena-tyrant-of-orazca', linkLabel: 'See EDHREC’s Kumena-from-this-precon page' }],
    swaps: [], sourceUrls: ['https://edhrec.com/articles/precon-upgrade-guide-explorers-of-the-deep', 'https://edhrec.com/precon/explorers-of-the-deep'], sourceLabel: 'EDHREC upgrade article', preconUrl: 'https://edhrec.com/precon/explorers-of-the-deep',
    coverage: 'partial', coverageNote: 'The earlier sample verifies easy upgrades and an alternate path; paired Top 25 swaps have not been researched for this page yet.',
  }),
  sampleGuide({
    id: 'sample-peace-offering-blc', setCode: 'blc', deckName: 'Peace Offering', commanderNames: ['Ms. Bumbleflower'],
    theme: 'Keep the friendly group-hug feel, then make the extra spells and counters do more work for your own board.',
    picks: [
      { name: 'Gluntch, the Bestower', slug: 'gluntch-the-bestower', reason: 'Shares resources around the table while feeding your counters-and-value plan.' },
      { name: 'Evolution Sage', slug: 'evolution-sage', reason: 'Turns your normal land drops into extra +1/+1 counters through proliferate.' },
      { name: 'Dreamtide Whale', slug: 'dreamtide-whale', reason: 'Rewards the whole table’s second spell each turn with proliferate—especially on-theme when your gifts encourage more casting.' },
    ],
    alternatePaths: [{ title: 'Mr. Foxglove — combat and hand-size value', description: 'Keep the Bant colors but shift away from spell-by-spell gift triggers: attack for card draw when opponents have fuller hands, or a creature when they do not.', href: 'https://edhrec.com/precon/peace-offering/mr-foxglove', linkLabel: 'See EDHREC’s Mr. Foxglove-from-this-precon page' }],
    swaps: [], sourceUrls: ['https://edhrec.com/articles/peace-offering-upgrade-guide-bloomburrow', 'https://edhrec.com/precon/peace-offering'], sourceLabel: 'EDHREC upgrade article', preconUrl: 'https://edhrec.com/precon/peace-offering',
    coverage: 'partial', coverageNote: 'The earlier sample verifies easy upgrades and an alternate path; paired Top 25 swaps have not been researched for this page yet.',
  }),
  sampleGuide({
    id: 'sample-food-fellowship-ltc', setCode: 'ltc', deckName: 'Food and Fellowship', commanderNames: ['Frodo, Adventurous Hobbit', 'Sam, Loyal Attendant'],
    theme: 'Build on the deck’s cozy Middle-earth Food and lifegain engine before adding cards that pull it toward a different power level.',
    picks: [
      { name: 'Peregrin Took', slug: 'peregrin-took', reason: 'Makes extra Food alongside your other tokens and can turn spare Food into cards.' },
      { name: 'Academy Manufactor', slug: 'academy-manufactor', reason: 'Adds Clues and Treasures whenever you make Food, multiplying the value of the deck’s core token.' },
      { name: 'Trail of Crumbs', slug: 'trail-of-crumbs', reason: 'Turns sacrificed Food into a repeatable way to look for another useful permanent.' },
    ],
    alternatePaths: [{ title: 'Merry and Pippin — keep the Shire, change the pair', description: 'An explicitly suggested partner swap in EDHREC’s guide: preserve the Food-and-token core while leaning less on Frodo’s Ring and life-gain triggers.', href: 'https://edhrec.com/precon/food-and-fellowship/merry-warden-of-isengard-pippin-warden-of-isengard', linkLabel: 'See EDHREC’s Merry-and-Pippin-from-this-precon page' }],
    swaps: [], sourceUrls: ['https://edhrec.com/articles/food-and-fellowship-precon-upgrade-guide', 'https://edhrec.com/precon/food-and-fellowship'], sourceLabel: 'EDHREC upgrade article', preconUrl: 'https://edhrec.com/precon/food-and-fellowship',
    coverage: 'partial', coverageNote: 'The earlier sample verifies easy upgrades and an alternate path; paired Top 25 swaps have not been researched for this page yet.',
  }),
  sampleGuide({
    id: 'sample-limit-break-fic', setCode: 'fic', deckName: 'Limit Break (FINAL FANTASY VII)', commanderNames: ['Cloud, Ex-SOLDIER'],
    theme: 'Start with a compact Equipment package that supports Cloud’s signature hit-hard combat plan; add only the pieces that fit your table and budget.',
    picks: [
      { name: 'Buster Sword', slug: 'buster-sword', reason: 'A flavorful, high-synergy equipment upgrade for the deck’s Final Fantasy VII lead.' },
      { name: 'Forge Anew', slug: 'forge-anew', reason: 'Rebuys Equipment and makes moving it between attackers easier, so removal does not stall the whole plan.' },
      { name: 'Danitha Capashen, Paragon', slug: 'danitha-capashen-paragon', reason: 'Adds a low-friction Equipment helper with useful combat keywords.' },
    ],
    alternatePaths: [{ title: 'Artifact-rebuild route — broaden beyond Equipment', description: 'Keep Cloud, but trade some Equipment-only slots for artifact cost reducers and mass recovery such as Foundry Inspector and Wake the Past. It keeps the artifact feel while playing less like one-creature Voltron.', href: 'https://edhrec.com/articles/limit-break-precon-guide-final-fantasy', linkLabel: 'Read EDHREC’s Limit Break guide and archetype-change section' }],
    swaps: [], sourceUrls: ['https://edhrec.com/articles/limit-break-precon-guide-final-fantasy', 'https://edhrec.com/precon/limit-break'], sourceLabel: 'EDHREC upgrade article', preconUrl: 'https://edhrec.com/precon/limit-break',
    coverage: 'partial', coverageNote: 'The earlier sample verifies easy upgrades and an alternate path; paired Top 25 swaps have not been researched for this page yet.',
  }),
  sampleGuide({
    id: 'sample-breed-lethality-c16', setCode: 'c16', deckName: 'Breed Lethality', commanderNames: ["Atraxa, Praetors' Voice"],
    theme: 'Keep Atraxa’s four-color counter-and-proliferate identity; start with inexpensive pieces that amplify counters already on the table instead of importing a different mechanic.',
    picks: [
      { name: 'Winding Constrictor', slug: 'winding-constrictor', reason: 'A compact counter amplifier for the +1/+1 counters the precon already makes.' },
      { name: 'Evolution Sage', slug: 'evolution-sage', reason: 'Turns ordinary land drops into proliferate, extending the deck’s existing counter plan.' },
      { name: 'Fertilid', slug: 'fertilid', reason: 'Converts its counters into basic-land ramp, reinforcing both the counter theme and four-color mana needs.' },
    ],
    alternatePaths: [{ title: 'Ishai + Reyhan — four-color partner counters', description: 'Both are already in the precon. This partner route makes commander damage more central while Reyhan preserves counters when a creature leaves; it stays inside the original counter theme.', href: 'https://edhrec.com/commanders/ishai-ojutai-dragonspeaker-reyhan-last-of-the-abzan/counters-matter', linkLabel: 'See EDHREC’s Ishai-and-Reyhan counters page' }],
    swaps: [], sourceUrls: ['https://edhrec.com/precon/breed-lethality'], sourceLabel: 'EDHREC precon data', preconUrl: 'https://edhrec.com/precon/breed-lethality',
    coverage: 'partial', coverageNote: 'The earlier sample verifies easy upgrades and an alternate path; paired Top 25 swaps have not been researched for this page yet.',
  }),
  sampleGuide({
    id: 'sample-breed-lethality-cm2', setCode: 'cm2', deckName: 'Breed Lethality', commanderNames: ["Atraxa, Praetors' Voice"],
    theme: 'Keep Atraxa’s four-color counter-and-proliferate identity; start with inexpensive pieces that amplify counters already on the table instead of importing a different mechanic.',
    picks: [
      { name: 'Winding Constrictor', slug: 'winding-constrictor', reason: 'A compact counter amplifier for the +1/+1 counters the precon already makes.' },
      { name: 'Evolution Sage', slug: 'evolution-sage', reason: 'Turns ordinary land drops into proliferate, extending the deck’s existing counter plan.' },
      { name: 'Fertilid', slug: 'fertilid', reason: 'Converts its counters into basic-land ramp, reinforcing both the counter theme and four-color mana needs.' },
    ],
    alternatePaths: [{ title: 'Ishai + Reyhan — four-color partner counters', description: 'Both are already in the precon. This partner route makes commander damage more central while Reyhan preserves counters when a creature leaves; it stays inside the original counter theme.', href: 'https://edhrec.com/commanders/ishai-ojutai-dragonspeaker-reyhan-last-of-the-abzan/counters-matter', linkLabel: 'See EDHREC’s Ishai-and-Reyhan counters page' }],
    swaps: [], sourceUrls: ['https://edhrec.com/precon/breed-lethality'], sourceLabel: 'EDHREC precon data', preconUrl: 'https://edhrec.com/precon/breed-lethality',
    coverage: 'partial', coverageNote: 'The earlier sample verifies easy upgrades and an alternate path; paired Top 25 swaps have not been researched for this page yet.',
  }),
  sampleGuide({
    id: 'sample-stalwart-unity-c16', setCode: 'c16', deckName: 'Stalwart Unity', commanderNames: ['Kynaios and Tiro of Meletis'],
    theme: 'Keep the four-color partner deck table-friendly: add a small group-draw core and practical color fixing, rather than premium staples or a hard-control rebuild.',
    picks: [
      { name: 'Dictate of Kruphix', slug: 'dictate-of-kruphix', reason: 'An affordable repeatable group-draw effect that reinforces the deck’s shared-resources plan.' },
      { name: 'Kwain, Itinerant Meddler', slug: 'kwain-itinerant-meddler', reason: 'Offers each player a small choice of cards or life, while giving you a low-cost political tool.' },
      { name: 'Farseek', slug: 'farseek', reason: 'A low-cost way to smooth four-color mana without spending on premium lands.' },
    ],
    alternatePaths: [{ title: 'Ludevic + Sidar — Commander 2016 partner politics', description: 'Both cards are in the same precon. Keep its four-color partner shell but shift from symmetrical land-and-card gifts toward political draws and attacks that are harder to block.', href: 'https://edhrec.com/precon/stalwart-unity/ludevic-necro-alchemist-sidar-kondo-of-jamuraa', linkLabel: 'See EDHREC’s Ludevic-and-Sidar precon page' }],
    swaps: [], sourceUrls: ['https://edhrec.com/commanders/kynaios-and-tiro-of-meletis/upgraded/group-hug/budget', 'https://edhrec.com/precon/stalwart-unity'], sourceLabel: 'EDHREC budget group-hug builds', preconUrl: 'https://edhrec.com/precon/stalwart-unity',
    coverage: 'partial', coverageNote: 'The earlier sample verifies easy upgrades and an alternate path; paired Top 25 swaps have not been researched for this page yet.',
  }),
  sampleGuide({
    id: 'sample-dance-elements-ecc', setCode: 'ecc', deckName: 'Dance of the Elements', commanderNames: ['Ashling, the Limitless'],
    theme: 'Keep the five-color Elemental typal, evoke, and enters-the-battlefield value plan; choose a few budget-oriented cards that reinforce the same tribal engine.',
    picks: [
      { name: 'Grave Sifter', slug: 'grave-sifter', reason: 'Returns Elemental cards from graveyards to hand, supporting the deck’s long-game tribal engine.', budgetNote: 'Included in EDHREC’s budget additions section when checked; recheck current price.' },
      { name: 'Mimic Vat', slug: 'mimic-vat', reason: 'Reuses a creature’s enters-the-battlefield value after it dies, staying close to the precon’s ETB plan.', budgetNote: 'Included in EDHREC’s budget additions section when checked; recheck current price.' },
      { name: 'Reflections of Littjara', slug: 'reflections-of-littjara', reason: 'Choosing Elemental copies later Elemental spells and keeps the tribal theme central.', budgetNote: 'Included in EDHREC’s budget additions section when checked; recheck current price.' },
      { name: 'Heartless Summoning', slug: 'heartless-summoning', reason: 'Reduces the cost of creature spells so the deck can deploy more of its Elemental engine.', budgetNote: 'Included in EDHREC’s budget additions section when checked; recheck current price.' },
    ],
    alternatePaths: [{ title: 'Mass of Mysteries — Elemental value variation', description: 'Use the in-precon Mass of Mysteries as the lead commander for a related five-color Elemental build; preserve the deck’s creature-type and enters-the-battlefield focus.', href: 'https://edhrec.com/precon/dance-of-the-elements/mass-of-mysteries', linkLabel: 'See EDHREC’s Mass of Mysteries-from-this-precon page' }],
    swaps: [], sourceUrls: ['https://edhrec.com/guides/dance-of-the-elements-lorwyn-eclipsed-precon-guide', 'https://edhrec.com/precon/dance-of-the-elements', 'https://magic.wizards.com/en/news/announcements/lorwyn-eclipsed-commander-decklists'], sourceLabel: 'EDHREC budget upgrade guide', preconUrl: 'https://edhrec.com/precon/dance-of-the-elements',
    coverage: 'partial', coverageNote: 'The earlier sample verifies budget-oriented upgrades and an in-precon alternate; paired Top 25 swaps have not been researched for this page yet.',
  }),
  sampleGuide({
    id: 'sample-abzan-armor-tdc', setCode: 'tdc', deckName: 'Abzan Armor', commanderNames: ['Felothar the Steadfast'],
    theme: 'Stay with Abzan toughness, defenders, and walls first; alternate paths can emphasize Doran’s toughness-matters combat or a bigger Betor lifegain pivot.',
    picks: [
      { name: 'Abzan Beastmaster', slug: 'abzan-beastmaster', reason: 'Rewards the deck for controlling its high-toughness creatures with repeatable card draw.', budgetNote: 'Named in EDHREC’s low-cost upgrade coverage; prices can change.' },
      { name: "Archers' Parapet", slug: 'archers-parapet', reason: 'A low-cost defender that turns the deck’s defensive board into a repeatable life-total tool.', budgetNote: 'Named in EDHREC’s low-cost upgrade coverage; prices can change.' },
      { name: 'Portcullis Vine', slug: 'portcullis-vine', reason: 'An inexpensive defender that can cash in a spare wall for a card when needed.', budgetNote: 'Named in EDHREC’s low-cost upgrade coverage; prices can change.' },
    ],
    alternatePaths: [
      { title: 'Doran, the Siege Tower — toughness-matters combat', description: 'Keep the Abzan wall shell but shift more of the plan toward attacking with high-toughness creatures; EDHREC discusses this as a same-theme route.', href: 'https://edhrec.com/articles/adapting-the-abzan-armor-precon-for-different-commander-brackets', linkLabel: 'Read EDHREC’s Abzan Armor bracket adaptation', sourceUrls: ['https://edhrec.com/articles/adapting-the-abzan-armor-precon-for-different-commander-brackets'] },
      { title: 'Betor, Ancestor’s Voice — lifegain/lifeloss pivot', description: 'A larger shift using an included commander: retain Abzan colors while leaning more into life gain and life-loss payoffs.', href: 'https://edhrec.com/articles/adapting-the-abzan-armor-precon-for-different-commander-brackets', linkLabel: 'Read EDHREC’s Betor variation notes', sourceUrls: ['https://edhrec.com/articles/adapting-the-abzan-armor-precon-for-different-commander-brackets'] },
    ],
    swaps: [], sourceUrls: ['https://edhrec.com/articles/abzan-armor-precon-guide-tarkir-dragonstorm', 'https://edhrec.com/articles/adapting-the-abzan-armor-precon-for-different-commander-brackets', 'https://edhrec.com/precon/abzan-armor', 'https://magic.wizards.com/en/news/announcements/tarkir-dragonstorm-commander-decklists'], sourceLabel: 'EDHREC upgrade and bracket guides', preconUrl: 'https://edhrec.com/precon/abzan-armor',
    coverage: 'partial', coverageNote: 'The earlier sample verifies theme-aligned budget adds and alternate paths; paired Top 25 swaps have not been researched for this page yet.',
  }),
  sampleGuide({
    id: 'sample-most-wanted-otc', setCode: 'otc', deckName: 'Most Wanted', commanderNames: ['Olivia, Opulent Outlaw'],
    theme: 'Build on Olivia’s outlaw and Treasure plan with low-cost outlaws and Treasure payoffs; skip unrelated crossover suggestions from the source.',
    picks: [
      { name: 'Hellspur Posse Boss', slug: 'hellspur-posse-boss', reason: 'Adds more outlaw bodies and rewards the deck’s attack-and-Treasure plan.', budgetNote: 'EDHREC’s guide used a $5-or-less budget at publication; recheck current price.' },
      { name: 'Swashbuckler Extraordinaire', slug: 'swashbuckler-extraordinaire', reason: 'Supports the outlaw theme and converts combat into additional Treasure value.', budgetNote: 'EDHREC’s guide used a $5-or-less budget at publication; recheck current price.' },
      { name: 'Tin Street Dodger', slug: 'tin-street-dodger', reason: 'A low-cost evasive outlaw that helps keep combat triggers flowing.', budgetNote: 'EDHREC’s guide used a $5-or-less budget at publication; recheck current price.' },
      { name: 'Reckless Fireweaver', slug: 'reckless-fireweaver', reason: 'Turns the deck’s repeated Treasure creation into steady damage without changing its core plan.', budgetNote: 'EDHREC’s guide used a $5-or-less budget at publication; recheck current price.' },
    ],
    alternatePaths: [{ title: 'Vihaan, Goldwaker — Treasure-and-outlaw variation', description: 'Use the in-precon Vihaan to make Treasure tokens central to the creature plan while keeping the Outlaws of Thunder Junction theme.', href: 'https://edhrec.com/precon/most-wanted/vihaan-goldwaker', linkLabel: 'See EDHREC’s Vihaan-from-this-precon page' }],
    swaps: [], sourceUrls: ['https://edhrec.com/articles/most-wanted-thunder-junction-precon-upgrade-guide', 'https://edhrec.com/precon/most-wanted', 'https://magic.wizards.com/en/news/announcements/outlaws-of-thunder-junction-commander-decklists'], sourceLabel: 'EDHREC budget upgrade guide', preconUrl: 'https://edhrec.com/precon/most-wanted',
    coverage: 'partial', coverageNote: 'The earlier sample verifies budget-minded, in-theme adds and a same-precon alternate; paired Top 25 swaps have not been researched for this page yet.',
  }),
];

const generatedGuides = (generated.guides ?? []) as CommanderPreconUpgradeGuide[];
export const commanderPreconUpgradeGuides: CommanderPreconUpgradeGuide[] = [...samplePreconUpgradeGuides, ...generatedGuides];
export const upgradeResearchComplete = generated.researchComplete === true;

export function normalizeUpgradeCardName(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
}

function cardNameVariants(value: string): string[] {
  return [value, ...value.split(/\s*\/\/\s*/)].map(normalizeUpgradeCardName).filter(Boolean);
}

export function getCommanderPreconUpgradeGuide(deck: { setCode?: string; deckName?: string; commanderNames?: string[] }): CommanderPreconUpgradeGuide | undefined {
  const setCode = deck.setCode?.trim().toLocaleLowerCase();
  const deckName = deck.deckName?.trim().toLocaleLowerCase();
  if (setCode && deckName) {
    return commanderPreconUpgradeGuides.find((guide) => guide.setCode.toLocaleLowerCase() === setCode && guide.deckName.trim().toLocaleLowerCase() === deckName);
  }
  const names = new Set((deck.commanderNames ?? []).map((name) => name.trim().toLocaleLowerCase()));
  const matches = commanderPreconUpgradeGuides.filter((guide) => guide.commanderNames.some((name) => names.has(name.toLocaleLowerCase())));
  return matches.length === 1 ? matches[0] : undefined;
}

export function getUpgradeOwnership(cardName: string, localOwnedCards: OwnedCard[] = []): PreconOwnershipMatch {
  const keys = cardNameVariants(cardName);
  const matches = localOwnedCards.filter((card) => cardNameVariants(card.name).some((key) => keys.includes(key)) && card.quantity > 0);
  const quantity = matches.reduce((sum, card) => sum + card.quantity, 0);
  if (quantity <= 0) {
    return { status: 'unknown', note: 'Not found in this viewer’s local collection. This does not mean you do not own it; verify before buying.' };
  }
  const printings = new Set<string>();
  for (const card of matches) {
    const printing = [card.setCode, card.collectorNumber, card.finish].filter(Boolean).join(' · ');
    if (printing) printings.add(printing);
  }
  return {
    status: 'owned', quantity,
    printings: Array.from(printings).sort(),
    note: 'Matched against this viewer’s locally stored collection; counts do not reserve copies already in other decks.',
  };
}
