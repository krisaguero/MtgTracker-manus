import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarketMoverCardArt } from "./MarketMoverCardArt";

describe("MarketMoverCardArt", () => {
  it("queues a set-specific Scryfall image and keeps it lazy-loaded", () => {
    const markup = renderToStaticMarkup(
      <MarketMoverCardArt name="Demonic Tutor" setCode="LEA" />
    );

    expect(markup).toContain('alt="Demonic Tutor card art"');
    expect(markup).toContain("data-scryfall-src=");
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

  it("looks up double-faced cards by their front face while preserving the full alt label", () => {
    const markup = renderToStaticMarkup(
      <MarketMoverCardArt
        name="Gisela, the Broken Blade // Brisela, Voice of Nightmares"
        setCode="sld"
      />
    );

    expect(markup).toContain(
      'alt="Gisela, the Broken Blade // Brisela, Voice of Nightmares card art"'
    );
    expect(markup).toContain("fuzzy=Gisela%2C+the+Broken+Blade");
    expect(markup).toContain("set=sld");
  });
});
