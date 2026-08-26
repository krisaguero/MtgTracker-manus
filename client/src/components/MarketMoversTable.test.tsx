import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { filterMarketMovers, hasUpwardPriceTrend, MarketMoversTable } from "./MarketMoversTable";
import type { MoverCard } from "@/lib/dailyMoversEngine";

const sampleMover: MoverCard = {
  id: "sample-demonic-tutor",
  name: "Demonic Tutor",
  setCode: "lea",
  setName: "Limited Edition Alpha",
  rarity: "rare",
  currentUsd: 45,
  previousUsd: 38,
  changeUsd: 7,
  percentChange: 18.4,
  recentPrices: [31, 34, 36, 38, 45],
  category: "high-spikes",
  signalSource: "Scryfall Snapshot",
  thesis: "Legacy-set momentum signal.",
};

describe("MarketMoversTable filtering and loading state", () => {
  it("filters by card name without changing the source dataset", () => {
    const secondMover = { ...sampleMover, id: "sample-force-of-will", name: "Force of Will", setCode: "all" };
    const rows = filterMarketMovers([sampleMover, secondMover], {
      cardNameQuery: "demonic",
      searchQuery: "",
      upwardTrendOnly: false,
      categoryFilter: "all",
      sourceFilter: "all",
      rarityFilter: "all",
      minimumMove: "0",
      sortKey: "name",
      sortDirection: "asc",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Demonic Tutor");
  });

  it("filters to cards with a real upward multi-point trend", () => {
    const fallingMover = { ...sampleMover, id: "sample-falling", name: "Falling Card", recentPrices: [45, 42, 39, 35, 31] };
    const shortHistoryMover = { ...sampleMover, id: "sample-short", name: "Short History Card", recentPrices: [38, 45] };
    const rows = filterMarketMovers([sampleMover, fallingMover, shortHistoryMover], {
      cardNameQuery: "",
      searchQuery: "",
      upwardTrendOnly: true,
      categoryFilter: "all",
      sourceFilter: "all",
      rarityFilter: "all",
      minimumMove: "0",
      sortKey: "name",
      sortDirection: "asc",
    });

    expect(hasUpwardPriceTrend(sampleMover)).toBe(true);
    expect(hasUpwardPriceTrend(fallingMover)).toBe(false);
    expect(hasUpwardPriceTrend(shortHistoryMover)).toBe(false);
    expect(rows.map((row) => row.name)).toEqual(["Demonic Tutor"]);
  });

  it("renders the upward trend toggle above the table", () => {
    const markup = renderToStaticMarkup(
      <MarketMoversTable data={[sampleMover]} title="Daily Movers Table" description="Trend toggle test" />,
    );

    expect(markup).toContain('aria-label="Show only cards with an upward price trend in Daily Movers Table"');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain("Upward trend only");
    expect(markup).toContain("3+ observations");
  });

  it("sorts numeric movers and applies rarity plus minimum-move filters", () => {
    const mythic = { ...sampleMover, id: "sample-mythic", name: "Aether Flux", rarity: "mythic" as const, currentUsd: 80, percentChange: 12 };
    const common = { ...sampleMover, id: "sample-common", name: "Common Card", rarity: "common" as const, currentUsd: 3, percentChange: 4 };
    const rows = filterMarketMovers([sampleMover, mythic, common], {
      cardNameQuery: "",
      searchQuery: "",
      upwardTrendOnly: false,
      categoryFilter: "all",
      sourceFilter: "all",
      rarityFilter: "mythic",
      minimumMove: "10",
      sortKey: "currentUsd",
      sortDirection: "desc",
    });

    expect(rows.map((row) => row.name)).toEqual(["Aether Flux"]);
  });

  it("renders an accessible price trend sparkline for populated rows", () => {
    const markup = renderToStaticMarkup(
      <MarketMoversTable
        data={[sampleMover]}
        title="Daily Movers Table"
        description="Sparkline test"
      />,
    );

    expect(markup).toContain('data-testid="market-sparkline"');
    expect(markup).toContain('aria-label="Price trend with 5 observations from $31.00 to $45.00"');
    expect(markup).toContain("Rising · +18.4%");
    expect(markup).toMatch(/<polyline[^>]+points="[^"]+,[^"]+ [^"]+,[^"]+ [^"]+,[^"]+ [^"]+,[^"]+ [^"]+,[^"]+"/);
  });

  it("renders a clear fallback when recent history has fewer than three points", () => {
    const markup = renderToStaticMarkup(
      <MarketMoversTable
        data={[{ ...sampleMover, recentPrices: [38, 45] }]}
        title="Daily Movers Table"
        description="Sparkline fallback test"
      />,
    );

    expect(markup).toContain('data-testid="market-sparkline-fallback"');
    expect(markup).toContain("History pending");
    expect(markup).toContain("Price trend unavailable: only 2 recent observations are available");
  });

  it("renders a pressed star control for watched rows", () => {
    const markup = renderToStaticMarkup(
      <MarketMoversTable
        data={[sampleMover]}
        title="Daily Movers Table"
        description="Watchlist test"
        watchlist={[{ cardName: "Demonic Tutor", setCode: "lea", addedAt: "2026-08-16T00:00:00.000Z" }]}
        onToggleWatchlist={() => undefined}
      />,
    );

    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("Remove Demonic Tutor from watchlist");
  });

  it("renders accessible skeleton rows while market data is loading", () => {
    const markup = renderToStaticMarkup(
      <MarketMoversTable
        data={[]}
        title="Daily Movers Table"
        description="Loading test"
        isLoading
      />,
    );

    expect(markup).toContain('id="daily-movers-table-card-name-search"');
    expect(markup).toContain('placeholder="Search by card name…"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Loading Parquet market data");
    expect((markup.match(/data-testid="market-table-skeleton-row"/g) ?? []).length).toBe(7);
    expect(markup).not.toContain("No records match the current filters.");
  });

  it("removes skeleton rows and renders live data after loading resolves", () => {
    const loadingMarkup = renderToStaticMarkup(
      <MarketMoversTable
        data={[]}
        title="Daily Movers Table"
        description="Loading test"
        isLoading
      />,
    );
    const populatedMarkup = renderToStaticMarkup(
      <MarketMoversTable
        data={[sampleMover]}
        title="Daily Movers Table"
        description="Loaded test"
        isLoading={false}
      />,
    );

    expect(loadingMarkup).toContain('data-testid="market-table-skeleton-row"');
    expect(populatedMarkup).not.toContain('data-testid="market-table-skeleton-row"');
    expect(populatedMarkup).toContain("Demonic Tutor");
    expect(populatedMarkup).toContain("18.4%");
  });
});
