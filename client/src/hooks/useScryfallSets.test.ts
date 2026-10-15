import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { commanderDecklistsData } from "@/data/commanderDecklistsData";
import {
  commanderProductCodesForParent,
  localDecksForParentSet,
  type ScryfallSet,
} from "./useScryfallSets";

const sets: ScryfallSet[] = [
  {
    id: "parent",
    code: "eoe",
    name: "Edge of Eternities",
    released_at: "2025-08-01",
    set_type: "expansion",
    card_count: 281,
  },
  {
    id: "child",
    code: "eoc",
    name: "Edge of Eternities Commander",
    released_at: "2025-08-01",
    parent_set_code: "eoe",
    set_type: "commander",
    card_count: 450,
  },
  {
    id: "second-parent",
    code: "dsk",
    name: "Duskmourn: House of Horror",
    released_at: "2024-09-27",
    set_type: "expansion",
    card_count: 271,
  },
  {
    id: "second-child",
    code: "dsc",
    name: "Duskmourn Commander",
    released_at: "2024-09-27",
    parent_set_code: "dsk",
    set_type: "commander",
    card_count: 450,
  },
];

const hookSource = () =>
  readFileSync(
    resolve(process.cwd(), "client/src/hooks/useScryfallSets.ts"),
    "utf8"
  );
const archiveLoaderSource = () =>
  readFileSync(
    resolve(process.cwd(), "client/src/data/localCommanderArchive.ts"),
    "utf8"
  );

describe("Commander product parent-set indexing", () => {
  it("includes the parent set and its Commander child product code", () => {
    expect(commanderProductCodesForParent("EOE", sets)).toEqual(["eoe", "eoc"]);
  });

  it("attaches a local Commander decklist to the relevant parent expansion", () => {
    const decks = localDecksForParentSet("eoe", sets, commanderDecklistsData);

    expect(
      decks.some(
        deck => deck.set_code === "eoc" && deck.name === "World Shaper"
      )
    ).toBe(true);
  });

  it("returns every child Commander product code for local archive mapping", () => {
    expect(commanderProductCodesForParent("dsk", sets)).toEqual(["dsk", "dsc"]);
  });

  it("ends the initial loading state when Scryfall times out", () => {
    const source = hookSource();
    expect(source).toContain(
      "The Scryfall set catalog took too long to respond. Please retry."
    );
    expect(source).toContain("setLoading(false);");
  });

  it("uses the local archive as the only homepage precon product source, without per-set Scryfall searches", () => {
    const source = hookSource();
    expect(source).toContain("buildLocalPreconIndex(allSets, localDecklists)");
    expect(source).not.toContain("https://api.scryfall.com/cards/search");
    expect(source).not.toContain("is:deck set:");
    expect(source).not.toContain("enrichingPrecons");
  });

  it("loads the multi-megabyte local decklist archive only through the explicit loader", () => {
    const source = hookSource();
    const loaderIndex = source.indexOf(
      "const loadLocalDecklists = useCallback(async () => {"
    );
    const callIndex = source.indexOf(
      "await loadLocalCommanderArchive()",
      loaderIndex
    );
    const archiveSource = archiveLoaderSource();
    const importIndex = archiveSource.search(
      /await import\(["']\.\/commanderDecklistsData["']\)/
    );
    const setFetchIndex = source.indexOf("async function loadSets()");
    const loaderEndIndex = source.indexOf("}, []);", loaderIndex);
    const setFetchEndIndex = source.indexOf("void loadSets();", setFetchIndex);

    expect(callIndex).toBeGreaterThan(loaderIndex);
    expect(callIndex).toBeLessThan(loaderEndIndex);
    expect(importIndex).toBeGreaterThan(-1);
    expect(source.slice(setFetchIndex, setFetchEndIndex)).not.toContain(
      "loadLocalCommanderArchive"
    );
    expect(source).toContain("localDecklistsLoading");
    expect(archiveSource).toContain("createCachedArchiveLoader");
    expect(archiveSource).toContain("pendingLoad = null");
  });
});
