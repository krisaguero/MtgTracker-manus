import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Route, Router, Switch } from "wouter";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import BattleBoxDeckDetail from "./BattleBoxDeckDetail";
import RetroBattleBox from "./RetroBattleBox";
import { retroBattleBoxDecks, deckListText } from "@/lib/retroBattleBox";
import {
  battleBoxDeckPath,
  battleBoxPackageRows,
  battleBoxReferences,
  battleBoxStrategy,
  findBattleBoxDeck,
} from "@/lib/battleBoxStrategy";

const escaped = (text: string) => renderToStaticMarkup(<>{text}</>);
const routeMarkup = (path: string) =>
  renderToStaticMarkup(
    <Router ssrPath={path}>
      <Switch>
        <Route path="/battle-box/:deckId" component={BattleBoxDeckDetail} />
      </Switch>
    </Router>
  );

describe("shared Battle Box visual detail pages", () => {
  beforeAll(() => vi.stubGlobal("localStorage", { getItem: () => null }));
  afterAll(() => vi.unstubAllGlobals());
  it("registers the route and links every preserved landing layout", () => {
    const app = readFileSync(
      resolve(process.cwd(), "client/src/App.tsx"),
      "utf8"
    );
    expect(app).toContain(
      '<Route path="/battle-box/:deckId" component={BattleBoxDeckDetail} />'
    );
    const html = renderToStaticMarkup(
      <Router ssrPath="/battle-box">
        <RetroBattleBox />
      </Router>
    );
    for (const deck of retroBattleBoxDecks) {
      expect(html).toContain(`href="${battleBoxDeckPath(deck.id)}"`);
      expect(html).toContain(`id="${deck.id}"`); // preserve old inbound hash links
      expect(html).toContain(escaped(deck.summary));
      for (const engine of deck.engines)
        expect(html).toContain(escaped(engine.reason));
    }
    expect(html).toContain("Featured card artwork");
    expect(html).toContain("Inventory stays local");
    expect(html).not.toContain("View / print full 60-card list");
  });
  it.each(retroBattleBoxDecks)(
    "renders $id directly with visual default and accurate totals",
    deck => {
      const html = routeMarkup(battleBoxDeckPath(deck.id));
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).toContain(escaped(deck.name));
      expect(html).toMatch(/aria-pressed="true"[^>]*>Visual spoiler/);
      expect(html).toMatch(/aria-pressed="false"[^>]*>Readable decklist/);
      expect(html).toContain('data-view="visual"');
      expect(html).toContain("Kris Aguero");
      expect(html).toContain(escaped(deck.sourceTitle));
      expect(html).toContain(escaped(deckListText(deck)));
      expect(html).not.toContain("Brawlternative");
      expect(html).not.toMatch(
        /Owned:|100% owned|zero proxies|loadOwnedCollection|localStorage/
      );
      const rows = deck.groups.flatMap((group, groupIndex) =>
        group.cards.map((card, cardIndex) => ({
          ...card,
          sourceKey: `${groupIndex}-${cardIndex}`,
        }))
      );
      const grouped = battleBoxStrategy(deck).packages.flatMap(group =>
        battleBoxPackageRows(deck, group)
      );
      expect(
        grouped
          .map(({ sourceKey, name, quantity, proxy }) => ({
            sourceKey,
            name,
            quantity,
            proxy,
          }))
          .sort((a, b) => a.sourceKey.localeCompare(b.sourceKey))
      ).toEqual(rows.sort((a, b) => a.sourceKey.localeCompare(b.sourceKey)));
      expect(html.match(/data-source-row=/g)).toHaveLength(rows.length);
      expect(grouped.reduce((sum, card) => sum + card.quantity, 0)).toBe(60);
      for (const card of rows) {
        expect(battleBoxReferences[card.name]?.scryfall_uri).toMatch(
          /^https:\/\/scryfall.com\//
        );
        expect(html).toContain(escaped(card.name));
      }
      for (const warning of deck.warnings)
        expect(html).toContain(escaped(warning));
      for (const sibling of retroBattleBoxDecks.filter(
        entry => entry.id !== deck.id
      ))
        expect(html).toContain(`href="${battleBoxDeckPath(sibling.id)}"`);
    }
  );
  it("does not substitute an unknown route", () => {
    expect(findBattleBoxDeck("not-published")).toBeUndefined();
    expect(routeMarkup("/battle-box/not-published")).toContain(
      "Battle Box deck not found"
    );
  });
  it("preserves duplicate source rows and keeps the house rule separate", () => {
    const goblins = routeMarkup("/battle-box/goblin-cavalcade");
    expect(goblins.match(/data-source-row="0-[12]"/g)).toHaveLength(2);
    const white = routeMarkup("/battle-box/mono-white-lifegain-sunbond-heroic");
    expect(white).toContain(
      "Optional house-rule overlay · not card text or part of the 60"
    );
  });
});
