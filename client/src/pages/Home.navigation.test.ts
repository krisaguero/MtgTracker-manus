import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8").replace(/\s+/g, " ");

describe("site-wide navigation and homepage catalogs", () => {
  it("provides an accessible mobile menu and organized market subpage dropdowns", () => {
    const navigation = read("client/src/components/InternalPageNav.tsx");
    expect(navigation).toContain('aria-label="Main site navigation"');
    expect(navigation).toContain(
      "aria-label={openMobileMenu ? 'Close navigation menu' : 'Open navigation menu'}"
    );
    expect(navigation).toContain('aria-controls="mobile-site-navigation"');
    expect(navigation).toContain("aria-expanded={openMobileMenu}");
    expect(navigation).toContain(
      "{ href: '/movers', label: 'Daily market movers' }"
    );
    expect(navigation).toContain(
      "{ href: '/movers/confirmed', label: 'Mover desk · confirmed' }"
    );
    expect(navigation).toContain(
      "{ href: '/market-reports', label: 'Report archive' }"
    );
    expect(navigation).toContain("event.key === 'Escape'");
  });

  it("exposes the single-source local decklist archive in a separate on-demand homepage view", () => {
    const home = read("client/src/pages/Home.tsx");
    expect(home).toContain("type CatalogView = HomeCatalogView");
    expect(home).toContain(
      "buildHomePreconIndex(localDecklists ?? [], precons, sets)"
    );
    expect(home).toContain("All local Commander decklists");
    expect(home).toContain(
      "Scryfall-only product listings are intentionally excluded"
    );
    expect(home).toContain("Card artwork loads as you scroll.");
    expect(home).toContain("currentPreconsPage.items.map");
    expect(home).toContain("currentSetsPage.items.map");
    expect(home).toContain('label="Commander precons"');
    expect(home).toContain('label="Recent sets"');
  });

  it("shares the lazy archive load with an expanded set and distinguishes archive loading, failure, and empty results", () => {
    const home = read("client/src/pages/Home.tsx");
    const setCard = read("client/src/components/SetCard.tsx");
    expect(home).toContain(
      "if (expandedSetCode && localDecklists === null) void loadLocalDecklists()"
    );
    expect(home).toContain("onRetryArchive={() => void loadLocalDecklists()}");
    expect(setCard).toContain("Loading the shared Commander decklist archive");
    expect(setCard).toContain('role="alert"');
    expect(setCard).toContain(
      "The Commander archive loaded successfully; no precons are indexed"
    );
    expect(home).toContain(
      "The local Commander archive loaded, but it is empty."
    );
  });

  it("persists archive/set filters, active page, expanded set, and scroll position for route returns", () => {
    const home = read("client/src/pages/Home.tsx");
    const state = read("client/src/lib/homeCatalogState.ts");
    expect(home).toContain("HOME_CATALOG_STATE_KEY");
    expect(home).toContain(
      "window.scrollTo({ top: initialCatalogState.scrollY"
    );
    expect(home).toContain("persistHomeCatalogState(catalogStateRef.current)");
    expect(state).toContain("expandedSetCode: string | null");
    expect(state).toContain("setsPage: number");
    expect(state).toContain("preconsPage: number");
  });

  it("uses shared market provenance cues and responsive, accessible set expansion controls", () => {
    const home = read("client/src/pages/Home.tsx");
    const setCard = read("client/src/components/SetCard.tsx");
    const cue = read("client/src/components/MarketDataCue.tsx");
    const preconCard = read("client/src/components/HomePreconCard.tsx");
    expect(home).toContain("<MarketDataCue status={marketDataStatus}");
    expect(home).toContain("marketDataStatusFromIndex(");
    expect(home).toContain("Boolean(preconEquitySummary)");
    expect(setCard).toContain("<MarketDataCue status={marketDataStatus}");
    expect(cue).toContain("snapshot as of");
    expect(setCard).toContain("aria-expanded={isExpanded}");
    expect(setCard).toContain("sm:text-right");
    expect(setCard).not.toContain("precon.approxValue");
    expect(home).toContain("flex flex-col gap-3 sm:flex-row");
    expect(home).toContain("marketValue={preconEquityByProduct.get(");
    expect(home).toContain("grid gap-5 sm:grid-cols-2");
    expect(preconCard).toContain("min-w-0 flex-col");
    expect(preconCard).toContain("USD coverage");
    expect(preconCard).toContain("missing");
  });
});
