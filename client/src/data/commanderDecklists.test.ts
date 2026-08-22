import { describe, expect, it } from "vitest";
import { commanderDecklists } from "./commanderDecklists";

describe("Commander precon library integrity", () => {
  it("contains exactly four precons for the Marvel set code (msc)", () => {
    const marvelDecks = commanderDecklists.filter((deck) => deck.set_code.toLowerCase() === "msc");
    expect(marvelDecks).toHaveLength(4);
    expect(marvelDecks.map((deck) => deck.name).sort()).toEqual([
      "Avengers Assemble",
      "Doom Prevails",
      "The Fantastic Four",
      "Wakanda Forever",
    ].sort());
  });

  it("contains exactly two precons for Edge of Eternities (eoc)", () => {
    const eocDecks = commanderDecklists.filter((deck) => deck.set_code.toLowerCase() === "eoc");
    expect(eocDecks).toHaveLength(2);
  });
});
