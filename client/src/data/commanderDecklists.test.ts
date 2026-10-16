import { describe, expect, it } from "vitest";
import { commanderDecklists } from "./commanderDecklists";

describe("Commander precon library integrity", () => {
  it("preserves the four base Marvel precons and includes verified Collector's Edition lists", () => {
    const marvelDecks = commanderDecklists.filter((deck) => deck.set_code.toLowerCase() === "msc");
    expect(marvelDecks.map((deck) => deck.name)).toEqual(expect.arrayContaining([
      "Avengers Assemble",
      "Doom Prevails",
      "The Fantastic Four",
      "Wakanda Forever",
      "Avengers Assemble Collector's Edition",
      "Doom Prevails Collector's Edition",
      "The Fantastic Four Collector's Edition",
      "Wakanda Forever Collector's Edition",
    ]));
  });

  it("contains exactly two precons for Edge of Eternities (eoc)", () => {
    const eocDecks = commanderDecklists.filter((deck) => deck.set_code.toLowerCase() === "eoc");
    expect(eocDecks).toHaveLength(2);
  });
});
