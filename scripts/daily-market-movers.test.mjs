import { describe, expect, it } from "vitest";
import { parseDeckReferences, priceForCard } from "./daily-market-movers.mjs";

describe("daily market mover ingestion", () => {
  it("parses generated JSON-style Commander deck records with trailing metadata", () => {
    const source = `
      {
        "name": "Avenge",
        "set_code": "msc",
        "number": "11",
        "count": 1,
        "uuid": "example"
      }
    `;

    expect(parseDeckReferences(source)).toEqual([
      {
        name: "Avenge",
        setCode: "msc",
        number: "11",
        count: 1,
        origin: "Commander decklist",
      },
    ]);
  });

  it("accepts the current foil-only MTGJSON retail shape as a fallback quote", () => {
    expect(
      priceForCard({
        paper: {
          tcgplayer: { retail: { foil: { "2026-10-19": 4.25 } } },
          cardkingdom: { retail: { foil: { "2026-10-19": 5.1 } } },
        },
      })
    ).toMatchObject({
      marketUsd: 4.25,
      tcgplayerMarketUsd: 4.25,
      cardKingdomUsd: 5.1,
    });
  });
});
