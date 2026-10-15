import { describe, expect, it } from "vitest";
import { commanderDecklistsData } from "@/data/commanderDecklistsData";
import { buildHomePreconIndex } from "./homePreconIndex";

describe("homepage precon index", () => {
  it("includes every indexed decklist, including older releases outside the homepage set window", () => {
    const index = buildHomePreconIndex(commanderDecklistsData);
    expect(index).toHaveLength(commanderDecklistsData.length);
    expect(index.some(deck => deck.name === "Avengers Assemble")).toBe(true);
    expect(index.some(deck => deck.name === "World Shaper")).toBe(true);
  });

  it("adds live-only products and deduplicates products already in the local decklist archive", () => {
    const local = commanderDecklistsData[0];
    const index = buildHomePreconIndex(
      commanderDecklistsData,
      new Map([
        [
          "msc",
          [
            {
              id: "live-local",
              name: local.name,
              set_code: local.set_code,
              hasDecklist: true,
            },
            {
              id: "live-only",
              name: "Live-Only Commander Product",
              set_code: "new",
              productImageUrl: "https://images.example.test/product.jpg",
            },
          ],
        ],
      ])
    );

    expect(index).toHaveLength(commanderDecklistsData.length + 1);
    expect(index.filter(deck => deck.name === local.name)).toHaveLength(1);
    expect(
      index.find(deck => deck.name === "Live-Only Commander Product")
        ?.fallbackImages
    ).toContain("https://images.example.test/product.jpg");
  });

  it("adds parent-set names to local decklists so a set search also finds them in the archive view", () => {
    const archivedDeck = {
      ...commanderDecklistsData[0],
      set_code: "eoc",
      set_name: undefined,
    };
    const parentSet = {
      id: "eoe",
      code: "eoe",
      name: "Edge of Eternities",
      released_at: "2025-08-01",
      set_type: "expansion",
      card_count: 400,
    };
    const index = buildHomePreconIndex(
      [archivedDeck],
      new Map([
        [
          "eoe",
          [
            {
              id: "world-shaper",
              name: archivedDeck.name,
              set_code: "eoc",
              hasDecklist: true,
            },
          ],
        ],
      ]),
      [parentSet]
    );

    expect(index[0].set_name).toBeUndefined();
    expect(index[0].parent_set_name).toBe("Edge of Eternities");
    expect(
      index[0].parent_set_name?.toLowerCase().includes("edge of eternities")
    ).toBe(true);
  });
});
