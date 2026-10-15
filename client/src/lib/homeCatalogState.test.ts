import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOME_CATALOG_STATE,
  parseHomeCatalogState,
  serializeHomeCatalogState,
} from "./homeCatalogState";

describe("homepage catalog return state", () => {
  it("round-trips archive/set view, search, filters, pagination, expansion, and scroll", () => {
    const state = {
      catalogView: "sets" as const,
      query: "Edge of Eternities",
      setType: "expansion" as const,
      sortMode: "value" as const,
      showFavorites: true,
      setsPage: 3,
      preconsPage: 2,
      expandedSetCode: "eoe",
      scrollY: 1480,
    };

    expect(parseHomeCatalogState(serializeHomeCatalogState(state))).toEqual(
      state
    );
  });

  it("clamps invalid page and scroll values and falls back for unknown filters", () => {
    const state = parseHomeCatalogState(
      JSON.stringify({
        setsPage: 0,
        preconsPage: -3,
        scrollY: -40,
        setType: "bad",
        sortMode: "bad",
      })
    );
    expect(state).toEqual({
      ...DEFAULT_HOME_CATALOG_STATE,
      setsPage: 1,
      preconsPage: 1,
      scrollY: 0,
    });
  });

  it("ignores malformed session data without throwing", () => {
    expect(parseHomeCatalogState("{")).toEqual(DEFAULT_HOME_CATALOG_STATE);
    expect(parseHomeCatalogState(null)).toEqual(DEFAULT_HOME_CATALOG_STATE);
  });
});
