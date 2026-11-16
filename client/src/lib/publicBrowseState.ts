export type PublicBrowseState = { query: string; filter: string };

const QUERY_LIMIT = 200;
const FILTER_LIMIT = 80;

export function readPublicBrowseState(
  search: string,
  filterParam: string,
  allowedFilters?: readonly string[]
): PublicBrowseState {
  const params = new URLSearchParams(search);
  const query = (params.get("q") || "").slice(0, QUERY_LIMIT);
  const requestedFilter = (params.get(filterParam) || "all").slice(
    0,
    FILTER_LIMIT
  );
  const filter =
    requestedFilter === "all" ||
    !allowedFilters ||
    allowedFilters.includes(requestedFilter)
      ? requestedFilter
      : "all";
  return { query, filter };
}

export function serializePublicBrowseState(
  state: PublicBrowseState,
  filterParam: string,
  allowedFilters?: readonly string[]
): string {
  const params = new URLSearchParams();
  const query = state.query.trim().slice(0, QUERY_LIMIT);
  if (query) params.set("q", query);

  const filter = state.filter.slice(0, FILTER_LIMIT);
  const isAllowed = !allowedFilters || allowedFilters.includes(filter);
  if (filter && filter !== "all" && isAllowed) params.set(filterParam, filter);
  return params.toString();
}

export function buildPublicBrowseHref(
  pathname: string,
  state: PublicBrowseState,
  filterParam: string,
  allowedFilters?: readonly string[]
): string {
  const search = serializePublicBrowseState(state, filterParam, allowedFilters);
  return `${pathname}${search ? `?${search}` : ""}`;
}

export function publicBrowseHrefFromSearch(
  pathname: string,
  currentSearch: string,
  filterParam: string,
  allowedFilters?: readonly string[]
): string {
  return buildPublicBrowseHref(
    pathname,
    readPublicBrowseState(currentSearch, filterParam, allowedFilters),
    filterParam,
    allowedFilters
  );
}

export function replacePublicBrowseState(
  state: PublicBrowseState,
  filterParam: string,
  allowedFilters?: readonly string[]
): void {
  if (typeof window === "undefined") return;
  const search = serializePublicBrowseState(state, filterParam, allowedFilters);
  const next = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) window.history.replaceState(window.history.state, "", next);
}
