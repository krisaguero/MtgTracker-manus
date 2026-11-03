import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { cardIndexHref } from "./CardIndexLink";

describe("shared card navigation and display primitives", () => {
  it("builds an encoded internal card market route", () => {
    expect(cardIndexHref("Atraxa, Praetors' Voice")).toBe(
      "/card/Atraxa%2C%20Praetors'%20Voice",
    );
  });

  it("uses one portrait frame ratio across the primary card surfaces", () => {
    const files = [
      "client/src/pages/SetDetail.tsx",
      "client/src/pages/PreconCatalog.tsx",
      "client/src/components/PreconVisualSpoiler.tsx",
      "client/src/components/BrawlDeckCard.tsx",
      "client/src/components/MarketCardItem.tsx",
    ];
    for (const file of files) {
      expect(readFileSync(resolve(process.cwd(), file), "utf8")).toContain(
        "CardMediaFrame",
      );
    }
  });
});
