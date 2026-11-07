import type { DeckboxSourceRecord } from '@/lib/privateDeckBrewery';

export interface PrivateBreweryIdea {
  title: string;
  lead: string;
  steps: string[];
}

const THEME_SIGNALS: Array<{ label: string; terms: RegExp; frame: string }> = [
  { label: 'resource-pressure / Stax', terms: /\b(stax|tax|prison|sphere|lockdown)\b/i, frame: 'pressure one resource, then close the game quickly; keep the short-format version interactive rather than an all-locks pile' },
  { label: 'Clue-and-value', terms: /\b(clues?|investigation|detective)\b/i, frame: 'make clues, turn those spare resources into cards, then cash in the card advantage for a clean finish' },
  { label: 'token engine', terms: /\b(tokens?|saprolings?|squirrels?|treasures?|foods?|blood)\b/i, frame: 'build a three-act story: create bodies or resources, convert them into value, then land one decisive payoff' },
  { label: 'sacrifice / death-value', terms: /\b(sacrifice|aristocrat|death trigger|dies|mazirek)\b/i, frame: 'keep a tight loop of fodder, a way to cash it in, and a payoff for things leaving play' },
  { label: '+1/+1 counters', terms: /\b(counter|proliferate|adapt|evolve|modular)\b/i, frame: 'make counters, multiply or move them, then give the biggest threat a reliable way through' },
  { label: 'graveyard engine', terms: /\b(graveyard|reanimat|dredge|self.mill|escape|flashback)\b/i, frame: 'stock the graveyard, make it do work, and keep one resilient recovery line for when the first engine is answered' },
  { label: 'discard / madness', terms: /\b(discard|madness|hellbent|loot(ing)?)\b/i, frame: 'make discarding selective: the setup should feed a payoff, not just empty both players’ hands' },
  { label: 'spell-chain', terms: /\b(spellslinger|prowess|storm|instant|sorcer|cantrip)\b/i, frame: 'use cheap setup spells, a repeatable payoff, and a compact way to end the game before the engine fizzles' },
  { label: 'artifact workshop', terms: /\b(artifact|thopter|construct|equipment|vehicle|treasure)\b/i, frame: 'make artifacts pull double duty as setup, material, and payoff instead of carrying three disconnected subthemes' },
  { label: 'tribal', terms: /\b(elf|elves|goblin|zombie|vampire|dragon|dinosaur|merfolk|snake|minotaur|cat|knight|wizard|sliver|spirit|angel|werewolf)\b/i, frame: 'keep the creature-family core, add a small support package that solves its weak spot, and leave room for interaction' },
  { label: 'lands / landfall', terms: /\b(landfall|lands matter|land ramp|land recursion|landfall)\b/i, frame: 'make each land drop advance the plan, then balance ramp with a payoff that actually ends the game' },
  { label: 'lifegain / life-drain', terms: /\b(lifegain|life gain|life drain|extort|soul sisters)\b/i, frame: 'treat life as a resource: gain it efficiently, turn the buffer into pressure, and include a way to finish' },
  { label: 'combat / evasion', terms: /\b(evasion|unblockable|voltron|equipment|aura|combat|infect|toxic)\b/i, frame: 'make the combat plan clear: protect one threat, create a safe attack, and keep a backup route when the table blocks it' },
  { label: 'control / tempo', terms: /\b(control|tempo|counterspell|removal|flash)\b/i, frame: 'trade efficiently early, choose one compact finisher, and avoid filling every slot with answers that do not advance the clock' },
];

export interface PrivateDeckThemeRead {
  label: string;
  frame: string;
  evidence: string;
}

export function readPrivateDeckTheme(deck: DeckboxSourceRecord): PrivateDeckThemeRead {
  const rows = [...deck.main, ...deck.sideboard];
  const title = deck.name.toLocaleLowerCase();
  const cardNames = rows.map((card) => card.name.toLocaleLowerCase());
  const match = THEME_SIGNALS.map((signal) => ({
    signal,
    titleHit: signal.terms.test(title),
    rowHits: cardNames.filter((name) => signal.terms.test(name)).length,
  }))
    .filter((hit) => hit.titleHit || hit.rowHits >= 2)
    .sort((a, b) => Number(b.titleHit) - Number(a.titleHit) || b.rowHits - a.rowHits)[0];
  return match
    ? {
      label: match.signal.label,
      frame: match.signal.frame,
      evidence: 'A generated title/card-name pattern only; verify against current card type lines and Oracle text.',
    }
    : {
      label: 'one signature-card package',
      frame: 'choose one memorable interaction already suggested by the list, then give it a setup, payoff, and a backup plan',
      evidence: 'No strong theme pattern was detected from the title and card names; this is not a full card-text review.',
    };
}

function mainCopies(deck: DeckboxSourceRecord): number {
  return deck.main.reduce((sum, card) => sum + card.quantity, 0);
}

function targetNote(deck: DeckboxSourceRecord, target: number, label: string): string {
  const current = mainCopies(deck);
  const listed = typeof deck.mainCopiesListed === 'number' ? deck.mainCopiesListed : current;
  if (!current) return `No main-deck rows were exported. Treat this as an idea stub, not a partially recovered list.`;
  if (deck.exportStatus === 'partial_paginated_source' || listed > current) {
    return `The exported main has ${current} copies while the source metadata lists ${listed}; this is not a complete source snapshot. Do not treat the difference as cards to add.`;
  }
  if (current > target) return `${current} main copies are present; for a ${target}-card ${label}, test a separate ${target}-card core and keep the extras as unchosen candidates. The source list stays unchanged.`;
  if (current < target) return `${current} main copies are present; a ${target}-card ${label} would have a ${target - current}-slot planning gap. That is a target exercise, not proof the source author meant to finish it this way.`;
  if (deck.status === 'count_compatible_unverified') return `The main count matches ${target}, but the source is marked count-compatible, not verified complete or legal.`;
  return `The main count is ${current}; check the chosen format and list rules before calling it finished.`;
}

export function buildPrivateBreweryIdeas(deck: DeckboxSourceRecord): PrivateBreweryIdea[] {
  const theme = readPrivateDeckTheme(deck);
  const lands = typeof deck.mainLandCopies === 'number' ? deck.mainLandCopies : null;
  const landNote = lands === null ? 'Review the mana base only after the final color identity and curve are chosen.'
    : lands === 0 ? 'No lands are listed in the source main; settle the colors and curve before drafting a mana base.'
      : `${lands} land copies are recorded in the source main; verify the fixing against the final color identity and curve.`;
  const sourceGap = typeof deck.contextualTarget === 'number'
    ? `The source review used a contextual target of ${deck.contextualTarget}; that label is not a format or legality check.`
    : 'The source does not establish a format target, so use the count notes as experiments only.';

  return [
    {
      title: 'Full Commander: make the theme the engine',
      lead: `Working read: ${theme.label}. ${targetNote(deck, 100, 'Commander')}`,
      steps: [
        `Choose an eligible commander that rewards ${theme.label}; if none is in the source, keep commander choice as an open decision rather than promoting a card automatically.`,
        `Build the ${theme.frame}. Add the boring-but-vital support—ramp, card draw, answers, and a land base—only after the commander and color identity are settled.`,
        `${landNote} Keep duplicate rows, candidate cuts, sideboard cards, and new additions in separate working drafts; check Commander legality later.`,
      ],
    },
    {
      title: 'Brawlternative: a custom 60-card commander build',
      lead: `A compact version could keep one leader and ${theme.label} as its signature. ${targetNote(deck, 60, 'Brawlternative')}`,
      steps: [
        `Start with one commander plus 59 other cards under your collection’s house rules; this is your custom Brawlternative format, not official Arena Brawl.`,
        `Turn the theme into a small package: setup, payoff, interaction, and enough mana to play on time. Prefer cards that serve two jobs so the 60-card version feels intentional rather than merely trimmed.`,
        `Set the singleton and land rules for this collection, then test one matchup before making a polished list. No source rows are moved or edited here.`,
      ],
    },
    {
      title: 'Battle Box: make a fair 60-card duel deck',
      lead: `For a non-Commander version, keep ${theme.label} as the hook and tune it to play well against the other decks in the box. ${targetNote(deck, 60, 'Battle Box deck')}`,
      steps: [
        `Use the ${theme.frame}, but replace any commander-only dependency with a playable non-Commander payoff.`,
        `Pick a clear speed—aggressive, midrange, or controlling—then tune draw, removal, and lands against the rest of the Battle Box rather than in isolation.`,
        `Treat existing sideboard rows as their own source section; any trial cuts or matchup cards belong in a separate draft, never merged automatically.`,
      ],
    },
  ];
}

export function getPrivateDeckStatusLabel(deck: DeckboxSourceRecord): string {
  if (deck.exportStatus === 'partial_hidden_scratchpad') return 'Scratchpad rows hidden in source export';
  if (deck.exportStatus === 'partial_paginated_source') return 'Partial paginated source';
  if (deck.status === 'empty') return 'No exported main cards';
  if (deck.status === 'over_target_candidate_pool') return 'Candidate pool · above target';
  if (deck.status === 'under_target') return 'Below contextual target';
  if (deck.status === 'count_compatible_unverified') return 'Count-compatible · unverified';
  if (deck.status === 'reference') return 'Reference list';
  return 'Source status not classified';
}
