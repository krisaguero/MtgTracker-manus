import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MarketMetaWatchDashboard } from "./MarketMetaWatchDashboard";

vi.mock("wouter", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("MarketMetaWatchDashboard", () => {
  it("renders merged price, Commander, and Brawl evidence", () => {
    const html = renderToStaticMarkup(<MarketMetaWatchDashboard />);
    expect(html).toContain("Price spikes &amp; meta movement");
    expect(html).toContain("Command Tower");
    expect(html).toContain("30-snapshot price trend");
    expect(html).toMatch(/Price trend from \$\d+\.\d{2} to \$\d+\.\d{2}/);
    expect(html).toContain("Hearthhull, the Worldseed");
    expect(html).toContain("Brawl corpus pulse");
    expect(html).toContain("not tournament prevalence");
  });

  it("keeps the dashboard responsive and hard-edged", () => {
    const html = renderToStaticMarkup(<MarketMetaWatchDashboard />);
    expect(html).toContain("xl:grid-cols-[1.2fr_0.8fr]");
    expect(html).toContain("border-2");
    expect(html).not.toContain("rounded-");
  });
});
