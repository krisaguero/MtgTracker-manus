import { describe, expect, it } from "vitest";
import decks from "./retroBattleBox2026.json";
import strategy from "./battleBoxStrategy.json";
import reference from "./battleBoxCardReference.json";

describe("retro battle-box strategy packages", () => {
  it("covers each distinct source card exactly once per deck", () => {
    for (const deck of decks) {
      const sourceNames = deck.groups.flatMap(group =>
        group.cards.map(card => card.name)
      );
      const expected = new Set(sourceNames);
      const cards = strategy[deck.id as keyof typeof strategy].packages.flatMap(
        pkg => pkg.cards
      );
      expect(cards.map(card => card.name)).toHaveLength(expected.size);
      expect(new Set(cards.map(card => card.name))).toEqual(expected);
    }
  });

  it("has a collected reference and concise role for every packaged card", () => {
    for (const deck of decks) {
      const cards = strategy[deck.id as keyof typeof strategy].packages.flatMap(
        pkg => pkg.cards
      );
      for (const card of cards) {
        expect(reference[card.name as keyof typeof reference]).toBeDefined();
        expect(card.role.trim().length).toBeGreaterThanOrEqual(20);
      }
    }
  });

  it("regresses the corrected oracle-sensitive roles", () => {
    const role = (deckId: keyof typeof strategy, cardName: string) =>
      strategy[deckId].packages
        .flatMap(pkg => pkg.cards)
        .find(card => card.name === cardName)?.role ?? "";

    expect(role("kavu-beastmaster", "Flametongue Kavu")).toContain(
      "may target a creature you control"
    );
    expect(role("kavu-beastmaster", "Kavu Howler")).toContain("top four cards");
    expect(role("kavu-beastmaster", "Kavu Chameleon")).toContain(
      "cannot be countered"
    );
    expect(role("kavu-beastmaster", "Pouncing Kavu")).toContain(
      "kicker {2}{R}"
    );
    expect(role("kavu-beastmaster", "Pouncing Kavu")).not.toContain("Flash");
    expect(role("lightning-burn", "Searing Blaze")).toContain(
      "1 damage to a target player or planeswalker and 1 damage"
    );
    expect(role("lightning-burn", "Fireblast")).not.toContain("free");
    expect(role("lightning-burn", "Eidolon of the Great Revel")).toContain(
      "that player"
    );
    expect(role("rg-eldrazi-ramp-stompy", "Search for Tomorrow")).toContain(
      "untapped"
    );
    expect(role("rg-eldrazi-ramp-stompy", "Conduit of Ruin")).toContain(
      "mana value 7 or greater"
    );
    expect(role("theros-boros-soldiers", "Bloodcrazed Hoplite")).not.toContain(
      "may remove"
    );
    expect(role("goblin-cavalcade", "Shambling Goblin")).toContain(
      "opponent controls"
    );
    expect(role("goblin-cavalcade", "Goblin Trailblazer")).toContain("2/1");
    expect(role("goblin-cavalcade", "Goblin Glory Chaser")).toContain(
      "no longer qualifies for Cavalcade"
    );
    expect(role("oldschool-zombie-tribal", "Undead Warchief")).toContain(
      "including itself"
    );
    expect(role("oldschool-zombie-tribal", "Carrion Feeder")).toContain(
      "activated ability"
    );
    expect(role("oldschool-zombie-tribal", "Lord of the Accursed")).toContain(
      "tapping it"
    );
    expect(
      role("simic-evasive-tempo-midrange", "Coiling Oracle")
    ).not.toContain("battlefield tapped");
    expect(
      role("simic-evasive-tempo-midrange", "Trygon Predator")
    ).not.toContain("trample");
    expect(
      role("mono-white-lifegain-sunbond-heroic", "Mortal's Ardor")
    ).not.toContain("rebound");
    expect(
      role("mono-white-lifegain-sunbond-heroic", "Launch the Fleet")
    ).not.toContain("Soldier copy");
  });
});
