import { describe, expect, it } from "vitest";
import type { ScryfallCard } from "@/hooks/useSetDetail";
import {
  cardExplanation,
  evidenceForCard,
  strategyPackages,
} from "./preconStrategyEvidence";

function card(
  name: string,
  oracle_text?: string,
  type_line = "Creature"
): ScryfallCard {
  return {
    id: name,
    name,
    oracle_text,
    type_line,
    colors: [],
    color_identity: [],
    rarity: "common",
    set: "TST",
    collector_number: "1",
    released_at: "2024-01-01",
    layout: "normal",
  };
}

describe("precon strategy evidence", () => {
  it("only reports supported signals from verified Oracle text", () => {
    const result = evidenceForCard(card("Ramp", "{T}: Add {G}."));
    expect(result.map(item => item.kind)).toEqual(["ramp"]);
    expect(
      evidenceForCard(card("Flyer", "Flying.")).map(item => item.kind)
    ).toEqual(["combat"]);
  });
  it("distinguishes unavailable text rather than inventing a role", () => {
    expect(cardExplanation({ card: card("Pending"), quantity: 1 })).toContain(
      "Oracle text is unavailable"
    );
  });
  it("does not turn a named token into tribal evidence", () => {
    const result = evidenceForCard(
      card("Token maker", "Create a 1/1 blue Bird creature token with flying.")
    );
    expect(result.map(item => item.kind)).toContain("tokens");
    expect(result.map(item => item.kind)).not.toContain("kindred");
  });
  it("preserves duplicate quantities in package counts", () => {
    const entries = [
      { card: card("Draw spell", "Draw two cards."), quantity: 2 },
      {
        card: card("Draw creature", "When this enters, draw a card."),
        quantity: 1,
      },
      { card: card("Removal", "Destroy target artifact."), quantity: 3 },
    ];
    const packages = strategyPackages(entries);
    expect(packages.find(item => item.label === "Card advantage")?.count).toBe(
      3
    );
    expect(packages.find(item => item.label === "Interaction")?.count).toBe(3);
  });
  it("supports diverse mechanics without claiming a complete archetype", () => {
    const entries = [
      {
        card: card(
          "Land search",
          "Search your library for a basic land card, put it onto the battlefield tapped, then shuffle."
        ),
        quantity: 1,
      },
      {
        card: card(
          "Recursion",
          "Return target creature card from your graveyard to the battlefield."
        ),
        quantity: 1,
      },
      {
        card: card(
          "Protection",
          "Target creature gains hexproof and indestructible until end of turn."
        ),
        quantity: 1,
      },
      {
        card: card("Sacrifice", "Sacrifice another creature: draw a card."),
        quantity: 1,
      },
    ];
    expect(strategyPackages(entries).map(item => item.label)).toEqual(
      expect.arrayContaining(["Lands", "Graveyard", "Protection", "Sacrifice"])
    );
  });
  it("does not call a negated draw instruction card advantage", () => {
    expect(
      evidenceForCard(card("No draw", "Your opponents can't draw cards."))
    ).toEqual([]);
  });
  it("does not invent evidence for unsupported future card text or absent face text", () => {
    expect(
      evidenceForCard(card("Future mechanic", "Chronicle — do something new."))
    ).toEqual([]);
    expect(evidenceForCard(card("Double-faced pending"))).toEqual([]);
  });
});
