import { describe, it, expect } from "vitest";
import { parseInventoryText, generateDupeDeck } from "../client/src/lib/dupeDecksEngine";
import { loadSavedInventory, saveSavedInventory } from "../client/src/lib/dupeDecksStorage";

describe("Dupe-Decks Dual Inventory & Storage", () => {
  it("parses inventory text correctly into card quantities", () => {
    const raw = "4 Lightning Bolt\n2 Counterspell\n1 Sol Ring";
    const cards = parseInventoryText(raw);
    expect(cards).toHaveLength(3);
    expect(cards[0]).toEqual({ name: "Lightning Bolt", quantity: 4 });
    expect(cards[2]).toEqual({ name: "Sol Ring", quantity: 1 });
  });

  it("persists and loads deck inventories independently", () => {
    saveSavedInventory("a", "4 Lightning Bolt");
    saveSavedInventory("b", "4 Dark Ritual");

    expect(loadSavedInventory("a")).toContain("Lightning Bolt");
    expect(loadSavedInventory("b")).toContain("Dark Ritual");
  });

  it("generates a duel deck with coverage calculation", () => {
    const inventory = parseInventoryText("4 Lightning Bolt\n4 Counterspell\n20 Island\n20 Mountain\n4 Delver of Secrets\n8 Consider");
    const deck = generateDupeDeck("counter-burn-tempo", inventory);
    expect(deck.totalCards).toBeGreaterThan(0);
    expect(deck.coveragePercent).toBeGreaterThan(0);
  });
});
