import type { RawCommanderDeck } from "./commanderDecklistsData";

export type LocalArchiveStatus = "idle" | "loading" | "error" | "ready";

export function localArchiveDisplayStatus(
  decklists: RawCommanderDeck[] | null,
  isLoading: boolean,
  error: string | null
): LocalArchiveStatus {
  if (decklists !== null) return "ready";
  if (error) return "error";
  return isLoading ? "loading" : "idle";
}

/** Create a single-flight loader whose successful result is cached and whose failures can be retried. */
export function createCachedArchiveLoader(
  loadArchive: () => Promise<RawCommanderDeck[]>
) {
  let cachedDecklists: RawCommanderDeck[] | null = null;
  let pendingLoad: Promise<RawCommanderDeck[]> | null = null;

  return function loadArchiveOnce(): Promise<RawCommanderDeck[]> {
    if (cachedDecklists !== null) return Promise.resolve(cachedDecklists);

    if (pendingLoad === null) {
      pendingLoad = loadArchive()
        .then(decklists => {
          cachedDecklists = decklists;
          return decklists;
        })
        .catch((error: unknown) => {
          pendingLoad = null;
          throw error;
        });
    }

    return pendingLoad;
  };
}

/** The archive stays in its own lazy-loaded chunk and is shared across every hook instance. */
export const loadLocalCommanderArchive = createCachedArchiveLoader(async () => {
  const archive = await import("./commanderDecklistsData");
  return archive.commanderDecklistsData;
});
