import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { PreconSection } from "./PreconSection";
import type { PreconDeck } from "@/hooks/useSetDetail";

describe("PreconSection and deck valuation rendering", () => {
  it("renders estimated market value badges with pricing tooltips on precon cards", () => {
    const samplePrecon: PreconDeck = {
      id: "msc-avengers",
      name: "Avengers Assemble",
      set_code: "msc",
      colors: ["W", "U", "R"],
      card_count: 100,
      hasDecklist: true,
      approxValue: 165,
      synopsis: "Jeskai team-up deck.",
    };

    const markup = renderToStaticMarkup(
      <Router hook={() => ["/", () => {}]}>
        <PreconSection precons={[samplePrecon]} setCode="msc" />
      </Router>,
    );

    expect(markup).toContain("Avengers Assemble");
    expect(markup).toContain("~$165 USD est.");
    expect(markup).toContain("Summed from live individual card market prices");
  });
});
