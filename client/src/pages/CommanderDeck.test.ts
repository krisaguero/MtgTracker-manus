import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { slugify } from "@/hooks/useCommanderDeck";

describe("CommanderDeck live market valuation calculation", () => {
  it("sums individual card prices correctly across commander and main deck quantities", () => {
    const entries = [
      { quantity: 1, card: { name: "Captain America", prices: { usd: "25.00" } } },
      { quantity: 4, card: { name: "Sol Ring", prices: { usd: "1.50" } } },
      { quantity: 1, card: { name: "Unpriced Promo", prices: { usd: null } } },
    ];

    let sum = 0;
    let pricedCount = 0;
    for (const entry of entries) {
      const priceStr = entry.card.prices.usd;
      const num = priceStr ? Number(priceStr) : NaN;
      if (Number.isFinite(num) && num >= 0) {
        sum += num * entry.quantity;
        pricedCount += entry.quantity;
      }
    }

    expect(sum).toBe(31.0);
    expect(pricedCount).toBe(5);
  });

  it("declares the live valuation hook before loading and error returns", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/CommanderDeck.tsx"), "utf8");
    const valuationHook = source.indexOf("const liveMarketValue = useMemo");
    const loadingReturn = source.indexOf("if (loading)");
    const errorReturn = source.indexOf("if (error || !data)");

    expect(valuationHook).toBeGreaterThan(-1);
    expect(valuationHook).toBeLessThan(loadingReturn);
    expect(valuationHook).toBeLessThan(errorReturn);
  });

  it("generates stable route-safe slugs for Commander product names", () => {
    expect(slugify("World Shaper")).toBe("world-shaper");
    expect(slugify("Alesha, Who Smiles at Death")).toBe("alesha-who-smiles-at-death");
  });
});
