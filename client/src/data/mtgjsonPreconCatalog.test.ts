import { describe, expect, it } from "vitest";
import { mtgjsonPreconCatalog } from "./mtgjsonPreconCatalog";
import { strategyPackages } from "@/lib/preconStrategyEvidence";
import type { ScryfallCard } from "@/hooks/useSetDetail";

describe("official precon catalog coverage", () => {
  it("keeps the full indexed 198-deck upstream coverage visible", () => {
    expect(mtgjsonPreconCatalog.statistics.upstreamCommanderDecks).toBe(198);
    expect(mtgjsonPreconCatalog.statistics.existingLocalDecks + mtgjsonPreconCatalog.statistics.newlyDiscoveredCommanderDecks).toBe(198);
    expect(mtgjsonPreconCatalog.statistics.pendingDecks).toBe(0);
  });

  it("has a conservative fallback for every unresolved source row", () => {
    const card = (name: string): ScryfallCard => ({ id: name, name, type_line: "Card", colors: [], color_identity: [], rarity: "common", set: "TST", collector_number: name, released_at: "2024-01-01", layout: "normal" });
    const rows = Array.from({ length: 198 }, (_, index) => ({ card: card(`Indexed row ${index + 1}`), quantity: index % 3 + 1 }));
    const packages = strategyPackages(rows);
    const grouped = packages.flatMap(pkg => pkg.cards);
    expect(packages.at(-1)?.label).toBe("Other cards");
    expect(grouped).toHaveLength(198);
    expect(new Set(grouped.map((row, index) => `${row.card.id}:${index}`)).size).toBe(198);
  });
});
