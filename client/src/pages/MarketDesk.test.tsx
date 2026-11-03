import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router, Route } from "wouter";
import { describe, expect, it } from "vitest";
import MarketDesk from "./MarketDesk";
import backlog from "@/data/marketWatchBacklog.json";

function page(path = "/market-desk") {
  return renderToStaticMarkup(<Router ssrPath={path}><Route path="/market-desk" component={MarketDesk} /></Router>);
}

describe("Market Desk", () => {
  it("renders the four deliberate navigation tabs and weekly desks by default", () => {
    const html = page();
    for (const label of ["Weekly desks", "Biweekly Top 10", "Accuracy review", "Historical reports"]) expect(html).toContain(label);
    expect(html).toContain("Weekly market desk");
    expect(html).toContain(backlog.weekly[0].label);
    expect(html).toContain("Read desk");
  });

  it("keeps the four evidence surfaces represented in the tab navigation", () => {
    const html = page();
    expect(html).toContain("Accuracy review");
    expect(html).toContain("Historical reports");
    expect(html).toContain("Prediction ledger");
    expect(html).toContain("Evidence archive");
  });
});
