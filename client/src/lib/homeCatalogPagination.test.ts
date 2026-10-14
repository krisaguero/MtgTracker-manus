import { describe, expect, it } from "vitest";
import {
  getCatalogPage,
  HOME_CATALOG_PAGE_SIZE,
} from "./homeCatalogPagination";

describe("homepage catalog pagination", () => {
  it("limits the initial catalog window to the configured page size", () => {
    const items = Array.from({ length: 50 }, (_, index) => index + 1);
    const result = getCatalogPage(items, 1);

    expect(HOME_CATALOG_PAGE_SIZE).toBe(12);
    expect(result.items).toEqual(items.slice(0, 12));
    expect(result.pageCount).toBe(5);
    expect(result.start).toBe(1);
    expect(result.end).toBe(12);
  });

  it("returns the correct final partial page", () => {
    const items = Array.from({ length: 25 }, (_, index) => index + 1);
    const result = getCatalogPage(items, 3);

    expect(result.items).toEqual([25]);
    expect(result.start).toBe(25);
    expect(result.end).toBe(25);
  });

  it("clamps invalid page requests and handles an empty catalog", () => {
    const items = [1, 2, 3];

    expect(getCatalogPage(items, 99, 2).items).toEqual([3]);
    expect(getCatalogPage(items, 0, 2).page).toBe(1);
    expect(getCatalogPage([], 8)).toMatchObject({
      items: [],
      page: 1,
      pageCount: 1,
      start: 0,
      end: 0,
      total: 0,
    });
  });
});
