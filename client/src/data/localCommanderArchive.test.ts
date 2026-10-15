import { describe, expect, it, vi } from "vitest";
import {
  createCachedArchiveLoader,
  localArchiveDisplayStatus,
} from "./localCommanderArchive";
import type { RawCommanderDeck } from "./commanderDecklistsData";

const decklists = [
  { set_code: "eoc", name: "World Shaper" },
] as RawCommanderDeck[];

describe("shared Commander archive loader", () => {
  it("distinguishes idle, slow, failed, and truly empty successful archive states", () => {
    expect(localArchiveDisplayStatus(null, false, null)).toBe("idle");
    expect(localArchiveDisplayStatus(null, true, null)).toBe("loading");
    expect(localArchiveDisplayStatus(null, false, "temporary failure")).toBe(
      "error"
    );
    expect(localArchiveDisplayStatus([], false, null)).toBe("ready");
  });

  it("deduplicates simultaneous cold loads and caches the resolved archive", async () => {
    let resolveLoad!: (value: RawCommanderDeck[]) => void;
    const pending = new Promise<RawCommanderDeck[]>(resolve => {
      resolveLoad = resolve;
    });
    const loadArchive = vi.fn(() => pending);
    const load = createCachedArchiveLoader(loadArchive);

    const firstRequest = load();
    const secondRequest = load();
    expect(loadArchive).toHaveBeenCalledTimes(1);

    resolveLoad(decklists);
    await expect(firstRequest).resolves.toBe(decklists);
    await expect(secondRequest).resolves.toBe(decklists);
    await expect(load()).resolves.toBe(decklists);
    expect(loadArchive).toHaveBeenCalledTimes(1);
  });

  it("treats a successfully loaded empty archive as cached data, not as a cache miss", async () => {
    const loadArchive = vi.fn(async () => [] as RawCommanderDeck[]);
    const load = createCachedArchiveLoader(loadArchive);

    await expect(load()).resolves.toEqual([]);
    await expect(load()).resolves.toEqual([]);
    expect(loadArchive).toHaveBeenCalledTimes(1);
  });

  it("clears a failed cold request so a later retry can succeed", async () => {
    const loadArchive = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary chunk request failure"))
      .mockResolvedValueOnce(decklists);
    const load = createCachedArchiveLoader(loadArchive);

    await expect(load()).rejects.toThrow("temporary chunk request failure");
    await expect(load()).resolves.toBe(decklists);
    await expect(load()).resolves.toBe(decklists);
    expect(loadArchive).toHaveBeenCalledTimes(2);
  });
});
