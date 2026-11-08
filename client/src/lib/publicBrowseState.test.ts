import { describe, expect, it } from "vitest";
import {
  buildPublicBrowseHref,
  readPublicBrowseState,
  serializePublicBrowseState,
} from "./publicBrowseState";

describe("public browse URL state", () => {
  const filters = ["all", "proposals", "references"];

  it("restores public search and filter values from a detail route URL", () => {
    const state = readPublicBrowseState(
      "?q=Gisa%20and%20Geralf&filter=proposals&collection=private",
      "filter",
      filters
    );
    expect(state).toEqual({ query: "Gisa and Geralf", filter: "proposals" });
    expect(
      buildPublicBrowseHref("/deck-brewery/reviews", state, "filter", filters)
    ).toBe("/deck-brewery/reviews?q=Gisa+and+Geralf&filter=proposals");
  });

  it("serializes only public search and allowed filter fields", () => {
    const url = serializePublicBrowseState(
      { query: "Breya", filter: "proposals" },
      "filter",
      filters
    );
    expect(url).toBe("q=Breya&filter=proposals");
    expect(url).not.toMatch(/collection|owned|ownership|scan|private/i);
  });

  it("drops unknown filter values and omits default or empty state", () => {
    expect(
      readPublicBrowseState("?q=&filter=secret", "filter", filters)
    ).toEqual({ query: "", filter: "all" });
    expect(
      serializePublicBrowseState({ query: "   ", filter: "all" }, "filter", filters)
    ).toBe("");
  });

  it("bounds URL input lengths without changing ordinary public searches", () => {
    const query = "x".repeat(300);
    const state = readPublicBrowseState(`?q=${query}&filter=proposals`, "filter", filters);
    expect(state.query).toHaveLength(200);
    expect(state.filter).toBe("proposals");
  });
});
