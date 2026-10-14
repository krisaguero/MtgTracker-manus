export const HOME_CATALOG_PAGE_SIZE = 12;

export interface CatalogPage<T> {
  items: T[];
  page: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
}

/** Return only the requested catalog window, clamping page values to the available range. */
export function getCatalogPage<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize = HOME_CATALOG_PAGE_SIZE
): CatalogPage<T> {
  const safePageSize = Math.max(1, Math.floor(pageSize) || 1);
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const page = Math.min(pageCount, Math.max(1, Math.floor(requestedPage) || 1));
  const startIndex = (page - 1) * safePageSize;

  return {
    items: items.slice(startIndex, startIndex + safePageSize),
    page,
    pageCount,
    start: items.length === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + safePageSize, items.length),
    total: items.length,
  };
}
