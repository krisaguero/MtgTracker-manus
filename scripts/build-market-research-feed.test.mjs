import { describe, expect, it } from "vitest";
import { buildPost } from "./build-market-research-feed.mjs";

const topic = {
  slug: "constructed-format-watch",
  label: "Constructed Format Watch",
  lens: "tournament adoption, format legality, archetype repetition, and rotation or metagame risk",
};

const signal = (name, percentChange, format = "Commander") => ({
  name,
  setCode: "TST",
  setName: "Test Set",
  collectorNumber: "1",
  currentUsd: 2.5,
  previousUsd: 2,
  percentChange,
  format,
  category: "commander-picks",
  sourceCount: 2,
  lastUpdated: "2026-10-22",
  reason: "Test signal",
});

describe("market research feed fallback", () => {
  it("fills a zero-card constructed filter with the strongest non-zero movers", () => {
    const post = buildPost({
      dateKey: "2026-10-22",
      topic,
      snapshot: {
        signalCount: 4,
        sources: ["test"],
        methodology: "test",
        signals: [
          signal("Small Move", 4),
          signal("Largest Move", -42),
          signal("Medium Move", 18),
          signal("Flat Baseline", 0),
        ],
      },
      history: { snapshots: [] },
      isBiweekly: false,
    });

    expect(post.selectionMode).toBe("fallback-top-movers");
    expect(post.selectionNote).toContain("strongest non-zero movers");
    expect(post.cards.map(card => card.name)).toEqual([
      "Largest Move",
      "Medium Move",
      "Small Move",
    ]);
    expect(post.summary).toContain("topic filter returned no cards");
  });
});
