import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarketMoverCardArt } from "./MarketMoverCardArt";

describe("MarketMoverCardArt", () => {
  it("renders an accessible card-art placeholder and defers the exact printing to the shared batch resolver", () => {
    const markup = renderToStaticMarkup(
      <MarketMoverCardArt name="Demonic Tutor" setCode="LEA" />,
    );

    expect(markup).toContain('alt="Demonic Tutor card art"');
    expect(markup).toContain('data-card-art-query="Demonic Tutor"');
    expect(markup).toContain('loading="lazy"');
    expect(markup).not.toContain("api.scryfall.com/cards/named");
  });

  it("preserves the full accessible name while looking up a double-faced card by its front face", () => {
    const markup = renderToStaticMarkup(
      <MarketMoverCardArt
        name="Gisela, the Broken Blade // Brisela, Voice of Nightmares"
        setCode="sld"
      />,
    );

    expect(markup).toContain(
      'alt="Gisela, the Broken Blade // Brisela, Voice of Nightmares card art"',
    );
    expect(markup).toContain('data-card-art-query="Gisela, the Broken Blade"');
  });

  it("accepts exact set and collector-number hints for new-set cards", () => {
    const markup = renderToStaticMarkup(
      <MarketMoverCardArt
        name="Khaaaaaaaaaaaannn!"
        setCode="trk"
        collectorNumber="154"
      />,
    );

    expect(markup).toContain('alt="Khaaaaaaaaaaaannn! card art"');
    expect(markup).toContain('data-card-art-query="Khaaaaaaaaaaaannn!"');
  });
});
