import { describe, expect, it } from "vitest";
import { getMarketWatchKey, isMarketCardWatched, toggleMarketWatchlist, type MarketWatchlistEntry } from "./marketWatchlist";

const card = { name: "Demonic Tutor", setCode: "lea" };

describe("market watchlist", () => {
  it("uses a case-insensitive card and set identity", () => {
    expect(getMarketWatchKey(card)).toBe("demonic tutor::lea");
    expect(getMarketWatchKey({ name: "DEMONIC TUTOR", setCode: "LEA" })).toBe(getMarketWatchKey(card));
  });

  it("adds and removes cards without mutating the incoming entries", () => {
    const initial: MarketWatchlistEntry[] = [];
    const added = toggleMarketWatchlist(card, initial);

    expect(initial).toHaveLength(0);
    expect(added).toHaveLength(1);
    expect(isMarketCardWatched(card, added)).toBe(true);

    const removed = toggleMarketWatchlist(card, added);
    expect(removed).toHaveLength(0);
    expect(isMarketCardWatched(card, removed)).toBe(false);
  });
});
