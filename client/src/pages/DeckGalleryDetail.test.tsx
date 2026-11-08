import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import type { DeckGalleryPayload } from "@/lib/deckGallery";
import { DeckGalleryDetailView } from "./DeckGalleryDetail";

const payload = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deck-gallery.json"),
    "utf8"
  )
) as DeckGalleryPayload;
const samples = [
  payload.entries.find(
    entry => entry.group === "owner_archive_list" && entry.main.length > 0
  )!,
  payload.entries.find(entry => entry.group === "robert_title_credit")!,
  payload.entries.find(entry => entry.group === "owner_wip_offbeat")!,
  payload.entries.find(entry => entry.group === "owner_wip_empty")!,
];
const escapeHtml = (value: string) => renderToStaticMarkup(<>{value}</>);
const page = (entry: DeckGalleryPayload["entries"][number]) =>
  renderToStaticMarkup(
    <Router ssrPath={`/deck-gallery/${entry.id}`}>
      <DeckGalleryDetailView entry={entry} />
    </Router>
  );

describe("individual public Deck Gallery pages", () => {
  it.each(samples)(
    "shows a visual page for $id without inventing a commander",
    entry => {
      const html = page(entry);
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).toContain(escapeHtml(entry.title));
      expect(html).toContain("Commander not confirmed");
      expect(html).toContain(
        "No commander is named in this saved export. None has been assigned from the title or card list."
      );
      expect(html).toContain(escapeHtml(entry.creditLine));
      expect(html).toContain("Exact text list · main and sideboard");
      expect(html).toContain("Source order preserved");
      expect(html.match(/<img\b/g) ?? []).toHaveLength(
        entry.main.length + entry.sideboard.length
      );

      const allCards = [...entry.main, ...entry.sideboard];
      for (const card of allCards) {
        expect(html).toContain(escapeHtml(card.name));
        expect(html).toContain(`>${card.quantity}×</span>`);
      }
      if (entry.main.length) {
        const imageUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(entry.main[0].name)}&format=image&version=normal`;
        expect(html).toContain(escapeHtml(imageUrl));
      }
      if (entry.main.length > 1) {
        expect(html.indexOf(escapeHtml(entry.main[0].name))).toBeLessThan(
          html.indexOf(escapeHtml(entry.main[entry.main.length - 1].name))
        );
      }
      if (entry.sideboard.length) {
        expect(html).toContain(`Sideboard · ${entry.sideboardCopies} copies`);
        expect(html).toContain('aria-label="Sideboard"');
      }
      expect(html).toContain(
        `href="${entry.group === "robert_title_credit" ? "/deck-gallery/robogles" : entry.group.startsWith("owner_wip") ? "/deck-gallery/wip" : "/deck-gallery"}"`
      );
    }
  );

  it("keeps the catalog’s individual-page link and does not change the public source data", () => {
    const catalog = readFileSync(
      resolve(process.cwd(), "client/src/pages/DeckGallery.tsx"),
      "utf8"
    );
    expect(catalog).toContain("href={`/deck-gallery/${entry.id}`}");
    expect(catalog).toContain("Visual deck page");
    expect(payload.entries).toHaveLength(166);
    expect(payload.entries.every(entry => !("commanderName" in entry))).toBe(
      true
    );
  });
});
