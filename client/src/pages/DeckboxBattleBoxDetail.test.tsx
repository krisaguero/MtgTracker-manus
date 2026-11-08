import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import type { DeckGalleryPayload } from "@/lib/deckGallery";
import metadata from "@/data/deckboxBattleBoxMetadata.json";
import { getDeckboxBattleBoxEntries } from "@/lib/deckboxBattleBox";
import { getDeckGalleryRoleReading } from "@/lib/deckGalleryRoles";
import { DeckboxBattleBoxTiles } from "@/components/DeckboxBattleBoxLibrary";
import { DeckboxBattleBoxDetailView } from "./DeckboxBattleBoxDetail";

const payload = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deck-gallery.json"),
    "utf8"
  )
) as DeckGalleryPayload;
const entries = getDeckboxBattleBoxEntries(payload);
const escapeHtml = (value: string) => renderToStaticMarkup(<>{value}</>);
const expectedIds = [
  "deck-black-grave-delrach-sac",
  "deck-black-aggro-sinister-zombie",
  "deck-black-shadow-rack",
  "deck-duel-decks-eldrazi",
  "deck-green-aggro-buff",
  "deck-the-slivers-modified-precon",
];
const renderDetail = (entry: (typeof entries)[number]) =>
  renderToStaticMarkup(
    <Router ssrPath={`/battle-box/deckbox/${entry.id}`}>
      <DeckboxBattleBoxDetailView entry={entry} />
    </Router>
  );

function quantityMap(rows: { name: string; quantity: number }[]) {
  const result = new Map<string, number>();
  for (const row of rows) result.set(row.name, (result.get(row.name) || 0) + row.quantity);
  return Array.from(result.entries()).sort(([left], [right]) => left.localeCompare(right));
}

describe("Deckbox 60-card Battle Box references", () => {
  it("includes only the six explicitly reviewed non-Commander source rows and fails closed on incomplete changes", () => {
    expect(metadata.map(item => item.deckId)).toEqual(expectedIds);
    expect(entries.map(entry => entry.id)).toEqual(expectedIds);
    for (const entry of entries) {
      const source = payload.entries.find(candidate => candidate.id === entry.id);
      expect(source).toBeDefined();
      expect(entry.mainCopies).toBe(60);
      expect(entry.main.reduce((sum, card) => sum + card.quantity, 0)).toBe(60);
      expect(entry.helm.status).toBe("not_a_commander_deck");
      expect(entry.sourceSectionsOmitted).toBe(false);
      expect(entry.sideboardCopies).toBe(
        entry.sideboard.reduce((sum, card) => sum + card.quantity, 0)
      );
      expect(entry.sourceTitle).toBe(source?.title);
      expect(entry.sourceCredit).toBe(source?.creditLine);
      expect(entry.main).toEqual(source?.main);
      expect(entry.sideboard).toEqual(source?.sideboard);
      expect(entry.formatStatus).toBeTruthy();
      expect(entry.strategySummary).toBeTruthy();
    }

    const altered: DeckGalleryPayload = {
      ...payload,
      entries: payload.entries.map(entry =>
        entry.id === expectedIds[0]
          ? { ...entry, mainCopies: 59 }
          : entry
      ),
    };
    expect(getDeckboxBattleBoxEntries(altered).map(entry => entry.id)).toEqual(
      expectedIds.slice(1)
    );
  });

  it("groups every public Deck Gallery source row exactly once without changing its count", () => {
    for (const source of payload.entries) {
      const reading = getDeckGalleryRoleReading(source.id);
      expect(reading, source.id).toBeDefined();
      if (!reading) continue;
      for (const [section, sourceRows, expectedCopies] of [
        ["main", source.main, source.mainCopies],
        ["sideboard", source.sideboard, source.sideboardCopies],
      ] as const) {
        const groups = reading[section];
        expect(groups.every(group => group.title && group.description)).toBe(true);
        expect(groups.reduce((sum, group) => sum + group.copies, 0)).toBe(expectedCopies);
        expect(groups.flatMap(group => group.cards).reduce((sum, card) => sum + card.quantity, 0)).toBe(expectedCopies);
        expect(quantityMap(groups.flatMap(group => group.cards))).toEqual(quantityMap(sourceRows));
      }
    }
  });

  it.each(entries)("renders a source-credited, image-rich, anonymous detail page for $sourceTitle", entry => {
    const html = renderDetail(entry);
    const roleReading = getDeckGalleryRoleReading(entry.id);
    const roleRows = roleReading
      ? [...roleReading.main, ...roleReading.sideboard].reduce(
          (count, group) => count + group.cards.length,
          0
        )
      : 0;
    expect(html).toContain(escapeHtml(entry.sourceTitle));
    expect(html).toContain(escapeHtml(entry.sourceCredit));
    expect(html).toContain(escapeHtml(entry.formatStatus));
    expect(html).toContain(escapeHtml(entry.strategySummary));
    expect(html).toContain("60-card constructed list");
    expect(html).toContain("Non-Commander");
    expect(html).toContain("Precon-style card categories");
    expect(html).toContain("not categories supplied by the Deckbox list’s author");
    expect(html).toContain("Original saved order");
    expect(html).toContain("Exact text list · Main deck · 60 copies");
    expect(html).toContain(`Sideboard · ${entry.sideboardCopies} copies`);
    expect(html.match(/<img\b/g) ?? []).toHaveLength(
      entry.main.length + entry.sideboard.length + roleRows
    );

    const originalOrderSection = html.slice(html.indexOf("Original saved order"));
    if (entry.main.length > 1) {
      expect(originalOrderSection.indexOf(escapeHtml(entry.main[0].name))).toBeLessThan(
        originalOrderSection.indexOf(escapeHtml(entry.main[entry.main.length - 1].name))
      );
    }
    for (const card of [...entry.main, ...entry.sideboard]) {
      expect(html).toContain(escapeHtml(card.name));
      expect(html).toContain(`>${card.quantity}×</span>`);
    }
  });

  it("shows each source title as a distinct Battle Box tile and uses the nested anonymous route", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/battle-box">
        <DeckboxBattleBoxTiles entries={entries} />
      </Router>
    );
    expect(html).toContain("Deckbox 60-card Battle Box references");
    expect(html).toContain("6 saved lists");
    for (const entry of entries) {
      expect(html).toContain(escapeHtml(entry.sourceTitle));
      expect(html).toContain(`/battle-box/deckbox/${entry.id}`);
    }
    const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    expect(appSource).toContain('path="/battle-box/deckbox/:deckId"');
  });
});
