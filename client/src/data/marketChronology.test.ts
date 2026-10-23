import { describe, expect, it } from "vitest";
import {
  chronologicalMarketEntries,
  latestMarketWatchEntries,
} from "./marketChronology";

describe("chronological market hub", () => {
  it("lists every source record newest first without merging report contents", () => {
    expect(chronologicalMarketEntries.map(entry => entry.dateKey)).toEqual([
      "2026-10-22",
      "2026-10-17",
      "2026-10-17",
      "2026-10-16",
      "2026-10-16",
      "2026-10-15",
      "2026-10-15",
      "2026-10-11",
      "2026-10-05",
      "2026-10-02",
      "2026-09-26",
      "2026-09-22",
      "2026-09-19",
      "2026-09-18",
    ]);
    expect(
      new Set(chronologicalMarketEntries.map(entry => entry.id)).size
    ).toBe(chronologicalMarketEntries.length);
    expect(
      chronologicalMarketEntries.every(
        entry =>
          entry.href && entry.source && entry.verification && entry.caveat
      )
    ).toBe(true);
  });

  it("discovers the seven-card creator spotlight without relabeling it as price evidence", () => {
    const entry = chronologicalMarketEntries.find(
      candidate => candidate.kind === "creator spotlight"
    );
    expect(entry).toBeDefined();
    expect(entry.kind).toBe("creator spotlight");
    expect(entry.href).toBe("/market-report/tabletop-paper-company-spotlight");
    expect(entry.source).toContain("Tabletop Paper Company");
    expect(entry.verification).toContain("no live price claims");
  });

  it("keeps the October 16 catalyst brief and Notion snapshot distinct", () => {
    const entries = chronologicalMarketEntries.filter(
      entry => entry.dateKey === "2026-10-16"
    );
    expect(entries.map(entry => entry.kind)).toEqual([
      "catalyst brief",
      "market watch",
    ]);
    expect(new Set(entries.map(entry => entry.href)).size).toBe(2);
    expect(entries[0].href).toBe("/market-report/october-16-30-signal-brief");
    expect(entries[0].verification).toContain("unverified");
    expect(entries[0].caveat).toContain("not 30 confirmed price movers");
  });

  it("keeps latest watch cards separate from imported price snapshots", () => {
    expect(latestMarketWatchEntries.map(entry => entry.dateKey)).toEqual([
      "2026-10-22",
      "2026-10-16",
      "2026-10-15",
    ]);
    expect(
      latestMarketWatchEntries.every(entry => entry.kind === "market watch")
    ).toBe(true);
    expect(
      chronologicalMarketEntries.filter(
        entry => entry.kind === "price snapshot"
      )
    ).toHaveLength(5);
  });
});
