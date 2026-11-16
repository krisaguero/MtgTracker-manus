import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import type { DeckGalleryPayload } from "@/lib/deckGallery";
import type { BreweryReviewPayload } from "@/lib/deckBreweryReviews";
import {
  DeckBreweryReviewDetailView,
  DeckBreweryReviewIndexView,
} from "./DeckBreweryReviews";

const payload = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deck-brewery-reviews.json"),
    "utf8"
  )
) as BreweryReviewPayload;
const gallery = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deck-gallery.json"),
    "utf8"
  )
) as DeckGalleryPayload;
const escapeHtml = (value: string) => renderToStaticMarkup(<>{value}</>);
const entry = (title: string) => {
  const match = payload.entries.find(candidate => candidate.title === title);
  if (!match) throw new Error(`Missing public Brewery entry: ${title}`);
  return match;
};
const page = (review: BreweryReviewPayload["entries"][number]) =>
  renderToStaticMarkup(
    <Router ssrPath={`/deck-brewery/reviews/${review.slug}`}>
      <DeckBreweryReviewDetailView entry={review} />
    </Router>
  );

describe("public Deck Brewery pages", () => {
  it("renders a searchable card-art catalog without sign-in language or private source data", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/deck-brewery/reviews">
        <DeckBreweryReviewIndexView payload={payload} />
      </Router>
    );
    expect(html).toContain("Open proposal shelf · no sign-in");
    expect(html).toContain("source lists with a review page");
    expect(html).toContain(">166</strong>");
    expect(html).toContain('href="/deck-brewery/reviews/xenagos-budget-edh"');
    expect(html).toContain("Gisa and Geralf — Graveyard Mashup");
    expect(html).toContain("110 main + 33 sideboard");
    expect(html).toContain("with a best-fit / inferred helm");
    expect(html).toContain(
      'href="/brawl-box/deck-gisa-and-geralf-graveyard-mashup-preview"'
    );
    expect(html).toContain("Search a title, card, role, or status");
    expect(html).toContain("Best-fit / inferred");
    expect(html).toContain("Proposal · untested");
    expect(html).toContain("Title credit");
    expect(html).toContain("Helm inferred");
    expect(html).not.toMatch(
      /\/home\/ubuntu|private_source|archive_id|owned_cards_checked/i
    );
  });

  it("shows exact proposed cards, card art, count caveats, and a link to the unchanged public source", () => {
    const xenagos = entry("Xenagos Budget EDH");
    const html = page(xenagos);
    expect(html).toContain(escapeHtml(xenagos.title));
    expect(html).toContain("138/100");
    expect(html).toContain("38 copies above target");
    expect(html).toContain("Not count-balanced");
    expect(html).toContain("Beast Within");
    expect(html).toContain("Brontotherium");
    expect(html).toContain("https://cards.scryfall.io/art_crop/");
    expect(html).not.toContain("api.scryfall.com/cards/named");
    expect(html).toContain("Proposal · untested");
    expect(html).toContain(`href="${xenagos.sourceGalleryHref}"`);
    expect(html).toContain("not a final deck");
    expect(html).toContain("Xenagos, God of Revels");
    expect(html).toContain("Best-fit / inferred");
    expect(xenagos.proposal.commander).toBeNull();
  });

  it("shows official precon support without presenting the source row as verified zone metadata", () => {
    const sworn = entry("Black - Sworn To Darkness");
    const html = page(sworn);
    expect(html).toContain("Butcher of Malakir");
    expect(html).toContain("Swiftfoot Boots");
    expect(html).toContain("sideboard → library");
    expect(html).toContain("Assigned · official precon");
    expect(html).toContain("Ob Nixilis of the Black Oath");
    expect(html).toContain("Not present in source list");
    expect(html).not.toContain("At the helm · verified");
  });

  it("keeps title-level Robogles credit and guesses distinct from authorship or endorsement", () => {
    const daxos = entry("Daxos's Chants @robogles");
    const html = page(daxos);
    expect(html).toContain("Robogles title-level credit only");
    expect(html).toContain(
      "not a verified author byline, endorsement, or claim of playtesting"
    );
    expect(html).toContain("Best-fit / inferred");
    expect(html).toContain("Daxos the Returned");
    expect(html).not.toContain("At the helm · verified");
    expect(html).toContain("Conditional on confirming Commander format");
  });

  it("keeps a constructed Robogles list unassigned while showing its child-only guess", () => {
    const breya = entry("Breya Facts - Robogles Build");
    const html = page(breya);
    expect(breya.helm.status).toBe("not_a_commander_deck");
    expect(breya.helm.commanders).toEqual([]);
    expect(breya.helm.separateChildGuess?.name).toBe("Breya, Etherium Shaper");
    expect(html).toContain("Not a Commander deck");
    expect(html).toContain(
      "Separate hypothetical child guess · not assigned to this source"
    );
    expect(html).toContain("Breya, Etherium Shaper");
  });

  it("keeps ambiguous source-format candidates separate from Brewery proposals", () => {
    const candidates = [
      { title: "DRAGONS MF", name: "Atarka, World Render" },
      { title: "Grenzo / Krekno Goblin MTGO", name: "Krenko, Mob Boss" },
      { title: "Jeleva's Exile", name: "Jeleva, Nephalia's Scourge" },
      { title: "Marath Juiced (PRECON)", name: "Marath, Will of the Wild" },
      {
        title: "Marisi, Breaker of the Coil EDH",
        name: "Marisi, Breaker of the Coil",
      },
    ];
    for (const candidate of candidates) {
      const review = entry(candidate.title);
      const html = page(review);
      expect(review.helm.status, candidate.title).toBe("unconfirmed");
      expect(review.helm.commanders, candidate.title).toEqual([]);
      expect(review.helm.separateChildGuess?.name).toBe(candidate.name);
      expect(review.proposal.commander, candidate.title).toBeNull();
      expect(html).toContain("Commander not confirmed");
      expect(html).toContain(
        "Separate hypothetical child guess · not assigned to this source"
      );
      expect(html).toContain(escapeHtml(candidate.name));
    }
  });

  it("keeps all 166 review helms synchronized with their Gallery source pages", () => {
    const galleryById = new Map(
      gallery.entries.map(candidate => [candidate.id, candidate])
    );
    expect(payload.entries).toHaveLength(166);
    for (const review of payload.entries) {
      const id = review.sourceGalleryHref.split("/").at(-1)!;
      expect(review.helm, review.title).toEqual(galleryById.get(id)?.helm);
    }
  });
});
