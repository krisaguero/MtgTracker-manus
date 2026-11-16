import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { November06MarketBrief } from "./November06MarketBrief";

describe("Nov. 6 supplied market brief", () => {
  it("keeps its own date, data window, source text, and verification limits visible", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/market-report/november-06-30-signal-brief">
        <November06MarketBrief />
      </Router>,
    );
    expect(html).toContain("November 6, 2026");
    expect(html).toContain("November 5, 2026 / most recent verified weekly market snapshot");
    expect(html).toContain("Nethergoyf");
    expect(html).toContain("Gandalf, White Rider");
    expect(html).toContain("same-day completed-sale volume");
    expect(html).toContain("TCGplayer");
    expect(html).toContain("representative images cover the unique card names");
    expect((html.match(/alt="[^"]+ card art"/g) ?? []).length).toBe(23);
  });
});
