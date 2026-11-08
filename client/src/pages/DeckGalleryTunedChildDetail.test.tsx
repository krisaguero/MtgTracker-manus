import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import type { DeckGalleryPayload } from "@/lib/deckGallery";
import {
  validateDeckGalleryTunedChildrenPayload,
  type DeckGalleryTunedChildrenPayload,
} from "@/lib/deckGalleryTunedChildren";
import { DeckGalleryTunedChildView } from "./DeckGalleryTunedChildDetail";

const childPayload = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deckbox-tuned-children.json"),
    "utf8"
  )
) as DeckGalleryTunedChildrenPayload;
const galleryPayload = JSON.parse(
  readFileSync(resolve(process.cwd(), "client/public/data/deck-gallery.json"), "utf8")
) as DeckGalleryPayload;
const escapeHtml = (value: string) => renderToStaticMarkup(<>{value}</>);

function page(child: DeckGalleryTunedChildrenPayload["children"][number]) {
  return renderToStaticMarkup(
    <Router ssrPath={`/deck-gallery/child/${child.childSlug}`}>
      <DeckGalleryTunedChildView child={child} />
    </Router>
  );
}

function walkKeys(value: unknown, path = "$"): string[] {
  if (Array.isArray(value)) return value.flatMap((child, index) => walkKeys(child, `${path}[${index}]`));
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [
    `${path}.${key}`,
    ...walkKeys(child, `${path}.${key}`),
  ]);
}

describe("public Deckbox tuned-child revisions", () => {
  it("validates the separate dataset and all 100-card Commander proposals", () => {
    expect(() => validateDeckGalleryTunedChildrenPayload(childPayload)).not.toThrow();
    expect(childPayload.children).toHaveLength(16);
    for (const child of childPayload.children) {
      const parentId = child.parentHref.split("/").pop();
      const parent = galleryPayload.entries.find(entry => entry.id === parentId);
      expect(parent, child.childSlug).toBeDefined();
      if (!parent) continue;
      expect(child.sourceTitle).toBe(parent.title);
      expect(child.visibleSourceCounts.mainCopies).toBe(parent.mainCopies);
      expect(child.visibleSourceCounts.sideboardCopies).toBe(parent.sideboardCopies);
      const mainCount = child.main.reduce((sum, card) => sum + card.quantity, 0);
      const commanderCount = child.commanders.reduce((sum, card) => sum + card.quantity, 0);
      expect(child.validation.mainCount).toBe(mainCount);
      expect(child.validation.commanderCount).toBe(commanderCount);
      expect(child.validation.totalCount).toBe(100);
      expect(mainCount + commanderCount).toBe(100);
      expect(Object.values(child.roleEstimates).reduce((sum, count) => sum + count, 0)).toBe(mainCount);
      expect(child.validation.colorIdentityCheck).toBe("pass");
      expect(child.validation.commanderLegalityCheck).toBe("pass");
      expect(child.validation.singletonCheck).toBe("pass");
      expect(child.validation.scryfallNamesUnresolved).toBe(0);
      expect(child.played).toBe(false);
      expect(child.ownershipStatus.toLowerCase()).toContain("unknown");
      expect(child.evidence.some(item => item.url.startsWith("https://edhrec.com/"))).toBe(true);
    }
  });

  it("keeps the incomplete-source warning and only links to the visible parent", () => {
    const incomplete = childPayload.children.find(child => child.parentSectionsOmitted);
    expect(incomplete).toBeDefined();
    if (!incomplete) return;
    const html = page(incomplete);
    expect(html).toContain("parent export marks one or more sections as unavailable");
    expect(html).toContain("missing or hidden content is not reconstructed");
    expect(html).toContain(`href="${incomplete.parentHref}"`);
    expect(incomplete.sourceNote).not.toMatch(/Deckbox ID|archive id|private source/i);
  });

  it("renders exact swaps, role estimates, evidence, and related tracker context", () => {
    const alesha = childPayload.children.find(child => child.title.startsWith("Alesha,"));
    expect(alesha).toBeDefined();
    if (!alesha) return;
    const html = page(alesha);
    expect(html).toContain("Exact source cuts and replacements");
    expect(html).toContain(`Show all ${alesha.exactChanges.swaps.length} exact cut`);
    expect(html).toContain("Role:");
    expect(html).toContain("Related public tracker builds");
    expect(html).toContain('href="/brawl-box/araumi-of-the-dead-tide"');
    expect(html).toContain('href="/brawl-box/marchesa-the-black-rose"');
  });

  it("preserves batch-2 tracker links and shows why no close comparator was used", () => {
    const marchesa = childPayload.children.find(child =>
      child.commanders.some(commander => commander.name === "Marchesa, the Black Rose") &&
      child.relatedPublicBuilds.some(build => build.publicHref === "/brawl-box/marchesa-the-black-rose")
    );
    expect(marchesa).toBeDefined();
    if (marchesa) {
      const html = page(marchesa);
      expect(html).toContain('href="/brawl-box/marchesa-the-black-rose"');
      expect(html).toContain("Useful flavor and theft/sacrifice direction only");
      expect(html).toContain("not a 100-card Commander deck");
    }

    const noMatch = childPayload.children.find(child =>
      child.commanders.some(commander => commander.name === "Sigarda, Heron's Grace")
    );
    expect(noMatch?.relatedPublicBuilds).toHaveLength(0);
    expect(noMatch?.relatedBuildsNote).toContain("custom 60-card Brawlalternative/Commander previews");
    if (noMatch?.relatedBuildsNote) expect(page(noMatch)).toContain(escapeHtml(noMatch.relatedBuildsNote));
  });

  it("keeps every child separate and safeguards any Robogles title-credit source", () => {
    for (const child of childPayload.children) {
      expect(child.attributionNote).toMatch(/separate AI\/curator/i);
      if (child.parentGroup === "robert_title_credit") {
        expect(child.attributionNote).toMatch(/not authored or endorsed by Robert/i);
        expect(page(child)).toContain("not authored or endorsed by Robert");
      }
    }
  });

  it("contains no private archive IDs, paths, or inventory fields", () => {
    const serialized = JSON.stringify(childPayload).toLowerCase();
    expect(serialized).not.toContain("private-deckbox-review");
    expect(serialized).not.toContain("/home/ubuntu");
    expect(serialized).not.toContain("/workspace");
    expect(serialized).not.toContain("archive_source_id_private");
    expect(serialized).not.toContain("source_provenance");
    expect(serialized).not.toContain("inventory_access");
    const forbiddenKeys = walkKeys(childPayload).filter(path =>
      /\.(?:deckboxId|sourceArchiveId|archiveId|privateSourceId|inventory)$/i.test(path)
    );
    expect(forbiddenKeys).toEqual([]);
  });

  it("renders the proposed, unplayed child with its parent, count, checks, and sources", () => {
    const child = childPayload.children[0];
    const html = page(child);
    expect(html).toContain(escapeHtml(child.title));
    expect(html).toContain(`href="${child.parentHref}"`);
    expect(html).toContain("Proposed · unplayed");
    expect(html).toContain("100 / 100");
    expect(html).toContain("Exact source cuts and replacements");
    expect(html).toContain("Show all");
    expect(html).toContain("Checks actually performed");
    expect(html).toContain("Scryfall Commander legality");
    expect(html).toContain("https://edhrec.com/");
  });
});
