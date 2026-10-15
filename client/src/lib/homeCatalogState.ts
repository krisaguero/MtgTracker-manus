export type HomeCatalogView = "sets" | "precons";
export type HomeSetTypeFilter = "all" | "expansion" | "core" | "masters";
export type HomeSortMode = "newest" | "oldest" | "value" | "cards";

export interface HomeCatalogState {
  catalogView: HomeCatalogView;
  query: string;
  setType: HomeSetTypeFilter;
  sortMode: HomeSortMode;
  showFavorites: boolean;
  setsPage: number;
  preconsPage: number;
  expandedSetCode: string | null;
  scrollY: number;
}

export const HOME_CATALOG_STATE_KEY = "mtg-home-catalog-state-v1";

export const DEFAULT_HOME_CATALOG_STATE: HomeCatalogState = {
  catalogView: "sets",
  query: "",
  setType: "all",
  sortMode: "newest",
  showFavorites: false,
  setsPage: 1,
  preconsPage: 1,
  expandedSetCode: null,
  scrollY: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safePage(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.floor(value))
    : fallback;
}

/** Parse persisted state defensively so stale or malformed session data never blocks the homepage. */
export function parseHomeCatalogState(
  raw: string | null | undefined
): HomeCatalogState {
  if (!raw) return { ...DEFAULT_HOME_CATALOG_STATE };

  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return { ...DEFAULT_HOME_CATALOG_STATE };

    return {
      catalogView: value.catalogView === "precons" ? "precons" : "sets",
      query: typeof value.query === "string" ? value.query : "",
      setType:
        value.setType === "expansion" ||
        value.setType === "core" ||
        value.setType === "masters"
          ? value.setType
          : "all",
      sortMode:
        value.sortMode === "oldest" ||
        value.sortMode === "value" ||
        value.sortMode === "cards"
          ? value.sortMode
          : "newest",
      showFavorites: value.showFavorites === true,
      setsPage: safePage(value.setsPage, 1),
      preconsPage: safePage(value.preconsPage, 1),
      expandedSetCode:
        typeof value.expandedSetCode === "string"
          ? value.expandedSetCode
          : null,
      scrollY:
        typeof value.scrollY === "number" && Number.isFinite(value.scrollY)
          ? Math.max(0, Math.floor(value.scrollY))
          : 0,
    };
  } catch {
    return { ...DEFAULT_HOME_CATALOG_STATE };
  }
}

export function serializeHomeCatalogState(state: HomeCatalogState) {
  return JSON.stringify(state);
}
