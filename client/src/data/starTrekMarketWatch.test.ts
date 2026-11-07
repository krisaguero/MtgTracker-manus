import { describe, expect, it } from "vitest";
import { starTrekDailyMovers, starTrekMarketSignals } from "./starTrekMarketWatch";

describe("Star Trek daily mover snapshot", () => {
  it("keeps the new Nov. 7 snapshot separate from the earlier editorial rows", () => {
    expect(starTrekDailyMovers).toHaveLength(12);
    expect(starTrekDailyMovers.every(row => row.status === "unverified")).toBe(true);
    expect(starTrekDailyMovers.every(row => row.sourceUrl === "https://www.mtggoldfish.com/movers/paper/trk")).toBe(true);
    expect(starTrekMarketSignals.some(row => row.verifiedWindow.includes("November 2"))).toBe(true);
  });

  it("preserves the source page's leading dollar and percentage moves", () => {
    expect(starTrekDailyMovers.find(row => row.name === "Mr. Spock, Science Officer")).toMatchObject({
      priceUsd: 14.91,
      moveUsd: 2.36,
      moveLabel: "+$2.36 / +19% · Daily Change",
    });
    expect(starTrekDailyMovers.find(row => row.name === "Overgrown Tomb")).toMatchObject({
      priceUsd: 7.99,
      moveUsd: -15.83,
      moveLabel: "-$15.83 / -66% · Daily Change",
    });
  });
});
