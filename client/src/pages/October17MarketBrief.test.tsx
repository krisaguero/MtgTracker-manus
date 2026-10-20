import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { October17MarketBriefBody } from "./October17MarketBrief";

const pageSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/October17MarketBrief.tsx"),
  "utf8"
);

describe("October 17 market brief", () => {
  it("renders the supplied report with the unverified-price caveat", () => {
    const html = renderToStaticMarkup(<October17MarketBriefBody />);
    expect(pageSource.replace(/\s+/g, " ")).toContain(
      "October 17, 2026 · separate research brief"
    );
    expect(pageSource.replace(/\s+/g, " ")).toContain(
      "October 16, 2026 prior trading day"
    );
    expect(html).toContain("Confirmed Price Movement");
    expect(html).toContain("Pompous Battlemage");
    expect(html).toContain("Prices may be volatile");
  });

  it("keeps the report’s official source link available", () => {
    const html = renderToStaticMarkup(<October17MarketBriefBody />);
    expect(html).toContain(
      "https://magic.wizards.com/en/news/announcements/banned-and-restricted-october-12-2026"
    );
    expect(html).toContain("https://www.mtggoldfish.com/tournaments/standard");
  });
});
