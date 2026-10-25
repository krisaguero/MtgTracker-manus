import { useEffect, useState } from "react";
import type { RawCommanderDeck } from "@/data/commanderDecklistsData";

export type CommanderArchive = RawCommanderDeck[];

export interface CommanderArchiveIndexEntry {
  name: string;
  set_code: string;
  set_name: string;
  release_date?: string;
  commander: Array<{ name: string }>;
  approxValue?: number;
  synopsis?: string;
}

type ArchiveState = "idle" | "loading" | "ready" | "error";

let state: ArchiveState = "idle";
let archive: CommanderArchive | null = null;
let loadPromise: Promise<CommanderArchive> | null = null;
let archiveIndex: CommanderArchiveIndexEntry[] | null = null;
let indexPromise: Promise<CommanderArchiveIndexEntry[]> | null = null;

export async function loadCommanderArchive(): Promise<CommanderArchive> {
  if (archive) return archive;
  if (loadPromise) return loadPromise;

  state = "loading";
  loadPromise = import("@/data/commanderDecklists")
    .then(module => {
      archive = module.commanderDecklists;
      state = "ready";
      return archive;
    })
    .catch(error => {
      state = "error";
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}

export async function loadCommanderArchiveIndex(): Promise<CommanderArchiveIndexEntry[]> {
  if (archiveIndex) return archiveIndex;
  if (indexPromise) return indexPromise;

  indexPromise = import("@/data/commanderDeckIndex.json")
    .then(module => {
      archiveIndex = (module.default?.decks || []) as CommanderArchiveIndexEntry[];
      return archiveIndex;
    })
    .catch(error => {
      indexPromise = null;
      throw error;
    });

  return indexPromise;
}

export function useCommanderArchive() {
  const [status, setStatus] = useState<ArchiveState>(state);
  const [decks, setDecks] = useState<CommanderArchive | null>(archive);

  useEffect(() => {
    let active = true;
    if (archive) {
      setDecks(archive);
      setStatus("ready");
      return () => {
        active = false;
      };
    }

    void loadCommanderArchive()
      .then(loaded => {
        if (!active) return;
        setDecks(loaded);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    decks,
    loading: status === "idle" || status === "loading",
    ready: status === "ready",
    error: status === "error",
  };
}

export function useCommanderArchiveIndex() {
  const [status, setStatus] = useState<ArchiveState>(archiveIndex ? "ready" : "idle");
  const [entries, setEntries] = useState<CommanderArchiveIndexEntry[] | null>(archiveIndex);

  useEffect(() => {
    let active = true;
    void loadCommanderArchiveIndex()
      .then(loaded => {
        if (!active) return;
        setEntries(loaded);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  return {
    entries,
    loading: status === "idle" || status === "loading",
    ready: status === "ready",
    error: status === "error",
  };
}
