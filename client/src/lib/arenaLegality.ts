/* Design reminder: hard-edged Arena-Morph compatibility utility; evaluates MTG Arena legality, maps strategy-preserving functional counterpart substitutions, and calculates wildcard costs. */

import type { ScryfallCard } from '@/hooks/useSetDetail';

export interface ArenaCardStatus {
  cardName: string;
  isArenaLegal: boolean;
  substitutionName?: string;
  reason: string;
}

export interface WildcardCostSummary {
  common: number;
  uncommon: number;
  rare: number;
  mythic: number;
  totalSubstitutions: number;
}

const ARENA_MORPH_SUBSTITUTIONS: Record<string, string> = {
  "Sol Ring": "Mind Stone",
  "Command Tower": "Path of Ancestry",
  "Demonic Tutor": "Diabolic Tutor",
  "Cyclonic Rift": "Aetherize",
  "Rhystic Study": "Mystic Remora",
  "Smothering Tithe": "Monologue Tax",
  "Doubling Season": "Parallel Lives",
  "Fierce Guardianship": "Negate",
  "Teferi's Protection": "Lapse of Certainty",
  "Dockside Extortionist": "Treasure Nabber",
};

// Heuristic rarity mapping for substitution cards
const SUBSTITUTION_RARITIES: Record<string, 'common' | 'uncommon' | 'rare' | 'mythic'> = {
  "Mind Stone": "uncommon",
  "Path of Ancestry": "uncommon",
  "Diabolic Tutor": "uncommon",
  "Aetherize": "uncommon",
  "Mystic Remora": "uncommon",
  "Monologue Tax": "rare",
  "Parallel Lives": "rare",
  "Negate": "common",
  "Lapse of Certainty": "common",
  "Treasure Nabber": "rare",
  "Arcane Signet": "common",
};

export function getArenaCardStatus(card: ScryfallCard & { legalities?: Record<string, string> }): ArenaCardStatus {
  const name = card.name;
  const legalities = card.legalities || {};
  const historicLegal = legalities.historic === 'legal' || legalities.explorer === 'legal' || legalities.standard === 'legal' || legalities.alchemy === 'legal' || legalities.brawl === 'legal';
  
  const isExplicitlyIllegalOnArena = legalities.historic === 'not_legal' && legalities.brawl === 'not_legal';
  const isBasicLand = card.type_line.includes('Basic Land');

  let isArenaLegal = isBasicLand || historicLegal || (!isExplicitlyIllegalOnArena && (card.set === 'neo' || card.set === 'mkm' || card.set === 'otj' || card.set === 'blb' || card.set === 'fdn' || card.set === 'm21' || card.set === 'mid' || card.set === 'vow' || card.set === 'snc' || card.set === 'dmu' || card.set === 'bro' || card.set === 'one' || card.set === 'mat' || card.set === 'ltr' || card.set === 'woe' || card.set === 'lci'));

  if (ARENA_MORPH_SUBSTITUTIONS[name] && !isBasicLand) {
    isArenaLegal = false;
  }

  const substitutionName = ARENA_MORPH_SUBSTITUTIONS[name];
  const reason = isArenaLegal
    ? 'Fully playable on MTG Arena (Historic Brawl legal).'
    : substitutionName
      ? `Paper-only precon inclusion. Arena-Morph functional equivalent: ${substitutionName}.`
      : 'Not currently implemented on MTG Arena client.';

  return {
    cardName: name,
    isArenaLegal,
    substitutionName: substitutionName || (isArenaLegal ? undefined : 'Arcane Signet'),
    reason,
  };
}

export function calculateArenaMorphWildcardCosts(deckEntries: Array<{ card: ScryfallCard; quantity: number }>): WildcardCostSummary {
  let common = 0;
  let uncommon = 0;
  let rare = 0;
  let mythic = 0;
  let totalSubstitutions = 0;

  for (const entry of deckEntries) {
    const status = getArenaCardStatus(entry.card);
    if (!status.isArenaLegal && status.substitutionName) {
      totalSubstitutions += entry.quantity;
      const rarity = SUBSTITUTION_RARITIES[status.substitutionName] || 'rare';
      if (rarity === 'common') common += entry.quantity;
      else if (rarity === 'uncommon') uncommon += entry.quantity;
      else if (rarity === 'rare') rare += entry.quantity;
      else if (rarity === 'mythic') mythic += entry.quantity;
    }
  }

  return {
    common,
    uncommon,
    rare,
    mythic,
    totalSubstitutions,
  };
}

export function formatArenaVariantDecklist(commander: Array<{ name: string; quantity: number }>, deck: Array<{ name: string; quantity: number }>): string {
  const lines: string[] = [];
  lines.push('// Arena-Morph Strategy-Preserving Precon Variant');
  lines.push('Commander');
  for (const entry of commander) {
    const legalName = ARENA_MORPH_SUBSTITUTIONS[entry.name] || entry.name;
    lines.push(`${entry.quantity} ${legalName}`);
  }
  lines.push('');
  lines.push('Deck');
  for (const entry of deck) {
    const legalName = ARENA_MORPH_SUBSTITUTIONS[entry.name] || entry.name;
    lines.push(`${entry.quantity} ${legalName}`);
  }
  return lines.join('\n');
}
