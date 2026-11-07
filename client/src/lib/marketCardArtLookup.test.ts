import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMarketCardArtLookup,
  type MarketCardArtLookupOptions,
} from "./marketCardArtLookup";

type Fetcher = NonNullable<MarketCardArtLookupOptions["fetcher"]>;

function jsonResponse(data: unknown[]) {
  return new Response(JSON.stringify({ data, not_found: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("market card-art lookup", () => {
  it("batches concurrent identifiers and maps images by card identity, including double-faced cards", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<Fetcher>(async () =>
      jsonResponse([
        {
          name: "Gisela, the Broken Blade // Brisela, Voice of Nightmares",
          set: "sld",
          collector_number: "1",
          card_faces: [
            { image_uris: { small: "https://cards.scryfall.io/small/gisela.jpg", normal: "https://cards.scryfall.io/normal/gisela.jpg" } },
          ],
        },
        {
          name: "Mr. Spock, Science Officer",
          set: "trk",
          collector_number: "74",
          image_uris: { small: "https://cards.scryfall.io/small/spock.jpg", normal: "https://cards.scryfall.io/normal/spock.jpg" },
        },
      ]),
    );
    const lookup = createMarketCardArtLookup({
      fetcher,
      batchWindowMs: 20,
      requestGapMs: 0,
      storage: null,
    });

    const spockPromise = lookup("Mr. Spock, Science Officer", "trk", "74");
    const giselaPromise = lookup(
      "Gisela, the Broken Blade // Brisela, Voice of Nightmares",
      "sld",
    );
    await vi.runAllTimersAsync();
    const [spock, gisela] = await Promise.all([spockPromise, giselaPromise]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    const request = fetcher.mock.calls[0]?.[1];
    expect(request?.method).toBe("POST");
    const body = JSON.parse(String(request?.body)) as { identifiers: unknown[] };
    expect(body.identifiers).toEqual([
      { set: "trk", collector_number: "74" },
      { name: "Gisela, the Broken Blade", set: "sld" },
    ]);
    expect(spock?.small).toBe("https://cards.scryfall.io/small/spock.jpg");
    expect(gisela?.normal).toBe("https://cards.scryfall.io/normal/gisela.jpg");
  });

  it("retries missing set/collector matches as one name-only batch", async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            name: "Khaaaaaaaaaaaannn!",
            set: "trk",
            collector_number: "154",
            image_uris: { small: "https://cards.scryfall.io/small/khan.jpg" },
          },
        ]),
      );
    const lookup = createMarketCardArtLookup({
      fetcher,
      batchWindowMs: 5,
      requestGapMs: 0,
      storage: null,
    });

    const resultPromise = lookup("Khaaaaaaaaaaaannn!", "trk", "154");
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(fetcher).toHaveBeenCalledTimes(2);
    const fallbackRequest = fetcher.mock.calls[1]?.[1];
    expect(JSON.parse(String(fallbackRequest?.body))).toEqual({
      identifiers: [{ name: "Khaaaaaaaaaaaannn!" }],
    });
    expect(result?.small).toBe("https://cards.scryfall.io/small/khan.jpg");
  });

  it("deduplicates repeated lookups and caches successful images for the session", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<Fetcher>(async () =>
      jsonResponse([
        {
          name: "Sol Ring",
          set: "sld",
          collector_number: "100",
          image_uris: { small: "https://cards.scryfall.io/small/sol-ring.jpg" },
        },
      ]),
    );
    const lookup = createMarketCardArtLookup({
      fetcher,
      batchWindowMs: 10,
      requestGapMs: 0,
      storage: null,
    });

    const first = lookup("Sol Ring", "sld");
    const second = lookup("Sol Ring", "sld");
    await vi.runAllTimersAsync();
    const [firstResult, secondResult] = await Promise.all([first, second]);
    const cachedResult = await lookup("Sol Ring", "sld");

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
    expect(cachedResult?.small).toBe("https://cards.scryfall.io/small/sol-ring.jpg");
  });
});
