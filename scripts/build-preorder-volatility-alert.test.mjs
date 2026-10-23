import { describe, expect, it } from "vitest";
import { buildPreorderVolatilityAlert } from "./build-preorder-volatility-alert.mjs";

const signal = (key, price, overrides = {}) => ({
  key,
  id: key,
  name: key,
  setCode: "TRC",
  setName: "Star Trek Commander",
  currentUsd: price,
  tcgplayerMarketUsd: price,
  cardKingdomUsd: price,
  sourceCount: 2,
  ...overrides,
});

describe("preorder volatility alert", () => {
  it("alerts on daily movement and marketplace spread for a target preorder", () => {
    const result = buildPreorderVolatilityAlert(
      [
        {
          date: "2026-10-15",
          generatedAt: "2026-10-15T12:00:00Z",
          signals: [signal("Federation Fleet", 10)],
        },
        {
          date: "2026-10-22",
          generatedAt: "2026-10-22T12:00:00Z",
          signals: [
            signal("Federation Fleet", 12, {
              tcgplayerMarketUsd: 12,
              cardKingdomUsd: 10,
            }),
          ],
        },
      ],
      { records: [{ setCode: "TRC", releaseDate: "2026-11-13" }] }
    );

    expect(result.status).toBe("alert");
    expect(result.alerts[0]).toMatchObject({
      name: "Federation Fleet",
      preorderWindow: true,
      dailyPct: 20,
      marketplaceSpreadPct: 20,
    });
    expect(result.alerts[0].reasons).toEqual(
      expect.arrayContaining(["daily-volatility", "marketplace-spread"])
    );
  });

  it("matches Mystery Booster Commander by set code and event release date", () => {
    const result = buildPreorderVolatilityAlert([
      {
        date: "2026-10-22",
        signals: [signal("New Mystery Commander", 4, { setCode: "MBC" })],
      },
    ]);

    expect(result.coverage.matchingSignals).toBe(1);
    expect(result.targets[0]).toMatchObject({
      setCode: "MBC",
      releaseDate: "2026-11-13",
      preorderWindow: true,
    });
    expect(result.status).toBe("clear");
  });

  it("does not fabricate an alert while target prices are absent", () => {
    const result = buildPreorderVolatilityAlert([
      {
        date: "2026-10-22",
        signals: [
          signal("Other Card", 20, {
            setCode: "TDC",
            setName: "The Dark Collection",
          }),
        ],
      },
    ]);

    expect(result).toMatchObject({
      status: "awaiting-coverage",
      coverage: { matchingSignals: 0, alertedSignals: 0 },
      alerts: [],
    });
  });
});
