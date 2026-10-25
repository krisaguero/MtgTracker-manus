import { beforeAll, describe, expect, it } from "vitest";
import { commanderDecklistsData } from "@/data/commanderDecklistsData";
import {
  commanderPriceSnapshotAsOf,
  commanderPriceSnapshotSource,
  resolveDeckMarketValue,
  loadMarketPriceIndex,
} from "@/lib/marketPriceIndex";
import {
  buildHomePreconSummary,
  formatHomePreconCatalogSummary,
  formatHomePreconSummary,
} from "./homePreconSummary";

describe("homepage precon equity summary", () => {
  beforeAll(async () => {
    await loadMarketPriceIndex();
  });

  it("reports one local-archive scope and its actual card-price coverage instead of zero placeholder values", () => {
    const summary = buildHomePreconSummary(
      commanderDecklistsData,
      resolveDeckMarketValue
    );

    expect(summary.decklistCount).toBe(commanderDecklistsData.length);
    expect(summary.valuedDecklistCount).toBeGreaterThan(0);
    expect(summary.valuedDecklistCount).toBeLessThanOrEqual(
      summary.decklistCount
    );
    expect(summary.equityUsd).toBeGreaterThan(0);
    expect(summary.pricedCardCopies + summary.unpricedCardCopies).toBe(
      summary.totalCardCopies
    );
    expect(summary.totalCardCopies).toBeGreaterThan(0);
    expect(summary.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(summary.coveragePercent).toBeLessThanOrEqual(100);

    const formatted = formatHomePreconSummary(
      summary,
      commanderPriceSnapshotAsOf,
      commanderPriceSnapshotSource
    );
    expect(formatted).toContain(`${summary.decklistCount} local decklists`);
    expect(formatted).toContain(
      `${summary.pricedCardCopies.toLocaleString("en-US")}/${summary.totalCardCopies.toLocaleString("en-US")} card copies priced in USD`
    );
    expect(formatted).toContain(
      `${commanderPriceSnapshotSource} snapshot as of ${commanderPriceSnapshotAsOf}`
    );
  });
});

describe("homepage precon catalog-count summary", () => {
  it("uses the stable local archive as the only source for counts and values", () => {
    expect(formatHomePreconCatalogSummary(173, 173, 173, "available")).toBe(
      "173 of 173 local archive entries · 173 local decklists · Scryfall-only product listings excluded"
    );
  });

  it("keeps the local count stable while the independent recent-set feed is loading or unavailable", () => {
    expect(formatHomePreconCatalogSummary(173, 173, 173, "loading")).toBe(
      "173 of 173 local archive entries · 173 local decklists · Scryfall-only product listings excluded · Recent-set feed loading"
    );
    expect(formatHomePreconCatalogSummary(173, 173, 173, "unavailable")).toBe(
      "173 of 173 local archive entries · 173 local decklists · Scryfall-only product listings excluded · Recent-set Scryfall feed unavailable"
    );
  });
});
