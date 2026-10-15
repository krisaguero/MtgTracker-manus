import { describe, expect, it } from "vitest";
import { marketDataCueText, marketDataStatusFromIndex } from "./MarketDataCue";

describe("shared market-data status cue", () => {
  it("distinguishes not-loaded, loading, and unavailable price data", () => {
    expect(marketDataCueText("idle")).toContain("not loaded");
    expect(marketDataCueText("loading")).toContain("loading");
    expect(marketDataCueText("error")).toContain("unavailable");
  });

  it("uses the same dated source provenance wording for all ready views", () => {
    expect(
      marketDataCueText("ready", "MTGJSON AllPricesToday", "2026-10-15")
    ).toBe("MTGJSON AllPricesToday snapshot as of 2026-10-15");
    expect(marketDataCueText("ready")).toBe(
      "Card-price index snapshot as of date unavailable"
    );
  });

  it("does not treat a decklist archive load as a price-index request", () => {
    expect(marketDataStatusFromIndex("idle", false)).toBe("idle");
    expect(marketDataStatusFromIndex("loading", false)).toBe("loading");
    expect(marketDataStatusFromIndex("error", false)).toBe("error");
    expect(marketDataStatusFromIndex("idle", true)).toBe("ready");
  });
});
