import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowRight, BookOpen, Check, Clock3, Layers3, List, MonitorPlay, ShoppingBag, TrendingUp } from 'lucide-react';
import { cardReference } from '@/lib/brawlDecks';
import { battleBoxReferences } from '@/lib/battleBoxStrategy';
import { MarketPostMarkdown } from './MarketPostMarkdown';
import { marketJournalWithEmbeds } from '@/lib/marketJournalEmbeds';
import './journal-reading.css';

export type ReadingArticle = { slug: string; title: string; body: string; summary: string };
const features = {
  'remote-play-shuffle-tests': {
    label: 'Choose your table', icon: MonitorPlay, card: 'The Wise Mothman',
    href: '/brawl-box/the-wise-mothman',
    takeaways: ['Pick a webcam, browser, or digital-client table.', 'Copy or download a list, then review the import.', 'Test opening hands before buying physical cards.'],
    action: 'Explore the Brawlternative shelf', target: '/brawl-box',
  },
  'brawlternative-shelf-roundup': {
    label: 'Find your next brew', icon: Layers3, card: 'The Wise Mothman',
    href: '/brawl-box/the-wise-mothman',
    takeaways: ['Seven distinct custom 60-card Commander previews.', 'Three editorial finishes keep submitted lists intact.', 'Read the plan, export the list, then test the matchup.'],
    action: 'Browse all seven decks', target: '#deck-library',
  },
  'battle-box-october-17-recap': {
    label: 'Build a game night', icon: Layers3, card: 'Cavalcade of Calamity',
    href: '/battle-box/goblin-cavalcade',
    takeaways: ['Nine shared 60-card decks, each with its own game plan.', 'The build record and new deck pages have distinct dates.', 'Check source warnings and agree on house rules first.'],
    action: 'Choose a Battle Box deck', target: '#deck-library',
  },
  'commanders-100-percent-worth-building-around': {
    label: 'Watch, then build', icon: MonitorPlay, card: 'Sakiko, Mother of Summer',
    href: '/card/Sakiko%2C%20Mother%20of%20Summer',
    imageUrl: 'https://i.ytimg.com/vi/9Zg1zAsXsQ8/hqdefault.jpg',
    takeaways: ['Seven chaptered commanders with distinct build-around constraints.', 'Short video excerpts are labeled capture notes, not certified transcript quotes.', 'Open each card profile and test the plan before buying into it.'],
    action: 'Open the Commander Library', target: '/commander',
  },
  'simple-builds-that-dominate-your-playgroup': {
    label: 'Simple build showcase', icon: MonitorPlay, card: 'Jasmine Boreal of the Seven',
    href: '/card/Jasmine%20Boreal%20of%20the%20Seven',
    imageUrl: 'https://i.ytimg.com/vi/x8KK0-U8FAc/hqdefault.jpg',
    takeaways: ['Eight commander showcases from the video and its retrieved captions.', 'Each section reduces the deck to a short, testable set of jobs.', 'Quoted excerpts include timestamps and link back to the original video.'],
    action: 'Browse the Commander Library', target: '/commander',
  },
  'eight-simple-commander-deck-blueprints': {
    label: 'Build the shells', icon: Layers3, card: 'Jasmine Boreal of the Seven',
    href: '/card/Jasmine%20Boreal%20of%20the%20Seven',
    imageUrl: 'https://i.ytimg.com/vi/x8KK0-U8FAc/hqdefault.jpg',
    takeaways: ['Eight practical construction briefs rather than copied decklists.', 'Opening-hand tests, closing plans, and failure modes for every commander.', 'Use the briefs as a starting point, then tune for your collection and table.'],
    action: 'Start in the Commander Library', target: '/commander',
  },
  'invisible-woman-build-the-wall': {
    label: 'Fantastic Four upgrade desk', icon: Layers3, card: 'Invisible Woman',
    href: '/card/Invisible%20Woman',
    takeaways: ['Build Invisible Woman as defensive spellslinger tokens, not generic four-color value.', 'Start with cheap interaction, token engines, and High Alert before premium doublers.', 'Import the full ManaBox export before treating any card as a confirmed buy.'],
    action: 'Open the Commander Library', target: '/commander',
  },
  'typa-restock-alerts-reality-fracture': {
    label: 'Restock desk · FOMO control', icon: MonitorPlay, card: 'TYPA restock alerts',
    href: 'https://apps.apple.com/app/id6744125469', imageUrl: 'https://api.scryfall.com/cards/named?exact=Reality%20Fracture&format=image&version=normal',
    takeaways: ['Use a small, budget-approved watchlist instead of tracking every trending product.', 'A restock alert is an availability signal, not proof that the price is good.', 'The Reality Fracture bundle example shows how a focused alert can turn into a real find.'],
    action: 'Open TYPA on the App Store', target: 'https://apps.apple.com/app/id6744125469',
  },
  'star-trek-adventure-deck-building-2026-11-10': {
    label: 'Star Trek adventure deck lab', icon: Layers3, card: 'The Borg Queen',
    href: '/market-watch#precon-market-signals-heading', imageUrl: 'https://api.scryfall.com/cards/named?exact=The%20Borg%20Queen&format=image&version=normal',
    takeaways: ['Four Star Trek missions stay distinct instead of becoming one shared-staple pile.', 'The Campaign Box and Brawlternative Box remain separate construction layers.', 'Wait for release-week supply before buying speculative Star Trek singles.'],
    action: 'Open the Star Trek market watch', target: '/market-watch',
  },
  'deckbox-decks-visual-archive-2026-11-10': {
    label: 'Deckbox public archive', icon: BookOpen, card: 'Delraich',
    href: '/battle-box/deckbox/deck-black-grave-delrach-sac', imageUrl: 'https://api.scryfall.com/cards/named?exact=Delraich&format=image&version=normal',
    takeaways: ['Six saved lists remain inspectable as source records.', 'Public rows and card roles do not expose private ownership or ManaBox data.', 'Open each list to review categories, quantities, and the downloadable source copy.'],
    action: 'Open the Deckbox archive', target: '/battle-box',
  },
  'precon-upgrade-market-radar-2026-11-10': {
    label: 'Precon market desk', icon: TrendingUp, card: "Primevals' Glorious Rebirth",
    href: '/market-watch#precon-market-signals-heading', imageUrl: 'https://api.scryfall.com/cards/named?exact=Primevals%27%20Glorious%20Rebirth&format=image&version=normal',
    takeaways: ['Each signal connects a precon, commander, bottleneck, and direct add/cut.', 'Buy for play, wait for supply, watch, and leave-alone postures stay separate.', 'Dated prices are observations, not live quotes or investment advice.'],
    action: 'Open the precon signal module', target: '/market-watch#precon-market-signals-heading',
  },
  'star-trek-before-launch-market-watch-2026-11-07': {
    label: 'Star Trek release watch', icon: TrendingUp, card: 'The Borg Queen',
    href: '/market-report/star-trek-market-watch-2026-11-07', imageUrl: 'https://api.scryfall.com/cards/named?exact=The%20Borg%20Queen&format=image&version=normal',
    takeaways: ['A dated pre-release baseline for the Star Trek Commander launch.', 'Reported listing moves remain separate from completed-sale evidence.', 'Wait for release-week supply and depth before buying speculative singles.'],
    action: 'Open the dated release watch', target: '/market-report/star-trek-market-watch-2026-11-07',
  },
  'star-trek-potential-movers-play-first-2026-11-08': {
    label: 'Star Trek potential movers', icon: TrendingUp, card: "Jhoira's Familiar",
    href: '/market-report/star-trek-potential-movers-2026-11-08', imageUrl: 'https://api.scryfall.com/cards/named?exact=Jhoira%27s%20Familiar&format=image&version=normal',
    takeaways: ['Separates deck-fit cards from adjacent research and unverified price narratives.', 'Uses a shared-copy tray instead of assuming four copies are needed.', 'The provisional basket is a play plan, not a buy recommendation.'],
    action: 'Open the potential-mover radar', target: '/market-report/star-trek-potential-movers-2026-11-08',
  },
  'star-trek-campaign-and-brawlternative-resource-guide-2026-11-10': {
    label: 'Star Trek resource desk', icon: Layers3, card: 'General Chang, Cold Warrior',
    href: '/star-trek-campaign-box', imageUrl: 'https://api.scryfall.com/cards/named?exact=General%20Chang%2C%20Cold%20Warrior&format=image&version=normal',
    takeaways: ['Campaign Box and Brawlternative Box remain separate construction layers.', 'Official precon, proxy, sealed, and scanned-card records do not merge.', 'Use the guide as a handoff between the public resource pages.'],
    action: 'Open the Campaign Box', target: '/star-trek-campaign-box',
  },
  'star-trek-four-missions-deck-idea-2026-11-10': {
    label: 'Star Trek four-mission clinic', icon: Layers3, card: 'Tireless Provisioner',
    href: '/market-report/star-trek-deck-idea-2026-11-10', imageUrl: 'https://api.scryfall.com/cards/named?exact=Tireless%20Provisioner&format=image&version=normal',
    takeaways: ['Federation, Borg, Landing Party, and Klingon Fury keep distinct jobs.', 'Shared bridge cards are allocated after playtesting, not duplicated by default.', 'The market layer helps time a purchase without defining the deck.'],
    action: 'Open the four-mission clinic', target: '/market-report/star-trek-deck-idea-2026-11-10',
  },
  'precon-swerve-roberts-plague-of-locusts': {
    label: 'Precon swerve · swarm engine', icon: TrendingUp, card: 'The Locust God',
    href: '/deck-gallery/deck-locust-s-locusts-robogles-build', imageUrl: 'https://api.scryfall.com/cards/named?exact=The%20Locust%20God&format=image&version=normal',
    takeaways: ['Card draw becomes an army of hasty flying Insects.', 'Portable staples keep the theme intact instead of flattening it into generic Izzet value.', 'Open the preserved Robogles list before treating the article as an upgrade guide.'],
    action: 'Open the Locust’s Locusts decklist', target: '/deck-gallery/deck-locust-s-locusts-robogles-build',
  },
  'precon-swerve-breya-scrap-to-lethal': {
    label: 'Precon swerve · artifact combo', icon: Layers3, card: 'Breya, Etherium Shaper',
    href: '/deck-gallery/deck-breya-facts-robogles-build', imageUrl: 'https://api.scryfall.com/cards/named?exact=Breya%2C%20Etherium%20Shaper&format=image&version=normal',
    takeaways: ['The Robogles source remains a 60-card WIP, not an invented Commander list.', 'Altars, recursion, and tutors define the Scrap to Lethal pipeline.', 'Compare the source WIP with the separate Breya Facts archive record.'],
    action: 'Open the Breya source decklist', target: '/deck-gallery/deck-breya-facts-robogles-build',
  },
  'star-trek-spoiler-season-movers-2026-11-11': {
    label: 'Star Trek spoiler-season desk', icon: TrendingUp, card: 'Unexpected Windfall',
    href: '/market-watch#star-trek-upgrade-radar-heading', imageUrl: 'https://api.scryfall.com/cards/named?exact=Unexpected%20Windfall&format=image&version=normal',
    takeaways: ['Separates confirmed historical movers from unverified Star Trek synergy theses.', 'Maps artifact, landfall, combat, and energy questions to all four deck clinics.', 'Keeps the release-week posture at watch until lists and supply are verified.'],
    action: 'Open the Star Trek spoiler radar', target: '/market-watch#star-trek-upgrade-radar-heading',
  },
  'precon-upgrade-radar-2026-11-11': {
    label: 'Precon upgrade desk · November 11', icon: TrendingUp, card: "Sythis, Harvest's Hand",
    href: '/precon-upgrades?deck=adaptive-enchantment', imageUrl: 'https://api.scryfall.com/cards/named?exact=Sythis%2C%20Harvest%27s%20Hand&format=image&version=normal',
    takeaways: ['Estrid gets a strict sub-$50 upgrade path with a $3.08 observed two-card package.', 'Calling All Angels stays on a wait-for-supply posture until Foundations is open.', 'Exact printing, shipping, and completed-sale checks remain required.'],
    action: 'Open the precon upgrade desk', target: '/precon-upgrades?deck=adaptive-enchantment',
  },
};
export function readingFeature(slug: string) { return features[slug as keyof typeof features]; }
export function readingMinutes(body: string) { return Math.max(1, Math.ceil(body.split(/\s+/).length / 220)); }
export function headingId(text: string) { return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); }
export function articleSections(body: string) {
  return Array.from(body.matchAll(/^## (.+)$/gm)).map(match => ({ title: match[1], id: headingId(match[1]) }));
}

export function ArticleCover({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const feature = readingFeature(slug);
  if (!feature) return null;
  const ref = journalCardImage(slug);
  if (!ref?.imageUrl) return null;
  const artOnly = slug === 'battle-box-october-17-recap' || slug.startsWith('star-trek-');
  const external = feature.href.startsWith('https://');
  const image = <img src={artOnly ? ref.artUrl : ref.imageUrl} alt={artOnly ? `Representative artwork for Goblin Cavalcade` : feature.card} width={artOnly ? '626' : '488'} height={artOnly ? '457' : '680'} loading={compact ? 'lazy' : 'eager'} />;
  return <figure className={`journal-cover ${compact ? 'journal-cover--compact' : ''} ${artOnly ? 'journal-cover--art' : 'journal-cover--commander'}`}>
    {external ? <a href={feature.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${feature.card}`} className="journal-cover-link">{image}</a> : <Link href={feature.href} aria-label={`Explore ${feature.card}`} className="journal-cover-link">{image}</Link>}
    <figcaption><span>{artOnly ? 'Representative deck artwork' : external ? 'User-supplied app evidence' : 'Primary commander · full card'}</span>{external ? <a href={feature.href} target="_blank" rel="noopener noreferrer">{feature.card} <ArrowRight size={14} aria-hidden="true" /></a> : <Link href={feature.href}>{feature.card} <ArrowRight size={14} aria-hidden="true" /></Link>}{!artOnly && !external && cardReference(feature.card)?.oracleText && <p className="journal-cover-oracle"><strong>Oracle text</strong><br />{cardReference(feature.card)!.oracleText}</p>}<small>{external ? 'Screenshot supplied by the author · app details linked to the App Store' : `Card art${artOnly ? '' : ' and Oracle text'} via Scryfall · © Wizards of the Coast`}</small></figcaption>
  </figure>;
}

export function journalCardImage(slug: string) {
  const feature = readingFeature(slug);
  if (!feature) return undefined;
  if ('imageUrl' in feature && feature.imageUrl) return { imageUrl: feature.imageUrl, artUrl: feature.imageUrl.replace(/version=normal/, 'version=art_crop') };
  const brawl = cardReference(feature.card);
  if (brawl) return { imageUrl: brawl.imageUrl ?? undefined, artUrl: brawl.artUrl ?? undefined };
  const battle = battleBoxReferences[feature.card];
  return battle ? { imageUrl: battle.image_uris?.normal, artUrl: battle.image_uris?.normal?.replace('/normal/', '/art_crop/') } : undefined;
}

const editorialSpotlights: Record<string, { heading: string; description: string; cards: { name: string; label: string; reason: string }[] }> = {
  'commanders-100-percent-worth-building-around': {
    heading: 'Commanders from the Commander’s Quarters feature',
    description: 'Representative current printings for the seven build-around chapters. Images identify the cards; they are not ownership or edition claims.',
    cards: [
      { name: 'Sakiko, Mother of Summer', label: 'Combat-to-mana engine', reason: 'Turns successful combat into a mana reserve for the next main phase.' },
      { name: 'Meria, Scholar of Antiquity', label: 'Artifact resource engine', reason: 'Makes ordinary artifacts useful as either mana or cards.' },
      { name: 'Alaundo the Seer', label: 'Time-counter engine', reason: 'Builds delayed card advantage around creatures and time counters.' },
      { name: 'Valduk, Keeper of the Flame', label: 'Temporary-equipment pressure', reason: 'Converts equipped creatures into a burst of attacking Elementals.' },
      { name: 'Memnarch', label: 'Artifact control project', reason: 'Uses blue mana and artifacts to take over a long game.' },
      { name: 'Denry Klin, Editor in Chief', label: 'Counter distribution', reason: 'Turns counters into a board-development engine instead of a single threat.' },
      { name: 'Nikya of the Old Ways', label: 'Creature-only constraint', reason: 'Trades noncreature flexibility for explosive creature-based mana.' },
    ],
  },
  'simple-builds-that-dominate-your-playgroup': {
    heading: 'Commanders from the simple-build showcase',
    description: 'The feature’s eight commanders, shown as a quick visual index before the strategy chapters.',
    cards: [
      { name: 'Jasmine Boreal of the Seven', label: 'Vanilla evasion', reason: 'Makes ability-free creatures into a focused evasive threat package.' },
      { name: 'Yargle and Multani', label: 'Commander damage', reason: 'Treats a 18-power commander as a problem to protect and connect.' },
      { name: 'Arcades, the Strategist', label: 'Defender tempo', reason: 'Turns high-toughness defenders into cards and attacking bodies.' },
      { name: 'Edric, Spymaster of Trest', label: 'Evasive card draw', reason: 'Rewards small creatures that can reliably hit an opponent.' },
      { name: 'Ovika, Enigma Goliath', label: 'Spells-to-Goblins', reason: 'Converts noncreature spells into a hasty token army.' },
      { name: 'Omnath, Locus of Mana', label: 'Mana-bank Voltron', reason: 'Stores green mana and turns it into a growing threat.' },
      { name: 'Mr. Orfeo, the Boulder', label: 'Power doubling', reason: 'Doubles a creature’s power and turns the combat step into damage.' },
      { name: 'Ruric Thar, the Unbowed', label: 'Spell punishment', reason: 'Makes noncreature spells painful for opponents to cast.' },
    ],
  },
  'eight-simple-commander-deck-blueprints': {
    heading: 'Visual index of the eight blueprints',
    description: 'Each card anchors one budget-aware shell in the companion build guide.',
    cards: [
      { name: 'Jasmine Boreal of the Seven', label: 'Vanilla evasion midrange', reason: 'Efficient creatures, protection, and ability-free payoffs.' },
      { name: 'Yargle and Multani', label: 'Commander-damage Voltron', reason: 'Pump, evasion, and protection built around one huge body.' },
      { name: 'Arcades, the Strategist', label: 'Defender tempo', reason: 'Defenders become mana, cards, and attackers.' },
      { name: 'Edric, Spymaster of Trest', label: 'Evasive tempo', reason: 'Small evasive creatures become the deck’s draw engine.' },
      { name: 'Ovika, Enigma Goliath', label: 'Hasty Phyrexians', reason: 'Noncreature spells create pressure without giving up interaction.' },
      { name: 'Omnath, Locus of Mana', label: 'Mana-bank Voltron', reason: 'Land ramp feeds a protected, oversized commander.' },
      { name: 'Mr. Orfeo, the Boulder', label: 'Fling and combat damage', reason: 'Power doubling supports both attacks and sacrifice finishes.' },
      { name: 'Ruric Thar, the Unbowed', label: 'Creature-heavy punishment', reason: 'The deck minimizes its own noncreature exposure.' },
    ],
  },
  'brawlternative-shelf-roundup': {
    heading: 'The three finished Brawlternative proposals',
    description: 'Representative commanders for the three fully revised shelf entries.',
    cards: [
      { name: 'The Wise Mothman', label: 'Counters and radiation', reason: 'A graveyard and counter plan with a clear first test.' },
      { name: 'Rakdos, Lord of Riots', label: 'Life-loss sequencing', reason: 'A theatrical creature plan that depends on getting the order right.' },
      { name: 'Karlov of the Ghost Council', label: 'Life-gain pressure', reason: 'Small life-gain events become a large commander and a resilient board.' },
    ],
  },
  'invisible-woman-build-the-wall': {
    heading: 'Cards that change the deck’s posture',
    description: 'Representative current printings from Scryfall for the Invisible Woman Wall conversion.',
    cards: [
      { name: 'Invisible Woman', label: 'Commander engine', reason: 'Cast a noncreature spell before combat, then turn the resulting Wall into a real board plan.' },
      { name: 'Shark Typhoon', label: 'Spell-to-token engine', reason: 'Cycles as a cheap trigger or turns later noncreature spells into evasive threats.' },
      { name: 'Third Path Iconoclast', label: 'Budget token maker', reason: 'Makes the interaction and cantrips already in the deck produce additional bodies.' },
      { name: 'High Alert', label: 'Wall conversion', reason: 'Turns the deck’s high-toughness defensive board into a legitimate attacking force.' },
      { name: 'Impact Tremors', label: 'Noncombat finisher', reason: 'Lets repeated token production close games without exposing every creature to combat.' },
      { name: 'Parallel Lives', label: 'Token multiplier', reason: 'Doubles Walls, Sharks, Monks, and other tokens after the engine is online.' },
      { name: 'Cryptolith Rite', label: 'Token-to-mana bridge', reason: 'Turns a wide board into the colored mana needed for a large spell or activation turn.' },
      { name: 'Aetherflux Reservoir', label: 'High-power alternate win', reason: 'Converts a protected chain of cheap noncreature spells into a noncombat table finish.' },
    ],
  },
  'remote-play-shuffle-tests': {
    heading: 'The Wise Mothman · visual deck desk',
    description: 'A representative commander image and current Scryfall USD reference for the remote-play guide’s featured deck.',
    cards: [{ name: 'The Wise Mothman', label: 'Counters and radiation', reason: 'A visual anchor for the counter, mill, and radiation test described in the remote-play guide.' }],
  },
  'battle-box-october-17-recap': {
    heading: 'Battle Box · featured deck desk',
    description: 'A representative card image and current Scryfall USD reference for the Battle Box recap’s first featured deck.',
    cards: [{ name: 'Goblin Rabblemaster', label: 'Fast pressure', reason: 'A representative threat for the Goblin Cavalcade matchup and its short combat clock.' }],
  },
  'star-trek-adventure-deck-building-2026-11-10': {
    heading: 'Star Trek adventure deck cards',
    description: 'Representative current printings for the four mission lanes. Use the campaign and radar links to inspect the complete build surfaces.',
    cards: [
      { name: 'The Borg Queen', label: 'Assimilation anchor', reason: 'The commander route that makes artifact creatures and opposing graveyards the central question.' },
      { name: "Jhoira's Familiar", label: 'Historic cost reduction', reason: 'A Federation Fleet bridge for making historic permanents and Spacecraft easier to deploy.' },
      { name: 'Tatyova, Benthic Druid', label: 'Landfall draw', reason: 'A Landing Party payoff that turns the land plan into cards.' },
      { name: 'General Chang, Cold Warrior', label: 'Combat support', reason: 'A Klingon Fury direction that keeps attacks and temporary attackers meaningful.' },
      { name: 'Mindcrank', label: 'Graveyard bridge', reason: 'A low-cost Borg experiment that can fill opposing graveyards through incidental life loss.' },
      { name: 'Mesmeric Orb', label: 'High-risk mill', reason: 'A stronger but more expensive universal mill test to wait on until supply settles.' },
    ],
  },
  'deckbox-decks-visual-archive-2026-11-10': {
    heading: 'Deckbox archive card frames',
    description: 'Representative cards from the six saved public lists. Images identify the cards; they do not certify the original printing or legality.',
    cards: [
      { name: 'Delraich', label: 'Sacrifice payoff', reason: 'The anchor for the black graveyard and expendable-creature list.' },
      { name: 'Dark Ritual', label: 'Early acceleration', reason: 'A visible part of the Delraich source list’s fast-start identity.' },
      { name: 'The Rack', label: 'Discard clock', reason: 'Turns the Shadow Rack list’s hand pressure into repeatable damage.' },
      { name: "Emrakul's Hatcher", label: 'Spawn engine', reason: 'The Eldrazi half-list’s bridge from early development to larger threats.' },
      { name: 'Giant Growth', label: 'Combat pump', reason: 'A simple green-aggro signal that makes the saved list’s combat math legible.' },
      { name: 'Clot Sliver', label: 'Team protection', reason: 'The modified Slivers list’s explicit defensive role.' },
    ],
  },
  'precon-upgrade-market-radar-2026-11-10': {
    heading: 'Precon upgrade signal cards',
    description: 'The Gemini brief’s anchors, bridges, and direct upgrade candidates, shown as framed card references before the decision notes.',
    cards: [
      { name: 'The Borg Queen', label: 'Star Trek anchor', reason: 'The release-week commander behind the wait-for-supply posture.' },
      { name: 'Mindcrank', label: 'Borg bridge', reason: 'A low-cost graveyard-filling experiment with a documented tradeoff.' },
      { name: 'Dihada, Binder of Wills', label: 'Mardu commander', reason: "The Legends' Legacy engine for filling the graveyard and supporting legendary permanents." },
      { name: "Primevals' Glorious Rebirth", label: 'Play-first upgrade', reason: 'The direct add that converts a stocked legendary graveyard into a large recovery turn.' },
      { name: 'Doctor Doom, King of Latveria', label: 'Marvel anchor', reason: 'The artifact-and-villain control commander in the supplied clinic.' },
      { name: 'Lightning Greaves', label: 'Protection upgrade', reason: 'A useful zero-equip swap whose observed price kept it outside the current buy posture.' },
    ],
  },
  'precon-swerve-roberts-plague-of-locusts': {
    heading: 'The Locust’s Locusts · swarm package',
    description: 'Representative cards from Robert’s The Locust God build. Use the decklist link in the article to inspect the complete saved source record.',
    cards: [
      { name: 'The Locust God', label: 'Commander engine', reason: 'Turns every card drawn into a hasty flying Insect.' },
      { name: 'Windfall', label: 'Wheel trigger', reason: 'Refills hands while converting the table-wide draw into a new swarm.' },
      { name: 'Skullclamp', label: 'Hive mind draw', reason: 'Sacrifices an individual Insect to create more cards and more bodies.' },
      { name: 'Impact Tremors', label: 'Token-entry finisher', reason: 'Lets the swarm damage opponents without needing every Insect to connect.' },
      { name: 'Throne of the God-Pharaoh', label: 'End-step drain', reason: 'Turns a tapped-out swarm into inevitable life loss.' },
    ],
  },
  'precon-swerve-breya-scrap-to-lethal': {
    heading: 'Breya · Scrap to Lethal package',
    description: 'Representative cards from the artifact-combo pipeline. The source deck remains a separate 60-card WIP; these are the proposed role anchors, not an automatic legality claim.',
    cards: [
      { name: 'Breya, Etherium Shaper', label: 'Artifact commander idea', reason: 'Creates the disposable thopters that make the sacrifice loop possible.' },
      { name: "Ashnod's Altar", label: 'Mana altar', reason: 'Converts thopters and artifacts into the colorless mana that fuels recursion.' },
      { name: 'Krark-Clan Ironworks', label: 'Artifact altar', reason: 'Adds a second sacrifice-to-mana engine for the lethal pipeline.' },
      { name: 'Nim Deathmantle', label: 'Recursion engine', reason: 'Pairs with Breya and an altar to repeat the enter-the-battlefield loop.' },
      { name: 'Fabricate', label: 'Budget tutor', reason: 'Finds an artifact engine without assuming every list needs premium tutors.' },
    ],
  },
  'star-trek-spoiler-season-movers-2026-11-11': {
    heading: 'Star Trek spoiler-season watch cards',
    description: 'Portable Universes Beyond evidence beside the four Star Trek deck roles. Star Trek synergy remains developing until release-week supply is visible.',
    cards: [
      { name: 'Unexpected Windfall', label: 'Portable UB staple', reason: 'A Fallout artifact-and-Treasure card with sustained movement in the supplied brief; verify the exact printing before acting.' },
      { name: 'Leonardo da Vinci', label: 'Supply compression case', reason: 'A reminder that sealed-product opening can overwhelm narrow Commander demand.' },
      { name: "Jhoira's Familiar", label: 'Federation Fleet bridge', reason: 'Historic cost reduction is the clearest existing artifact-role test for the Star Trek clinics.' },
      { name: 'Tatyova, Benthic Druid', label: 'Landing Party bridge', reason: 'Landfall draw gives the deck a durable baseline before speculative energy additions.' },
      { name: 'General Chang, Cold Warrior', label: 'Klingon Fury bridge', reason: 'Combat support keeps artifact additions subordinate to the deck\'s attack plan.' },
      { name: 'Borg Cube', label: 'Borg route test', reason: 'Artifact-creature support belongs after choosing The Borg Queen, Locutus, or charge counters.' },
    ],
  },
  'precon-upgrade-radar-2026-11-11': {
    heading: "Today's precon upgrade anchors",
    description: "The two commander clinics behind today's decision: buy the small Estrid upgrades for play and wait on Foundations supply for Giada.",
    cards: [
      { name: 'Estrid, the Masked', label: 'Adaptive Enchantment anchor', reason: 'Untaps enchanted permanents and rewards a resilient enchantress draw package.' },
      { name: "Sythis, Harvest's Hand", label: 'Buy-for-play upgrade', reason: 'Replaces symmetrical draw with enchantment-cast triggers and lifegain; supplied observation $2.41.' },
      { name: 'Jukai Naturalist', label: 'Penny upgrade', reason: "Makes Auras cheaper and stays inside Estrid's existing enchantment identity; supplied observation $0.67." },
      { name: "Enchantress's Presence", label: 'Draw bridge', reason: 'The durable card-flow layer that keeps the deck functioning after an enchantress is removed.' },
      { name: 'Giada, Font of Hope', label: 'Calling All Angels anchor', reason: 'Accelerates Angels and adds counters, but the Foundations release still needs a supply check.' },
      { name: 'Flawless Maneuver', label: 'Wait-for-release protection', reason: 'A logical Giada protection test at the supplied $8.99 observation, with the stock-list cut still unverified.' },
    ],
  },
};

type SpotlightCard = { name: string; label: string; reason: string; imageUrl?: string; scryfallUri?: string; usd?: string | null; usdFoil?: string | null };

export function CardSpotlightGallery({ slug }: { slug: string }) {
  const [cards, setCards] = useState<SpotlightCard[]>([]);
  const spotlightSet = editorialSpotlights[slug];
  useEffect(() => {
    if (!spotlightSet) return;
    const localCards = spotlightSet.cards.map(spotlight => ({ ...spotlight, imageUrl: cardReference(spotlight.name)?.imageUrl ?? undefined }));
    setCards(localCards);
    let cancelled = false;
    const load = async () => {
      const results = await Promise.all(spotlightSet.cards.map(async (spotlight) => {
        try {
          const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(spotlight.name)}`);
          if (!response.ok) return { ...spotlight, imageUrl: cardReference(spotlight.name)?.imageUrl ?? undefined };
          const card = await response.json() as { image_uris?: { normal?: string }; scryfall_uri?: string; prices?: { usd?: string | null; usd_foil?: string | null } };
          return { ...spotlight, imageUrl: card.image_uris?.normal, scryfallUri: card.scryfall_uri, usd: card.prices?.usd, usdFoil: card.prices?.usd_foil };
        } catch {
          return { ...spotlight, imageUrl: cardReference(spotlight.name)?.imageUrl ?? undefined };
        }
      }));
      if (!cancelled) setCards(results);
    };
    void load();
    return () => { cancelled = true; };
  }, [slug, spotlightSet]);
  if (!spotlightSet || !cards.length) return null;
  return <section className="journal-card-gallery" aria-label={`${spotlightSet.heading} card imagery`}>
    <div className="journal-card-gallery-heading"><div><p className="journal-eyebrow">Card desk · featurettes</p><h2>{spotlightSet.heading}</h2></div><p>{spotlightSet.description}</p></div>
    <div className="journal-card-gallery-grid">{cards.map(card => <article key={card.name} className="journal-card-spotlight">
      <div className="journal-card-spotlight-image">{card.imageUrl ? <img src={card.imageUrl} alt={`${card.name} card art`} loading="lazy" /> : <span>{card.name}</span>}</div>
      <div className="journal-card-spotlight-copy"><p className="journal-eyebrow">{card.label}</p><h3>{card.name}</h3><p>{card.reason}</p><div className="journal-price-widget" aria-label={`Current price reference for ${card.name}`}><span>Current Scryfall USD</span><strong>{card.usd ? `$${card.usd}` : 'Unavailable'}</strong>{card.usdFoil && <small>Foil ${card.usdFoil}</small>}<em>Reference only · not a quote or ownership record</em></div>{card.scryfallUri && <a href={card.scryfallUri} target="_blank" rel="noopener noreferrer">Verify printing and prices on Scryfall →</a>}</div>
    </article>)}</div>
  </section>;
}

export function ReadingOverview({ article }: { article: ReadingArticle }) {
  const feature = readingFeature(article.slug);
  const sections = articleSections(article.body);
  const Icon = feature?.icon ?? BookOpen;
  const externalTarget = feature?.target.startsWith('https://');
  return <aside className="journal-overview" aria-label="Article overview">
    {feature && <div className="journal-takeaways"><p className="journal-eyebrow"><Icon size={18} aria-hidden="true" /> The short version</p><ul>{feature.takeaways.map(item => <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>)}</ul>
      {externalTarget ? <a href={feature.target} target="_blank" rel="noopener noreferrer" className="journal-primary-link">{feature.action}<ArrowRight size={17} aria-hidden="true" /></a> : <Link href={feature.target} className="journal-primary-link">{feature.action}<ArrowRight size={17} aria-hidden="true" /></Link>}
    </div>}
    <nav aria-label="On this page" className="journal-toc"><p className="journal-eyebrow"><List size={18} aria-hidden="true" /> In this article</p><ol>{sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</a></li>)}</ol>{feature?.target === '#deck-library' && <a className="journal-toc-library" href="#deck-library">Jump to the deck cards <ArrowRight size={14} aria-hidden="true" /></a>}</nav>
  </aside>;
}

const spotlights = [
  { heading: 'Mothman:', name: 'The Wise Mothman', href: '/brawl-box/the-wise-mothman', text: 'See the counter plan, compare the source list, and export the editorial revision.' },
  { heading: 'Rakdos:', name: 'Rakdos, Lord of Riots', href: '/brawl-box/rakdos-lord-of-riots', text: 'Review the life-loss setup and creature sequencing alongside the full list.' },
  { heading: 'Karlov:', name: 'Karlov of the Ghost Council', href: '/brawl-box/karlov-of-the-ghost-council', text: 'Explore the life-gain packages and the distinct roles of both Daxos cards.' },
];
function InlineDeck({ name, href, text }: typeof spotlights[number]) {
  const reference = cardReference(name);
  const image = reference?.imageUrl;
  return <aside className="journal-inline-deck" aria-label={`${name} deck tools`}>
    {image && <Link href={href} tabIndex={-1} aria-hidden="true"><img src={image} alt="" width="488" height="680" loading="lazy" /></Link>}
    <div><p className="journal-eyebrow">Put the idea into play</p><p className="journal-inline-title"><Link href={href}>{name}</Link></p><p>{text}</p>{reference?.oracleText && <p className="journal-inline-oracle"><strong>Printed Oracle text</strong><br />{reference.oracleText}</p>}<div className="journal-inline-actions"><Link className="journal-primary-link" href={`${href}#buy-online`}><ShoppingBag size={16} aria-hidden="true" /> Buy Online</Link><Link className="journal-text-link" href={href}>Deck & export tools <ArrowRight size={14} aria-hidden="true" /></Link></div></div>
  </aside>;
}

export function ReadingBody({ article }: { article: ReadingArticle }) {
  const body = article.body.replace(/^# [^\n]*\n+/, '').replace(/```mtg-card\n[\s\S]*?```\n*/g, '');
  if (article.slug.startsWith('market-watch-')) {
    const sourceDate = article.slug.slice('market-watch-'.length);
    return <article className="journal-prose" aria-label="Article text"><MarketPostMarkdown body={marketJournalWithEmbeds(body, sourceDate)} sourceDate={sourceDate} /></article>;
  }
  const sections = body.split(/(?=^## )/m);
  return <article className="journal-prose" aria-label="Article text">{sections.map((section, index) => {
    const title = section.match(/^## (.+)/)?.[1];
    return <section className={title ? 'journal-section' : 'journal-intro'} key={index} aria-label={title}>
      {section.split(/(?=^### )/m).map((subsection, subIndex) => <React.Fragment key={subIndex}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        h2: ({ children }) => <h2 id={headingId(String(children))}><span className="journal-section-number" aria-hidden="true">{String(index).padStart(2, '0')}</span>{children}</h2>,
        h3: ({ children }) => <h3>{children}</h3>,
        a: ({ href, children }) => href?.startsWith('/') ? <Link href={href}>{children}</Link> : <a href={href} {...(href?.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>,
      }}>{subsection}</ReactMarkdown>
      {article.slug === 'brawlternative-shelf-roundup' && subsection.startsWith('### ') && spotlights.filter(item => subsection.split('\n')[0].includes(item.href)).map(item => <InlineDeck key={item.href} {...item} />)}
      </React.Fragment>)}
    </section>;
  })}</article>;
}

export function ReadingMeta({ body }: { body: string }) {
  return <span className="journal-reading-time"><Clock3 size={15} aria-hidden="true" /> {readingMinutes(body)} min read</span>;
}

const relatedReadingCards: Record<string, string> = {
  'remote-play-shuffle-tests': 'The Wise Mothman',
  'brawlternative-shelf-roundup': 'The Wise Mothman',
  'battle-box-october-17-recap': 'Goblin Rabblemaster',
  'commanders-100-percent-worth-building-around': 'Sakiko, Mother of Summer',
  'simple-builds-that-dominate-your-playgroup': 'Jasmine Boreal of the Seven',
  'eight-simple-commander-deck-blueprints': 'Jasmine Boreal of the Seven',
  'invisible-woman-build-the-wall': 'Invisible Woman',
  'typa-restock-alerts-reality-fracture': 'Reality Fracture',
  'star-trek-adventure-deck-building-2026-11-10': 'The Borg Queen',
  'deckbox-decks-visual-archive-2026-11-10': 'Delraich',
  'precon-upgrade-market-radar-2026-11-10': "Primevals' Glorious Rebirth",
};

function relatedReadingImage(slug: string) {
  const known = journalCardImage(slug);
  if (known?.imageUrl && !known.imageUrl.includes('/manus-storage/')) {
    if (known.artUrl && !known.artUrl.includes('/manus-storage/')) return known.artUrl;
    return known.imageUrl.replace(/\/normal\//, '/art_crop/').replace(/version=normal/, 'version=art_crop');
  }
  const name = relatedReadingCards[slug] ?? 'Sol Ring';
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=art_crop`;
}

export function RelatedReading({ articles, currentSlug }: { articles: ReadingArticle[]; currentSlug: string }) {
  return <nav className="journal-related" aria-label="Keep reading"><p className="journal-eyebrow"><BookOpen size={17} aria-hidden="true" /> Keep exploring</p><h2>From the notebook to the table</h2><div>{articles.filter(item => item.slug !== currentSlug).map(item => <Link key={item.slug} href={`/blog/${item.slug}`}><div className="journal-related-image"><img src={relatedReadingImage(item.slug)} alt="" loading="lazy" /></div><div className="journal-related-copy"><span>{readingFeature(item.slug)?.label ?? 'Play journal'}</span><h3>{item.title}</h3><p>{item.summary}</p><strong>Read the story <ArrowRight size={16} aria-hidden="true" /></strong></div></Link>)}</div></nav>;
}
