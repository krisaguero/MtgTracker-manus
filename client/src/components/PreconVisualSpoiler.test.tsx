import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PreconVisualSpoiler } from "./PreconVisualSpoiler";
import type { ScryfallCard } from "@/hooks/useSetDetail";
import type { DecklistEntry } from "@/hooks/useCommanderDeck";

function entry(name: string, oracle_text?: string, quantity = 1): DecklistEntry {
  const card: ScryfallCard = {
    id: name, name, oracle_text, type_line: "Artifact", colors: [], color_identity: [], rarity: "common", set: "TST", collector_number: "7", released_at: "2024-01-01", layout: "normal", scryfall_uri: `https://scryfall.com/card/tst/7/${name.toLowerCase().replace(/ /g, "-")}`, image_uris: { normal: `https://cards.scryfall.io/${name}.jpg`, small: "", png: "", art_crop: "", border_crop: "" },
  };
  return { card, quantity, zone: "deck" };
}

describe("PreconVisualSpoiler SSR", () => {
  it("defaults to visual bundles while preserving exact rows, roles, zoom, and printing links", () => {
    const rows = [entry("Energy Engine", "{T}: Add {E}{E}.", 2), entry("Energy Engine", "{T}: Add {E}{E}.", 1), entry("Rad Counter", "Whenever this attacks, proliferate.")];
    const html = renderToStaticMarkup(<PreconVisualSpoiler commander={[]} deck={rows} />);
    expect(html).toContain("Visual spoiler");
    expect(html).toContain("Readable source order");
    expect(html).toContain("Uses energy counters");
    expect(html).toContain("https://scryfall.com/card/tst/7/energy-engine");
    expect(html).toContain("TST #7 · Scryfall");
    expect(html.match(/Energy Engine/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Zoom image of Energy Engine");
    expect(html).not.toContain("pattern");
    expect(html).not.toContain("regex");
  });
});
