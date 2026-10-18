import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { commanderDecklists } from "./commanderDecklists";

type Evidence = {
  name: string;
  oracle_text?: string;
  type_line: string;
  source_uri: string;
  card_faces?: Array<{ name: string; oracle_text?: string }>;
};
type Snapshot = {
  source: string;
  cards: Record<string, Evidence>;
  unresolved: string[];
};
const directory = resolve(process.cwd(), "client/public/data/precon-oracle");
const snapshot = (code: string) =>
  JSON.parse(
    readFileSync(resolve(directory, `${code.toLowerCase()}.json`), "utf8")
  ) as Snapshot;

describe("public precon Oracle evidence snapshots", () => {
  it("covers every indexed deck and retains explicit unresolved names without invented rules", () => {
    expect(commanderDecklists.length).toBeGreaterThanOrEqual(198);
    for (const deck of commanderDecklists) {
      const payload = snapshot(deck.set_code);
      expect(payload.source).toBe("Scryfall Oracle card text");
      for (const card of [...deck.commander, ...deck.cards]) {
        const evidence = payload.cards[card.name];
        expect(
          Boolean(evidence) || payload.unresolved.includes(card.name),
          `${deck.name}: ${card.name}`
        ).toBe(true);
        if (evidence) {
          expect(evidence.name.length).toBeGreaterThan(0);
          expect(evidence.source_uri).toMatch(
            /^https:\/\/scryfall\.com\/card\//
          );
          expect(payload.unresolved).not.toContain(card.name);
        }
      }
    }
  });
  it("contains only indexed public card names and card-text evidence, never ownership records", () => {
    const sets = new Map<string, Set<string>>();
    for (const deck of commanderDecklists) {
      const names = sets.get(deck.set_code.toLowerCase()) ?? new Set<string>();
      for (const card of [...deck.commander, ...deck.cards])
        names.add(card.name);
      sets.set(deck.set_code.toLowerCase(), names);
    }
    expect(
      readdirSync(directory)
        .filter(name => name.endsWith(".json"))
        .sort()
    ).toEqual([...sets.keys()].map(code => `${code}.json`).sort());
    for (const [code, names] of sets) {
      const payload = snapshot(code);
      expect(Object.keys(payload).sort()).toEqual([
        "cards",
        "source",
        "unresolved",
      ]);
      expect(
        [...Object.keys(payload.cards), ...payload.unresolved].sort()
      ).toEqual([...names].sort());
      for (const evidence of Object.values(payload.cards)) {
        expect(
          Object.keys(evidence).every(key =>
            [
              "name",
              "oracle_text",
              "type_line",
              "keywords",
              "mana_cost",
              "card_faces",
              "source_uri",
            ].includes(key)
          )
        ).toBe(true);
      }
    }
  });
});
