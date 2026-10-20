import { describe, expect, it } from "vitest";
import { buildReleaseCalendars } from "./sync-release-calendar.mjs";

describe("release calendar sync", () => {
  it("normalizes future sets and Commander decks into stable records", () => {
    const result = buildReleaseCalendars({
      asOf: "2026-10-19",
      setList: {
        meta: { date: "2026-10-19", version: "5.3.0+20261019" },
        data: [
          {
            code: "TRK",
            name: "Star Trek",
            type: "expansion",
            releaseDate: "2026-11-13",
          },
          {
            code: "TRC",
            name: "Star Trek Commander",
            type: "commander",
            releaseDate: "2026-11-13",
          },
          {
            code: "OLD",
            name: "Old Set",
            type: "expansion",
            releaseDate: "2025-01-01",
          },
        ],
      },
      deckList: {
        meta: { date: "2026-10-19" },
        data: [
          {
            code: "TRC",
            fileName: "FederationFleet_TRC",
            name: "Federation Fleet",
            type: "Commander Deck",
            releaseDate: "2026-11-13",
          },
          {
            code: "TRC",
            fileName: "ThemeDeck_TRC",
            name: "Not a commander deck",
            type: "Theme Deck",
            releaseDate: "2026-11-13",
          },
        ],
      },
      existingSets: { records: [] },
      existingPrecons: { records: [] },
    });

    expect(result.upcomingSets.records.map(record => record.setCode)).toEqual([
      "TRK",
      "TRC",
    ]);
    expect(result.preconReleaseCalendar.records).toHaveLength(1);
    expect(result.preconReleaseCalendar.records[0]).toMatchObject({
      id: "TRC:FederationFleet_TRC",
      name: "Federation Fleet",
      status: "upcoming",
      decklistStatus: "complete",
    });
  });

  it("preserves manually curated records that upstream does not know yet", () => {
    const result = buildReleaseCalendars({
      asOf: "2026-10-19",
      setList: { meta: { date: "2026-10-19" }, data: [] },
      deckList: { meta: { date: "2026-10-19" }, data: [] },
      existingSets: {
        records: [
          {
            id: "MANUAL",
            sourceKind: "manual",
            name: "Manual Set",
            releaseDate: "2027-01-01",
          },
        ],
      },
      existingPrecons: {
        records: [
          {
            id: "MANUAL:Deck",
            sourceKind: "manual",
            name: "Manual Deck",
            releaseDate: "2027-01-01",
          },
        ],
      },
    });

    expect(result.upcomingSets.records[0]).toMatchObject({
      id: "MANUAL",
      sourceKind: "manual",
    });
    expect(result.preconReleaseCalendar.records[0]).toMatchObject({
      id: "MANUAL:Deck",
      sourceKind: "manual",
    });
  });
});
