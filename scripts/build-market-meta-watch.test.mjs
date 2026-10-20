import { describe, expect, it } from "vitest";
import {
  buildBrawlMeta,
  buildCommanderShifts,
  buildPriceSpikes,
} from "./build-market-meta-watch.mjs";

const signal = (key, price) => ({
  key,
  name: key,
  setCode: "TST",
  currentUsd: price,
  sourceCount: 2,
  category: "watchlist",
});

describe("market meta watch", () => {
  it("flags large daily and seven-day price moves with dated evidence", () => {
    const snapshots = [
      { date: "2026-10-12", signals: [signal("Alpha", 10)] },
      { date: "2026-10-18", signals: [signal("Alpha", 12)] },
      { date: "2026-10-19", signals: [signal("Alpha", 15)] },
    ];
    const result = buildPriceSpikes(snapshots);
    expect(result.signals[0]).toMatchObject({
      key: "Alpha",
      latestDayPct: 25,
      sevenDayPct: 50,
      direction: "up",
      qualifies: true,
    });
    expect(result).toMatchObject({
      latestDate: "2026-10-19",
      previousDate: "2026-10-18",
      baselineDate: "2026-10-12",
    });
  });

  it("marks measured Commander rank changes separately from first baselines", () => {
    const current = [
      { name: "New Commander", rank: 1, decksPastMonth: 500 },
      { name: "Moving Commander", rank: 5, decksPastMonth: 300 },
    ];
    const previous = [
      { name: "New Commander", rank: 1, decksPastMonth: 500 },
      { name: "Moving Commander", rank: 2, decksPastMonth: 100 },
    ];
    const result = buildCommanderShifts(current, previous);
    expect(result.find(row => row.name === "Moving Commander")).toMatchObject({
      rankDelta: -3,
      deckCountDelta: 200,
      signal: "shift",
    });
    expect(result.find(row => row.name === "New Commander")?.signal).toBe(
      "stable-range"
    );
  });

  it("labels the Brawl strategy corpus as a proxy and counts repeated cards", () => {
    const result = buildBrawlMeta([
      {
        commanderKey: "one",
        sourceFile: "one.json",
        cardCounts: { SolRing: 1, SharedCard: 1 },
      },
      {
        commanderKey: "two",
        sourceFile: "two.json",
        cardCounts: { SharedCard: 1, Removal: 1 },
      },
    ]);
    expect(result.methodology).toContain("not tournament results");
    expect(result.strategyDocumentCount).toBe(2);
    expect(
      result.cardSignals.find(row => row.name === "SharedCard")
    ).toMatchObject({ strategyCount: 2, totalCopies: 2 });
  });
});
