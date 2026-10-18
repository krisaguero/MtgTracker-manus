import { describe, expect, it } from "vitest";
import { hydrateOracle, resolveEntry } from "./useCommanderDeck";

describe("Commander deck entry resolution", () => {
  it("keeps unresolved future/indexed rows as pending cards instead of dropping them", () => {
    const entry = resolveEntry(
      {
        name: "Future Card",
        set_code: "abc",
        number: "999",
        count: 2,
        type_line: "Card",
      },
      [],
      "deck"
    );
    expect(entry.card.name).toBe("Future Card");
    expect(entry.card.oracle_text).toBeUndefined();
    expect(entry.quantity).toBe(2);
    expect(entry.zone).toBe("deck");
  });
  it("preserves each duplicate row and its quantity", () => {
    const first = resolveEntry(
      { name: "Same Card", set_code: "abc", number: "1", count: 1 },
      [],
      "deck"
    );
    const second = resolveEntry(
      { name: "Same Card", set_code: "abc", number: "2", count: 3 },
      [],
      "deck"
    );
    expect(
      [first, second].map(item => [
        item.card.name,
        item.card.collector_number,
        item.quantity,
      ])
    ).toEqual([
      ["Same Card", "1", 1],
      ["Same Card", "2", 3],
    ]);
  });
  it("hydrates multi-face evidence without replacing the indexed printing or its images", () => {
    const entry = resolveEntry({ name: "Front // Back", set_code: "original", number: "42", count: 3 }, [], "deck");
    const hydrated = hydrateOracle(entry.card, new Map([["front // back", { name: "Front // Back", type_line: "Creature // Creature", card_faces: [{ name: "Front", oracle_text: "Draw a card." }, { name: "Back", oracle_text: "Flying" }] }]]));
    expect(hydrated.oracle_text).toContain("Draw a card.");
    expect(hydrated.oracle_text).toContain("Flying");
    expect(hydrated.card_faces?.[1].oracle_text).toBe("Flying");
    expect(hydrated.set).toBe("original");
    expect(hydrated.collector_number).toBe("42");
    expect(hydrated.image_uris).toBe(entry.card.image_uris);
    expect(hydrated.id).toBe(entry.card.id);
    expect(hydrated.name).toBe(entry.card.name);
  });
  it("never overwrites live Oracle text with snapshot evidence", () => {
    const entry = resolveEntry({ name: "Example", set_code: "abc", number: "1", count: 1 }, [], "commander");
    const hydrated = hydrateOracle({ ...entry.card, oracle_text: "Current live text." }, new Map([["example", { oracle_text: "Snapshot text." }]]));
    expect(hydrated.oracle_text).toBe("Current live text.");
  });
});
