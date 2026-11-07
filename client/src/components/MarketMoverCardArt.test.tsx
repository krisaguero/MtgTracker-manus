import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarketMoverCardArt } from "./MarketMoverCardArt";

describe("MarketMoverCardArt", () => {
  it("uses the set-specific Scryfall image first and lazy-loads it", () => {
    const markup = renderToStaticMarkup(
      <MarketMoverCardArt name="Demonic Tutor" setCode="LEA" />
    );

    expect(markup).toContain('alt="Demonic Tutor card art"');
    expect(markup).toContain("fuzzy=Demonic+Tutor");
    expect(markup).toContain("set=lea");
    expect(markup).toContain('loading="lazy"');
  });

  it("does not pass placeholder set codes to Scryfall", () => {
    const markup = renderToStaticMarkup(
      <MarketMoverCardArt name="Force of Will" setCode="all" />
    );

    expect(markup).toContain('alt="Force of Will card art"');
    expect(markup).not.toContain("set=all");
  });
});
