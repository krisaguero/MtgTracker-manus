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
    expect(childPayload.children).toHaveLength(45);
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
    expect(html).toContain("public parent omits one or more source sections");
    expect(html).toContain("missing or hidden cards were not reconstructed");
    expect(html).toContain(`href="${incomplete.parentHref}"`);
    expect(incomplete.sourceNote).not.toMatch(/Deckbox ID|archive id|private source/i);
  });

  it("shows batch-3 source completeness and hypothetical completion details", () => {
    const titles = ["Black - Sworn To Darkness", "Brago Energy V2", "Brago Energy V3", "Brago, King Eternal", "Breed Lethality - Commander 2016", "Breya Facts", "Brion's Giants", "Brionline"];
    for (const title of titles) {
      const child = childPayload.children.find(candidate => candidate.sourceTitle === title);
      expect(child, title).toBeDefined();
      expect(child?.hypothetical).toBe(true);
      expect(child?.sourceCompletenessNote).toBeTruthy();
    }

    const bragoV2 = childPayload.children.find(child => child.sourceTitle === "Brago Energy V2");
    const note = bragoV2?.sourceCompletenessNote ?? "";
    expect(note).toContain("68 public main copies");
    expect(note).toContain("Missing original rows are not reconstructed");
    if (bragoV2) {
      const html = page(bragoV2);
      expect(html).toContain("Visible-source completeness");
      expect(html).toContain(escapeHtml(note));
    }

    const precon = childPayload.children.find(child => child.sourceTitle === "Breed Lethality - Commander 2016");
    expect(precon?.commanders[0]?.name).toBe("Atraxa, Praetors' Voice");
    expect(precon?.sourceCompletenessNote).toContain("exactly 86 copies");
    const oversized = childPayload.children.find(child => child.sourceTitle === "Brionline");
    expect(oversized?.sourceCompletenessNote).toContain("cuts 8 visible copies");
  });

  it("shows batch-4 children as proposed, unplayed, source-aware Commander builds", () => {
    const titles = ["Built from Scratch - Red Commander 2014 Precon", "Call the Spirits - 2015 EDH", "Daghatar", "Daghatar +1", "Daxos Enchants", "Daxos XP", "Draconic Domination - C17 Precon", "DRagon upgrades"];
    for (const title of titles) {
      const child = childPayload.children.find(candidate => candidate.sourceTitle === title);
      expect(child, title).toBeDefined();
      if (!child) continue;
      expect(child.hypothetical).toBe(true);
      expect(child.played).toBe(false);
      expect(child.status).toBe("Proposed · unplayed");
      expect(child.ownershipStatus.toLowerCase()).toContain("unknown");
      expect(child.sourceCompletenessNote).toBeTruthy();
      expect(child.validation.mainCount + child.validation.commanderCount).toBe(100);
      expect(child.validation.scryfallLandCount).toBeLessThanOrEqual(40);
      expect(child.plan.commanderPlan).not.toBe("Not provided.");
      expect(child.plan.closingPlan).not.toBe("Not provided.");
      const context = child.edhrecContext;
      expect(typeof context).toBe("object");
      if (typeof context !== "object" || context === null) continue;
      expect(context.summary).not.toBe("EDHREC theme and aggregate evidence informed this proposed child; the short notes below summarize the public sources.");
      const themes = context.themeNotes;
      expect(Array.isArray(themes)).toBe(true);
      if (Array.isArray(themes)) expect(themes.length).toBeGreaterThan(0);
    }

    const completePrecon = childPayload.children.find(child => child.sourceTitle === "Built from Scratch - Red Commander 2014 Precon");
    expect(completePrecon?.sourceCompletenessNote?.toLowerCase()).toContain("complete");
    expect(completePrecon?.validation.scryfallLandCount).toBe(39);

    const daghatarPlusOne = childPayload.children.find(child => child.sourceTitle === "Daghatar +1");
    expect(daghatarPlusOne?.exactChanges.swaps).toHaveLength(6);
    expect(daghatarPlusOne?.validation.scryfallLandCount).toBe(36);

    const dragonUpgrades = childPayload.children.find(child => child.sourceTitle === "DRagon upgrades");
    expect(dragonUpgrades?.validation.scryfallLandCount).toBe(39);
    expect(dragonUpgrades?.parentGroup).toBe("owner_wip_offbeat");
    expect(dragonUpgrades?.attributionNote).toContain("separate AI/curator child revision");

    const daretti = childPayload.children.find(child => child.sourceTitle === "Built from Scratch - Red Commander 2014 Precon");
    if (daretti) {
      const html = page(daretti);
      expect(html).toContain(escapeHtml(daretti.plan.commanderPlan));
      expect(html).toContain(escapeHtml(daretti.plan.closingPlan));
      const context = daretti.edhrecContext;
      expect(typeof context).toBe("object");
      if (typeof context === "object" && context !== null && typeof context.summary === "string") {
        expect(html).toContain(escapeHtml(context.summary));
      }
    }
  });

  it("covers batch-7 children with exact counts, source caveats, and specific EDHREC context", () => {
    const expected = [
      { title: "Krenko EDH", commander: "Krenko, Mob Boss", lands: 34, cuts: 8, adds: 8, paired: 8 },
      { title: "Kynaios and Tiro - No Budget", commander: "Kynaios and Tiro of Meletis", lands: 40, cuts: 5, adds: 0, paired: 0 },
      { title: "Kynaios and Tiro - Updated", commander: "Kynaios and Tiro of Meletis", lands: 39, cuts: 8, adds: 7, paired: 7 },
      { title: "Marath EDH (PRECON)", commander: "Marath, Will of the Wild", lands: 39, cuts: 20, adds: 20, paired: 20 },
      { title: "Mayael & Her Dragons", commander: "Mayael the Anima", lands: 36, cuts: 51, adds: 21, paired: 21 },
      { title: "Maziborn v2", commander: "Mazirek, Kraul Death Priest", lands: 35, cuts: 1, adds: 36, paired: 1 },
      { title: "Mazirek - Beater Sac Revised", commander: "Mazirek, Kraul Death Priest", lands: 31, cuts: 4, adds: 0, paired: 0 },
      { title: "Mazirek sacs n' clues", commander: "Mazirek, Kraul Death Priest", lands: 32, cuts: 37, adds: 21, paired: 21 },
    ] as const;

    for (const item of expected) {
      const child = childPayload.children.find(candidate => candidate.sourceTitle === item.title);
      expect(child, item.title).toBeDefined();
      if (!child) continue;
      expect(child.commanders[0]?.name).toBe(item.commander);
      expect(child.status).toBe("Proposed · unplayed");
      expect(child.hypothetical).toBe(true);
      expect(child.played).toBe(false);
      expect(child.ownershipStatus.toLowerCase()).toContain("unknown");
      expect(child.validation.totalCount).toBe(100);
      expect(child.validation.scryfallLandCount).toBe(item.lands);
      expect(child.sourceCompletenessNote).toBeTruthy();
      expect(child.plan.commanderPlan).not.toBe("Not provided.");
      expect(child.plan.curveTempo).not.toBe("Not provided.");
      expect(child.plan.interaction).not.toBe("Not provided.");
      expect(child.plan.cardAdvantage).not.toBe("Not provided.");
      expect(child.plan.mana).not.toBe("Not provided.");
      expect(child.plan.closingPlan).not.toBe("Not provided.");
      expect(child.plan.coherence.length).toBeGreaterThan(80);
      expect(child.plan.coherence).not.toMatch(/narrows the list around its commander plan and tuned-casual roles/i);
      expect(child.exactChanges.cuts.reduce((sum, row) => sum + row.quantity, 0)).toBe(item.cuts);
      expect(child.exactChanges.adds.reduce((sum, row) => sum + row.quantity, 0)).toBe(item.adds);
      expect(child.exactChanges.swaps.reduce((sum, row) => sum + row.cut.quantity, 0)).toBe(item.paired);
      expect(child.exactChanges.swaps.reduce((sum, row) => sum + row.replacement.quantity, 0)).toBe(item.paired);
      for (const swap of child.exactChanges.swaps) expect(swap.reason).toBeTruthy();
      const context = child.edhrecContext as unknown as Record<string, unknown>;
      expect(typeof context.summary).toBe("string");
      expect(context.summary).not.toBe("EDHREC theme and aggregate evidence informed this proposed child; the short notes below summarize the public sources.");
      expect(context.summary).not.toBe("EDHREC themes and aggregates informed this proposed child.");
      expect(Number(context.aggregateDeckCount)).toBeGreaterThan(0);
      expect(Array.isArray(context.themeNotes)).toBe(true);
      expect((context.themeNotes as unknown[]).length).toBeGreaterThan(0);
      expect(child.evidence.some(item => item.url.startsWith("https://edhrec.com/"))).toBe(true);
    }

    const krenko = childPayload.children.find(child => child.sourceTitle === "Krenko EDH");
    expect(krenko?.sourceCompletenessNote).toContain("Vintage saved-format label");
    expect(krenko?.sourceCompletenessNote).toContain("not treated as Commander legality");
    const kynaiosTrim = childPayload.children.find(child => child.sourceTitle === "Kynaios and Tiro - No Budget");
    expect(kynaiosTrim?.relatedBuildsNote).toContain("not 100-card deck templates");
    const marath = childPayload.children.find(child => child.sourceTitle === "Marath EDH (PRECON)");
    expect(marath?.sourceCompletenessNote).toContain("absent from visible rows");
    const mayael = childPayload.children.find(child => child.sourceTitle === "Mayael & Her Dragons");
    expect(mayael?.parentSectionsOmitted).toBe(true);
    const maziborn = childPayload.children.find(child => child.sourceTitle === "Maziborn v2");
    expect(maziborn?.sourceCompletenessNote).toContain("65 public main copies");
    expect(maziborn?.sourceCompletenessNote).toMatch(/not a claim that the original list was a complete Commander deck/i);
    const inferredMazirek = childPayload.children.find(child => child.sourceTitle === "Mazirek - Beater Sac Revised");
    expect(inferredMazirek?.sourceCompletenessNote).toMatch(/best-fit\/inferred assignment/i);
    const clueMazirek = childPayload.children.find(child => child.sourceTitle === "Mazirek sacs n' clues");
    expect(clueMazirek?.parentSectionsOmitted).toBe(true);
  });

  it("includes the six official precon children with exact tuned upgrades", () => {
    const expected = [
      ["Entropic Uprising - Commander 2016 Precon", 10],
      ["EXQUISITE INVENTION - C18 Precon", 10],
      ["Feline Ferocity - Commander 2017 Precon", 12],
      ["Green - Commander 2014 - Guided by Nature", 15],
      ["Invent Superiority - Commander 2016 Precon", 30],
      ["Marath EDH (PRECON)", 20],
    ] as const;
    for (const [sourceTitle, swapCount] of expected) {
      const child = childPayload.children.find(candidate => candidate.sourceTitle === sourceTitle);
      expect(child, sourceTitle).toBeDefined();
      if (!child) continue;
      expect(child.status).toBe("Proposed · unplayed");
      expect(child.hypothetical).toBe(true);
      expect(child.played).toBe(false);
      expect(child.exactChanges.swaps).toHaveLength(swapCount);
      expect(child.exactChanges.cuts.reduce((sum, row) => sum + row.quantity, 0)).toBe(swapCount);
      expect(child.exactChanges.adds.reduce((sum, row) => sum + row.quantity, 0)).toBe(swapCount);
      expect(child.validation.totalCount).toBe(100);
      expect(child.plan.commanderPlan).not.toBe("Not provided.");
      expect(child.plan.closingPlan).not.toBe("Not provided.");
      expect(child.evidence.some(item => item.url.startsWith("https://edhrec.com/"))).toBe(true);
    }

    const breya = childPayload.children.find(child => child.sourceTitle === "Invent Superiority - Commander 2016 Precon");
    expect(breya?.commanders[0]?.name).toBe("Breya, Etherium Shaper");
    expect(breya?.parentGroup).toBe("owner_archive_list");
    const saheeli = childPayload.children.find(child => child.sourceTitle === "EXQUISITE INVENTION - C18 Precon");
    expect(saheeli?.plan.coherence).toMatch(/artifact|token/i);
    const freyalise = childPayload.children.find(child => child.sourceTitle === "Green - Commander 2014 - Guided by Nature");
    expect(freyalise?.attributionNote).toContain("separate AI/curator child revision");
    if (freyalise?.parentGroup === "robert_title_credit") {
      expect(freyalise.attributionNote).toContain("not authored or endorsed by Robert");
    }
  });

  it("renders normalized EDHREC aggregates and themes without raw list-shaped context", () => {
    const allowed = new Set(["summary", "aggregateDeckCount", "popularTags", "recommendationExamples", "themeNotes"]);
    for (const child of childPayload.children) {
      expect(typeof child.edhrecContext).toBe("object");
      if (typeof child.edhrecContext !== "object" || child.edhrecContext === null) continue;
      expect(Array.isArray(child.edhrecContext)).toBe(false);
      expect(Object.keys(child.edhrecContext).every(key => allowed.has(key))).toBe(true);
      expect(child.plan.subthemes).toBeTruthy();
      expect(child.plan.coherence).not.toBe("The proposal narrows the list around its commander plan and tuned-casual roles.");
      expect(child.edhrecContext.summary).not.toBe("EDHREC theme and aggregate evidence informed this proposed child; the short notes below summarize the public sources.");
      const examples = child.edhrecContext.recommendationExamples;
      const themes = child.edhrecContext.themeNotes;
      expect(Array.isArray(examples) ? examples.length : 0).toBeLessThanOrEqual(6);
      expect(Array.isArray(themes) ? themes.length : 0).toBeLessThanOrEqual(6);
      expect(Array.isArray(themes) ? themes.length : 0).toBeGreaterThan(0);
    }

    const brionline = childPayload.children.find(child => child.sourceTitle === "Brionline");
    expect(brionline).toBeDefined();
    if (!brionline) return;
    const context = brionline.edhrecContext as Record<string, unknown>;
    const html = page(brionline);
    expect(typeof context.aggregateDeckCount).toBe("number");
    expect((context.aggregateDeckCount as number) > 0).toBe(true);
    expect(Array.isArray(context.themeNotes)).toBe(true);
    expect(html).toContain("EDHREC aggregate:");
    expect(html).toContain("Open EDHREC theme");
    expect(html).toContain("not copied third-party decklists");
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
