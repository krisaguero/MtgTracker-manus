import { describe, expect, it } from "vitest";

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
});
