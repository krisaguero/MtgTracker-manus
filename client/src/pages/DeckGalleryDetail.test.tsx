import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import type { DeckGalleryPayload } from "@/lib/deckGallery";
import { DeckGalleryCardPresentation } from "@/components/DeckGalleryRoleReading";
import { getDeckGalleryCardImageUri } from "@/lib/deckGalleryImageUris";
import { DeckGalleryDetailView } from "./DeckGalleryDetail";
import {
  getDeckGalleryRemainderCards,
  getDeckGalleryRoleReading,
} from "@/lib/deckGalleryRoles";

const payload = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deck-gallery.json"),
    "utf8"
  )
) as DeckGalleryPayload;
const entry = (title: string) => {
  const match = payload.entries.find(candidate => candidate.title === title);
  if (!match) throw new Error(`Missing public deck entry: ${title}`);
  return match;
};
const escapeHtml = (value: string) => renderToStaticMarkup(<>{value}</>);
function quantityMap(rows: { name: string; quantity: number }[]) {
  const result = new Map<string, number>();
  for (const row of rows) result.set(row.name, (result.get(row.name) || 0) + row.quantity);
  return Array.from(result.entries()).sort(([left], [right]) => left.localeCompare(right));
}
const page = (deck: DeckGalleryPayload["entries"][number]) =>
  renderToStaticMarkup(
    <Router ssrPath={`/deck-gallery/${deck.id}`}>
      <DeckGalleryDetailView entry={deck} />
    </Router>
  );

const samples = [
  entry("Black - Sworn To Darkness"),
  entry("Akiri-Silas Tokens"),
  entry("Goreclaw Arena hist brawl."),
  entry("120 card winchester draft bones"),
  entry("Breya Facts - Robogles Build"),
  entry("DRAGONS MF"),
];

describe("individual public Deck Gallery pages", () => {
  it.each(samples)(
    "renders the helm status and exclusive category/remainder view for $id",
    deck => {
      const html = page(deck);
      const helmArtCount =
        deck.helm.commanders.length + (deck.helm.separateChildGuess ? 1 : 0);
      const distinctSourceCards =
        new Set(deck.main.map(card => card.name)).size +
        new Set(deck.sideboard.map(card => card.name)).size;
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).toContain(escapeHtml(deck.title));
      expect(html).toContain(escapeHtml(deck.helm.label));
      expect(html).toContain(escapeHtml(deck.creditLine));
      expect(html).toContain("Show exact saved-order list");
      expect(html).toContain("Categories");
      expect(html).not.toContain("Exact saved-order list · Main deck");
      expect(html.match(/<img\b/g) ?? []).toHaveLength(
        distinctSourceCards + helmArtCount
      );
      expect(html).not.toContain("api.scryfall.com/cards/named");
      expect(html).toContain("https://cards.scryfall.io/normal/");
      expect(html).toContain("not categories supplied by the Deckbox list’s author");

      for (const card of [...deck.main, ...deck.sideboard]) {
        expect(html).toContain(escapeHtml(card.name));
      }
      if (deck.main.length) {
        const imageUrl = getDeckGalleryCardImageUri(deck.main[0].name, "normal");
        expect(imageUrl).toBeDefined();
        if (imageUrl) expect(html).toContain(escapeHtml(imageUrl));
      }
      if (deck.sideboard.length) {
        expect(html).toContain('aria-label="Sideboard"');
      }
      expect(html).toContain(
        `href="${deck.group === "robert_title_credit" ? "/deck-gallery/robogles" : deck.group.startsWith("owner_wip") ? "/deck-gallery/wip" : "/deck-gallery"}"`
      );
    }
  );

  it("reconciles every approved source count without duplicate category names or category/remainder overlap", () => {
    expect(payload.entries).toHaveLength(166);
    for (const deck of payload.entries) {
      const reading = getDeckGalleryRoleReading(deck.id);
      expect(reading, deck.id).toBeDefined();
      if (!reading) continue;
      const allCategoryCards = [...reading.main, ...reading.sideboard].flatMap(group => group.cards);
      expect(new Set(allCategoryCards.map(card => card.name)).size).toBe(allCategoryCards.length);
      expect([...reading.main, ...reading.sideboard].every(group =>
        !/^(lands|ramp|draw|interaction|engines|combat|threats|support)$/.test(group.id)
      )).toBe(true);

      for (const [section, sourceRows, categories, expectedCopies] of [
        ["main", deck.main, reading.main, deck.mainCopies],
        ["sideboard", deck.sideboard, reading.sideboard, deck.sideboardCopies],
      ] as const) {
        const categoryCards = categories.flatMap(group => group.cards);
        const remainder = getDeckGalleryRemainderCards(sourceRows, categories);
        const visibleCards = [...categoryCards, ...remainder];
        expect(new Set(categoryCards.map(card => card.name)).size, `${deck.id} ${section} categories`).toBe(categoryCards.length);
        expect(new Set(visibleCards.map(card => card.name)).size, `${deck.id} ${section} view`).toBe(visibleCards.length);
        expect(quantityMap(visibleCards), `${deck.id} ${section} quantity map`).toEqual(quantityMap(sourceRows));
        expect(visibleCards.reduce((total, card) => total + card.quantity, 0), `${deck.id} ${section} copies`).toBe(expectedCopies);
      }
    }
  });

  it("shows the exact source order only in the alternate view", () => {
    const deck = entry("Akiri-Silas Tokens");
    const savedOrderHtml = renderToStaticMarkup(
      <DeckGalleryCardPresentation
        entry={deck}
        reading={getDeckGalleryRoleReading(deck.id)}
        view="saved-order"
      />
    );
    expect(savedOrderHtml).toContain(`Main deck · ${deck.mainCopies} copies`);
    expect(savedOrderHtml).toContain(`Sideboard · ${deck.sideboardCopies} copies`);
    expect(savedOrderHtml).not.toContain("data-gallery-card-view=");
    if (deck.main.length > 1) {
      expect(savedOrderHtml.indexOf(escapeHtml(deck.main[0].name))).toBeLessThan(
        savedOrderHtml.indexOf(escapeHtml(deck.main[deck.main.length - 1].name))
      );
    }
  });

  it("shows official precon support and flags a commander absent from the export", () => {
    const sworn = entry("Black - Sworn To Darkness");
    const html = page(sworn);
    expect(sworn.helm.status).toBe("assigned");
    expect(sworn.helm.label).toBe("Assigned · official precon");
    expect(sworn.helm.commanders).toEqual([
      expect.objectContaining({
        name: "Ob Nixilis of the Black Oath",
        sourceLocation: "not_in_source",
        proposedZoneMove: false,
      }),
    ]);
    expect(html).toContain("Not present in source list");
    expect(html).toContain("Precon decklist reference");
  });

  it("shows both partner commanders and flags their proposed moves without changing their rows", () => {
    const partner = entry("Akiri-Silas Tokens");
    const html = page(partner);
    expect(partner.helm.commanders.map(card => card.name)).toEqual([
      "Akiri, Line-Slinger",
      "Silas Renn, Seeker Adept",
    ]);
    expect(
      partner.helm.commanders.every(card => card.sourceLocation === "main")
    ).toBe(true);
    expect(partner.helm.commanders.every(card => card.proposedZoneMove)).toBe(
      true
    );
    expect(html).toContain("Assigned · partner pair");
    expect(html).toContain("Proposed zone move: Main → command zone");
    const helmImage = getDeckGalleryCardImageUri("Akiri, Line-Slinger", "art_crop");
    expect(helmImage).toBeDefined();
    if (helmImage) expect(html).toContain(escapeHtml(helmImage));
    expect(html).not.toContain("api.scryfall.com/cards/named");
  });

  it("does not turn Historic Brawl or draft lists into Commander decks", () => {
    const historicBrawl = entry("Goreclaw Arena hist brawl.");
    const draft = entry("120 card winchester draft bones");
    expect(historicBrawl.helm.label).toBe("Not a Commander deck");
    expect(historicBrawl.helm.commanders).toEqual([]);
    expect(historicBrawl.helm.note).toContain(
      "Historic Brawl is not Commander"
    );
    expect(draft.helm.label).toBe("Not a Commander deck");
    expect(draft.helm.commanders).toEqual([]);
  });

  it("keeps a Robogles constructed-list guess distinct as a hypothetical child helm", () => {
    const breya = entry("Breya Facts - Robogles Build");
    const html = page(breya);
    expect(breya.helm.status).toBe("not_a_commander_deck");
    expect(breya.helm.commanders).toEqual([]);
    expect(breya.helm.separateChildGuess?.name).toBe("Breya, Etherium Shaper");
    expect(html).toContain("Not a Commander deck");
    expect(html).toContain(
      "Separate hypothetical child guess · not assigned to this source"
    );
    expect(html).toContain(
      "Hypothetical child only: proposed move from Main to command zone"
    );
  });

  it("keeps ambiguous Vintage and empty WIP choices as separate child guesses", () => {
    const candidates = [
      { title: "DRAGONS MF", name: "Atarka, World Render", location: "main" },
      {
        title: "Grenzo / Krekno Goblin MTGO",
        name: "Krenko, Mob Boss",
        location: "main",
      },
      {
        title: "Jeleva's Exile",
        name: "Jeleva, Nephalia's Scourge",
        location: "main",
      },
      {
        title: "Marath Juiced (PRECON)",
        name: "Marath, Will of the Wild",
        location: "not_in_source",
      },
      {
        title: "Marisi, Breaker of the Coil EDH",
        name: "Marisi, Breaker of the Coil",
        location: "not_in_source",
      },
    ] as const;

    for (const candidate of candidates) {
      const deck = entry(candidate.title);
      const html = page(deck);
      expect(deck.helm.status, candidate.title).toBe("unconfirmed");
      expect(deck.helm.commanders, candidate.title).toEqual([]);
      expect(deck.helm.separateChildGuess).toEqual(
        expect.objectContaining({
          name: candidate.name,
          sourceLocation: candidate.location,
          proposedZoneMove: candidate.location !== "not_in_source",
        })
      );
      expect(html).toContain("Commander not confirmed");
      expect(html).toContain(
        "Separate hypothetical child guess · not assigned to this source"
      );
      expect(html).toContain(escapeHtml(candidate.name));
      if (candidate.location === "not_in_source")
        expect(html).toContain("Not present in source list");
      else
        expect(html).toContain(
          "Hypothetical child only: proposed move from Main to command zone"
        );
    }
  });

  it("provides a guess or a separate child guess for all 18 Robogles-titled entries", () => {
    const robogles = payload.entries.filter(
      deck => deck.group === "robert_title_credit"
    );
    expect(robogles).toHaveLength(18);
    expect(
      robogles.every(
        deck =>
          deck.helm.commanders.length > 0 ||
          Boolean(deck.helm.separateChildGuess)
      )
    ).toBe(true);
  });

  it("keeps the individual-page link and source card rows separate from helm metadata", () => {
    const catalog = readFileSync(
      resolve(process.cwd(), "client/src/pages/DeckGallery.tsx"),
      "utf8"
    );
    expect(catalog).toContain("href={`/deck-gallery/${entry.id}`}");
    expect(catalog).toContain("Visual deck page");
    expect(payload.entries).toHaveLength(166);
    expect(payload.entries.every(deck => deck.helm)).toBe(true);
    expect(
      payload.entries.every(deck =>
        [...deck.main, ...deck.sideboard].every(
          card => !("helm" in card) && !("commander" in card)
        )
      )
    ).toBe(true);
  });
});
