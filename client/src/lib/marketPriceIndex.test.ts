import { beforeAll, describe, expect, it } from "vitest";
import { loadMarketPriceIndex, resolveCardPrice, resolveDeckMarketValue } from "./marketPriceIndex";
import { commanderDecklistsData } from "@/data/commanderDecklistsData";
import commanderCardPriceSnapshot from "@/data/commanderCardPriceSnapshot.json";
import dailyMarketSnapshot from "@/data/dailyMarketSnapshot.json";

describe("shared market price index", () => {
  beforeAll(async () => {
    await loadMarketPriceIndex();
  });

  it("resolves a known daily snapshot signal with source and timestamp", () => {
    const signal = dailyMarketSnapshot.signals.find(
      record => record.name && Number(record.currentUsd) > 0
    );
    expect(signal).toBeDefined();
    const price = resolveCardPrice(signal!.name, signal!.setCode);
    expect(price).not.toBeNull();
    expect(price?.usd).toBeGreaterThan(0);
    expect(price?.source).toBeTruthy();
    expect(price?.updatedAt).toBeTruthy();
  });

  it("does not invent a price for an unknown card", () => {
    expect(resolveCardPrice("Card That Does Not Exist Anywhere")).toBeNull();
  });

  it("does not revive an older fallback quote when the latest snapshot has no USD price for that printing", () => {
    const unpriced = commanderCardPriceSnapshot.records.find(
      record => record.name && record.set_code && typeof record.usd !== "number"
    );
    expect(unpriced).toBeDefined();
    expect(resolveCardPrice(unpriced!.name, unpriced!.set_code)).toBeNull();
  });

  it("keeps Cardmarket quotes labeled in EUR and out of USD equity", () => {
    const record = commanderCardPriceSnapshot.records.find(
      item =>
        item.name &&
        item.set_code &&
        typeof item.usd === "number" &&
        item.prices?.cardmarketCurrency === "EUR" &&
        typeof item.prices?.cardmarket === "number"
    );
    expect(record).toBeDefined();
    const price = resolveCardPrice(
      record!.name,
      record!.set_code,
      record!.collector_number,
      record!.uuid
    );
    expect(price?.usd).toBe(
      record!.prices.tcgplayer ?? record!.prices.cardkingdom
    );
    expect(price?.cardmarketPrice).toBe(record!.prices.cardmarket);
    expect(price?.cardmarketCurrency).toBe(record!.prices.cardmarketCurrency);
  });

  it("does not substitute a regular printing for an unpriced Collector's Edition variant", () => {
    const collector = commanderCardPriceSnapshot.records.find(
      record =>
        record.name === "Captain America, Team Leader" &&
        record.set_code === "msc" &&
        record.collector_number === "879"
    );
    expect(collector).toBeDefined();
    expect(
      resolveCardPrice(
        collector!.name,
        collector!.set_code,
        collector!.collector_number,
        collector!.uuid
      )
    ).toBeNull();
    const regular = commanderCardPriceSnapshot.records.find(
      record =>
        record.name === collector!.name &&
        record.set_code === collector!.set_code &&
        record.collector_number === "5" &&
        typeof record.usd === "number"
    );
    expect(regular).toBeDefined();
    expect(
      resolveCardPrice(
        regular!.name,
        regular!.set_code,
        regular!.collector_number,
        regular!.uuid
      )?.usd
    ).toBeGreaterThan(0);
  });

  it("reports coverage instead of presenting a synthetic deck total as fully priced", () => {
    const value = resolveDeckMarketValue(commanderDecklistsData[0]);
    expect(value.totalUsd).toBeGreaterThanOrEqual(0);
    expect(value.pricedCards + value.unpricedCards).toBeGreaterThan(0);
    expect(value.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(value.coveragePercent).toBeLessThanOrEqual(100);
    expect(value.source).toBeTruthy();
  });
});
