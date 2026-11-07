import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { StarTrekMarketPanel } from "./StarTrekMarketPanel";

describe("Star Trek market-watch panel", () => {
  it("opens on the Nov. 7 daily snapshot and exposes the dated earlier watch and history tabs", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/market-watch">
        <StarTrekMarketPanel />
      </Router>,
    );
    expect(html).toContain("Daily movers · Nov. 7");
    expect(html).toContain("Mr. Spock, Science Officer");
    expect(html).toContain("Earlier editorial watch · Nov. 5");
    expect(html).toContain("Historical trends");
    expect(html).toContain("no separate as-of timestamp");
  });
});
