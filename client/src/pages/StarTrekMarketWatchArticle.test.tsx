import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { starTrekDailyMovers } from "@/data/starTrekMarketWatch";
import { StarTrekMarketWatchArticle } from "./StarTrekMarketWatchArticle";

describe("Nov. 7 Star Trek market-watch post", () => {
  it("renders every reported daily mover with card art and states that the figures are not completed sales", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/market-report/star-trek-market-watch-2026-11-07">
        <StarTrekMarketWatchArticle />
      </Router>,
    );
    expect(html).toContain("Mr. Spock, Science Officer");
    expect(html).toContain("Overgrown Tomb");
    expect(html).toContain("+$2.36 / +19%");
    expect(html).toContain("-$15.83 / -66%");
    expect(html).toContain("not independent completed-sale or buylist verification");
    expect(html).toContain("https://www.mtggoldfish.com/movers/paper/trk");
    expect(html).toContain("Nov. 13");
    expect(html).toContain('aria-label="All Nov. 7 Star Trek daily movers"');
    expect((html.match(/alt="[^"]+ card art"/g) ?? []).length).toBe(starTrekDailyMovers.length);
  });
});
