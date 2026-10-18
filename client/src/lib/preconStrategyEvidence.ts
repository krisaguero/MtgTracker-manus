import type { ScryfallCard } from "@/hooks/useSetDetail";

export type DeckEntryLike = { card: ScryfallCard; quantity: number };
export type EvidenceKind =
  | "life"
  | "attachments"
  | "kindred"
  | "energy"
  | "counters"
  | "radiation"
  | "artifacts"
  | "tokens"
  | "sacrifice"
  | "graveyard"
  | "combat"
  | "spells"
  | "lands"
  | "ramp"
  | "removal"
  | "card advantage"
  | "protection"
  | "other";

export interface CardEvidence {
  kind: EvidenceKind;
  label: string;
  role: string;
}

interface Rule {
  kind: EvidenceKind;
  label: string;
  intro: string;
  pattern: RegExp;
  role: (card: ScryfallCard) => string;
}

export const preconOracleText = (card: ScryfallCard) => {
  if (card.oracle_text) return card.oracle_text;
  const faces =
    (card.card_faces as Array<{ oracle_text?: string }> | undefined) ?? [];
  return faces
    .map(face => face.oracle_text ?? "")
    .filter(Boolean)
    .join("\n");
};

const text = preconOracleText;

const RULES: Rule[] = [
  {
    kind: "energy",
    label: "Energy",
    intro:
      "These cards create, spend, or care about energy counters, so the list can turn those counters into the stated card effects.",
    pattern: /energy counter|\{e\}/i,
    role: c => `Uses energy counters: ${firstSentence(text(c))}`,
  },
  {
    kind: "radiation",
    label: "Radiation",
    intro:
      "These cards explicitly add, remove, or use rad counters; their roles are shown without assuming a broader radiation engine.",
    pattern: /rad counter|radiation/i,
    role: c =>
      `Works with radiation or rad counters: ${firstSentence(text(c))}`,
  },
  {
    kind: "counters",
    label: "Counters",
    intro:
      "These cards explicitly add, move, remove, or proliferate counters. Check each effect for the counter type and which permanents or players it affects.",
    pattern:
      /put (?:a|an|one|two|three|x) .* counter|counters? on|counter on|proliferate/i,
    role: c => `Adds or uses counters: ${firstSentence(text(c))}`,
  },
  {
    kind: "artifacts",
    label: "Artifacts",
    intro:
      "These cards explicitly create, sacrifice, search for, or reward artifacts; no artifact synergy is inferred from the type line alone.",
    pattern:
      /artifact token|sacrifice an artifact|artifact card|artifact you control|artifact enters/i,
    role: c => `Interacts with artifacts: ${firstSentence(text(c))}`,
  },
  {
    kind: "tokens",
    label: "Tokens",
    intro:
      "These cards create creature or noncreature tokens, giving the deck material the Oracle text says it can use.",
    pattern: /create [^.\n]{0,180}token/i,
    role: c => `Creates tokens: ${firstSentence(text(c))}`,
  },
  {
    kind: "sacrifice",
    label: "Sacrifice",
    intro:
      "These cards explicitly sacrifice permanents or reward a permanent being sacrificed; the role does not promise a loop.",
    pattern: /sacrifice (?:a|an|another|one|two|any|that|this|it)/i,
    role: c => `Uses sacrifice as written: ${firstSentence(text(c))}`,
  },
  {
    kind: "graveyard",
    label: "Graveyard",
    intro:
      "These cards put cards into, return cards from, or otherwise use the graveyard according to their Oracle text.",
    pattern:
      /graveyard|from your graveyard|into your graveyard|exile .* graveyard/i,
    role: c => `Uses the graveyard: ${firstSentence(text(c))}`,
  },
  {
    kind: "life",
    label: "Life totals",
    intro:
      "These cards explicitly gain, lose, pay, or check life. Their rules distinguish a source of life gain from a reward or a cost.",
    pattern:
      /lifelink|gain(?:s)? (?:that much|[a-z]+|\d+) life|lose(?:s)? (?:that much|[a-z]+|\d+) life|pay \d+ life|whenever you gain life/i,
    role: c => `Works with life totals: ${firstSentence(text(c))}`,
  },
  {
    kind: "attachments",
    label: "Auras and Equipment",
    intro:
      "These effects attach Auras or Equipment, improve an attached creature, or care about attached cards. Read each target and attachment condition before combining them.",
    pattern:
      /equipped creature|enchanted creature|equip \{|enchant creature|attach (?:target|an|a)|aura spells|equipment spells/i,
    role: c => `Uses attachments: ${firstSentence(text(c))}`,
  },
  {
    kind: "kindred",
    label: "Creature-type teamwork",
    intro:
      "These effects explicitly name a creature type you control or cast. The named types must match; this section does not assume that different tribes work together.",
    pattern:
      /(?:Human|Merfolk|Zombie|Goblin|Elf|Elves|Vampire|Warrior|Soldier|Pirate|Dinosaur|Sliver|Dragon|Eldrazi|Knight|Wizard|Rogue|Cat|Dog|Angel|Demon|Spirit|Faerie|Squirrel|Samurai|Ninja|Cleric|Druid|Shaman|Beast)s? (?:creatures? you control|spells you cast|you control)/i,
    role: c => `Rewards a named creature type: ${firstSentence(text(c))}`,
  },
  {
    kind: "combat",
    label: "Combat",
    intro:
      "These cards explicitly modify attacks, blocking, combat damage, or creature engagement rather than merely being creatures.",
    pattern:
      /attack(?:s|ing)?|block(?:s|ed|ing)?|combat damage|first strike|double strike|menace|vigilance|trample|flying|reach|deathtouch/i,
    role: c => `Changes combat: ${firstSentence(text(c))}`,
  },
  {
    kind: "spells",
    label: "Spells",
    intro:
      "These cards reward casting or copying spells, or turn a spell being cast into the stated effect.",
    pattern:
      /whenever (?:you|a player|an opponent) cast|copy (?:target|that|an instant|a spell)|magecraft|prowess/i,
    role: c => `Rewards or responds to spells: ${firstSentence(text(c))}`,
  },
  {
    kind: "lands",
    label: "Lands",
    intro:
      "These cards explicitly play, search for, or trigger from lands; no landfall plan is assumed without that text.",
    pattern:
      /landfall|play an additional land|search your library for (?:a|an) (?:basic )?land|search your library for up to [^,]+ land|land enters/i,
    role: c => `Works with lands: ${firstSentence(text(c))}`,
  },
  {
    kind: "ramp",
    label: "Mana development",
    intro:
      "These cards add mana, make mana artifacts or Treasures, or search for a land to develop resources.",
    pattern:
      /add (?:\{[wubrgc]\}|one mana|two mana|three mana|an amount of mana|mana of any color)|search your library for (?:a|an) (?:basic )?land|search your library for up to [^,]+ land|treasure token/i,
    role: c => `Develops mana: ${firstSentence(text(c))}`,
  },
  {
    kind: "removal",
    label: "Interaction",
    intro:
      "These cards remove, damage, bounce, or counter objects or spells. Their text determines legal targets; some effects can affect your own board too.",
    pattern:
      /destroy (?:target|all|each)|exile (?:target|all|each)|return target .* to its owner|deals? [^.\n]{0,50}damage to (?:target|each|all)|counter target (?:spell|noncreature spell|creature spell)/i,
    role: c => `Interacts with a target: ${firstSentence(text(c))}`,
  },
  {
    kind: "card advantage",
    label: "Card advantage",
    intro:
      "These cards draw cards or look through the top of the library, as stated; that is not a claim about long-term advantage.",
    pattern:
      /draw (?:a|one|two|three|four|x) card|draw cards|look at the top .* card/i,
    role: c => `Finds or draws cards: ${firstSentence(text(c))}`,
  },
  {
    kind: "protection",
    label: "Protection",
    intro:
      "These cards explicitly protect a permanent or counter a spell, making their defensive role readable from the Oracle text.",
    pattern:
      /hexproof|indestructible|protection from|phase out|counter target spell/i,
    role: c =>
      `Protects a permanent or stops a spell: ${firstSentence(text(c))}`,
  },
];

function firstSentence(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "Oracle text is unavailable.";
  return clean.length > 180 ? `${clean.slice(0, 177).trimEnd()}…` : clean;
}

function relevantClause(value: string, pattern: RegExp): string {
  const clauses = value.split(/\n|(?<=\.)\s+/);
  return clauses.find(clause => pattern.test(clause)) ?? value;
}

function supportedMatch(card: ScryfallCard, pattern: RegExp): boolean {
  const value = text(card);
  const match = value.match(pattern);
  if (!match || match.index === undefined) return false;
  const before = value
    .slice(Math.max(0, match.index - 14), match.index)
    .toLowerCase();
  if (/(?:can't|cannot|can’t|not)\s*$/.test(before)) return false;
  return true;
}

export function evidenceForCard(card: ScryfallCard): CardEvidence[] {
  if (!text(card)) return [];
  return RULES.flatMap(rule =>
    supportedMatch(card, rule.pattern)
      ? [
          {
            kind: rule.kind,
            label: rule.label,
            role: rule.role({
              ...card,
              oracle_text: relevantClause(text(card), rule.pattern),
            }),
          },
        ]
      : []
  );
}

export function cardExplanation(entry: DeckEntryLike): string {
  if (!text(entry.card))
    return "Oracle text is unavailable for this list entry; no role is inferred.";
  const evidence = evidenceForCard(entry.card);
  return evidence.length
    ? evidence[0].role
    : `Printed effect: ${firstSentence(text(entry.card))}`;
}

export interface StrategyPackage {
  label: string;
  count: number;
  cards: DeckEntryLike[];
  intro: string;
  basis: string;
}

export function strategyPackages(entries: DeckEntryLike[]): StrategyPackage[] {
  const assigned = new Set<number>();
  const packages = RULES.map(rule => {
    const cards = entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry, index }) => {
        if (assigned.has(index) || !supportedMatch(entry.card, rule.pattern))
          return false;
        assigned.add(index);
        return true;
      })
      .map(({ entry }) => entry);
    return {
      label: rule.label,
      count: cards.reduce((sum, entry) => sum + entry.quantity, 0),
      cards,
      intro: rule.intro,
      basis: rule.intro,
    };
  }).filter(pkg => pkg.cards.length > 0);
  const other = entries.filter((_, index) => !assigned.has(index));
  if (other.length)
    packages.push({
      label: "Other cards",
      count: other.reduce((sum, entry) => sum + entry.quantity, 0),
      cards: other,
      intro:
        "These entries have no specific supported text signal in the verified Oracle data. They remain visible in their original order instead of receiving an invented role.",
      basis: "No supported role inferred from the available Oracle text.",
    });
  return packages;
}

export function strategyDisclaimer(): string {
  return "Roles use resolved Scryfall Oracle text, with same-origin verified snapshots when live text is unavailable. A role describes an explicit effect, not a guaranteed combo, crossover, upgrade, archetype, or power level. Missing Oracle text stays visible and is marked unavailable.";
}

export function commanderRelationship(
  entry: DeckEntryLike,
  deckEntries: DeckEntryLike[]
): string {
  if (!text(entry.card))
    return "Oracle text is unavailable; no commander mechanic is inferred.";
  const evidence = evidenceForCard(entry.card);
  const shared = evidence
    .map(item => ({
      item,
      cards: deckEntries.filter(other =>
        evidenceForCard(other.card).some(signal => signal.kind === item.kind)
      ),
    }))
    .find(group => group.cards.length > 0);
  if (!shared)
    return "Start with the commander’s printed abilities below. No shared supported mechanic is inferred from the available deck text.";
  const names = Array.from(new Set(shared.cards.map(other => other.card.name))).slice(
    0,
    3
  );
  return `${entry.card.name} and ${names.join(", ")} explicitly share ${shared.item.label.toLowerCase()} text. Compare their effects below to see what each enables, uses, or answers; a shared mechanic alone is not a guaranteed combo.`;
}
