import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

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

  it("exposes the complete local precon index in a separate on-demand homepage view", () => {
    const home = read("client/src/pages/Home.tsx");
    expect(home).toContain("type CatalogView = 'sets' | 'precons'");
    expect(home).toContain(
      "buildHomePreconIndex(localDecklists ?? [], precons, sets)"
    );
    expect(home).toContain("All Commander precons");
    expect(home).toContain("Card artwork loads as you scroll.");
    expect(home).toContain("currentPreconsPage.items.map");
    expect(home).toContain("currentSetsPage.items.map");
    expect(home).toContain('label="Commander precons"');
    expect(home).toContain('label="Recent sets"');
  });
});
