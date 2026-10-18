import type { OwnedCard } from "./manaboxParser";
import { clearOwnedCollection, loadOwnedCollection } from "./manaboxParser";
import {
  COLLECTION_HISTORY_STORAGE_KEY,
  getValuationHistory,
  type ValuationSnapshot,
} from "./collectionHistory";
import {
  LOCAL_SAVED_DECKS_STORAGE_KEY,
  loadLocalSavedDecks,
  type LocalSavedDeck,
} from "./localSavedDecks";
import {
  clearSavedInventories,
  loadStoredInventories,
  STORAGE_KEY_DECK_A,
  STORAGE_KEY_DECK_B,
  STORAGE_KEY_SIDEBOARD_A,
  STORAGE_KEY_SIDEBOARD_B,
  STORAGE_KEY_SAVED_THEMES,
  type DuelInventories,
} from "./dupeDecksStorage";
import {
  COLLECTION_PLANNER_STORAGE_KEY,
  EMPTY_COLLECTION_PLANNER,
  isCollectionPlannerData,
  loadCollectionPlanner,
  type CollectionPlannerData,
} from "./collectionPlanner";
import { DIRECTORY_STORAGE_KEY } from "./collectionDirectory";

import {
  EMPTY_LIMITED_WORKSPACE,
  LIMITED_WORKSPACE_STORAGE_KEY,
  loadLimitedWorkspace,
  validateLimitedWorkspace,
  type LimitedWorkspace,
} from "./limitedDeckBuilder";

export const LOCAL_WORKSPACE_BACKUP_FORMAT = "mtg-tracker-local-workspace";
export const LOCAL_WORKSPACE_BACKUP_VERSION = 2;
export const COMMANDER_PASSPORT_STORAGE_KEY =
  "mtg_tracker_commander_passport_v1";
export const LOCAL_WORKSPACE_CHANGED_EVENT =
  "mtg-tracker-local-workspace-changed";
export const PRINT_CHECKLIST_STORAGE_PREFIX =
  "mtg.collection.print-checklist.v1:";
export const PHYSICAL_REVIEW_STORAGE_PREFIX =
  "mtg.collection.physical-review.v1:";

export interface CommanderDeckRecord {
  id: string;
  commanderName: string;
  deckName: string;
  colors: string[];
  theme: string;
  status: "Active" | "Built & Ready" | "Tuning" | "Retired";
  wins?: number;
  notes?: string;
  addedAt: number;
}

export interface PrivateDirectoryBackup {
  policies: Record<
    string,
    {
      keep: number;
      reserve: number;
      disposition?: "keep" | "reserve" | "trade";
    }
  >;
  reviewedSets: Record<string, boolean>;
  printChecklist: Record<string, unknown>;
  physicalReview: Record<string, boolean>;
}

export interface LocalWorkspaceBackup {
  format: typeof LOCAL_WORKSPACE_BACKUP_FORMAT;
  version: 1 | typeof LOCAL_WORKSPACE_BACKUP_VERSION;
  exportedAt: string;
  collection: OwnedCard[];
  commanderDecks: CommanderDeckRecord[];
  savedDecklists: LocalSavedDeck[];
  duelInventories: DuelInventories;
  valuationHistory: ValuationSnapshot[];
  collectionPlanner?: CollectionPlannerData;
  limitedWorkspace?: LimitedWorkspace;
  privateDirectory?: PrivateDirectoryBackup;
}

const BACKUP_KEYS = [
  "mtg_tracker_manabox_collection_v2",
  "mtg_tracker_manabox_collection_v1",
  COMMANDER_PASSPORT_STORAGE_KEY,
  LOCAL_SAVED_DECKS_STORAGE_KEY,
  STORAGE_KEY_DECK_A,
  STORAGE_KEY_DECK_B,
  STORAGE_KEY_SIDEBOARD_A,
  STORAGE_KEY_SIDEBOARD_B,
  STORAGE_KEY_SAVED_THEMES,
  COLLECTION_HISTORY_STORAGE_KEY,
  COLLECTION_PLANNER_STORAGE_KEY,
  LIMITED_WORKSPACE_STORAGE_KEY,
  DIRECTORY_STORAGE_KEY,
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isOwnedCard(value: unknown): value is OwnedCard {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    value.name.length <= 300 &&
    Number.isSafeInteger(value.quantity) &&
    Number(value.quantity) > 0 &&
    ["setCode", "collectorNumber", "finish", "condition", "language"].every(
      key =>
        value[key] === undefined ||
        (typeof value[key] === "string" && value[key].length <= 300)
    )
  );
}

function isCommanderDeckRecord(value: unknown): value is CommanderDeckRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length <= 160 &&
    typeof value.commanderName === "string" &&
    value.commanderName.length <= 300 &&
    typeof value.deckName === "string" &&
    value.deckName.length <= 300 &&
    Array.isArray(value.colors) &&
    value.colors.length <= 10 &&
    value.colors.every(
      color => typeof color === "string" && color.length <= 10
    ) &&
    typeof value.theme === "string" &&
    value.theme.length <= 1000 &&
    ["Active", "Built & Ready", "Tuning", "Retired"].includes(
      String(value.status)
    ) &&
    (value.wins === undefined ||
      (Number.isInteger(value.wins) && Number(value.wins) >= 0)) &&
    (value.notes === undefined ||
      (typeof value.notes === "string" && value.notes.length <= 10000)) &&
    typeof value.addedAt === "number" &&
    Number.isFinite(value.addedAt)
  );
}

function isValidSavedDeck(value: unknown): value is LocalSavedDeck {
  if (
    !isRecord(value) ||
    typeof value.deckKey !== "string" ||
    value.deckKey.length === 0 ||
    value.deckKey.length > 160 ||
    typeof value.name !== "string" ||
    value.name.length === 0 ||
    value.name.length > 255 ||
    typeof value.source !== "string" ||
    value.source.length > 64 ||
    typeof value.href !== "string" ||
    !(
      /^\/deck\/[a-z0-9-]+\/[a-z0-9-]+$/i.test(value.href) ||
      /^\/deck-workshop(?:\?restore=[a-z0-9-]+)?$/i.test(value.href)
    ) ||
    typeof value.deckJson !== "string" ||
    value.deckJson.length > 200000 ||
    typeof value.updatedAt !== "number" ||
    !Number.isFinite(value.updatedAt)
  )
    return false;
  try {
    const deck = JSON.parse(value.deckJson) as unknown;
    if (!isRecord(deck)) return false;
    return ["commander", "main"].every(
      zone =>
        Array.isArray(deck[zone]) &&
        (deck[zone] as unknown[]).every(
          card =>
            isRecord(card) &&
            typeof card.name === "string" &&
            Number.isSafeInteger(card.quantity) &&
            Number(card.quantity) > 0
        )
    );
  } catch {
    return false;
  }
}

function isValuationSnapshot(value: unknown): value is ValuationSnapshot {
  return (
    isRecord(value) &&
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    Number.isInteger(value.totalCards) &&
    Number(value.totalCards) >= 0 &&
    typeof value.estimatedValueUsd === "number" &&
    Number.isFinite(value.estimatedValueUsd) &&
    ["pricedCardCount", "unpricedCardCount"].every(
      key =>
        value[key] === undefined ||
        (Number.isInteger(value[key]) && Number(value[key]) >= 0)
    ) &&
    ["priceAsOf", "refreshedAt"].every(
      key =>
        value[key] === undefined ||
        (typeof value[key] === "string" && value[key].length <= 100)
    )
  );
}

function emitWorkspaceChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOCAL_WORKSPACE_CHANGED_EVENT));
  }
}

export function loadCommanderDeckRecords(): CommanderDeckRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMMANDER_PASSPORT_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isCommanderDeckRecord) : [];
  } catch {
    return [];
  }
}

function storageKeysWithPrefix(storage: Storage, prefix: string): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
}

function loadPrivateDirectoryBackup(): PrivateDirectoryBackup | undefined {
  if (typeof window === "undefined") return undefined;
  const storage = window.localStorage;
  let directory: unknown;
  try {
    directory = JSON.parse(storage.getItem(DIRECTORY_STORAGE_KEY) || "null");
  } catch {
    directory = undefined;
  }
  const policies =
    isRecord(directory) && isRecord(directory.policies)
      ? directory.policies
      : {};
  const reviewedSets =
    isRecord(directory) && isRecord(directory.reviewedSets)
      ? directory.reviewedSets
      : {};
  const printChecklist: Record<string, unknown> = {};
  for (const key of storageKeysWithPrefix(
    storage,
    PRINT_CHECKLIST_STORAGE_PREFIX
  )) {
    try {
      const parsed: unknown = JSON.parse(storage.getItem(key) || "null");
      if (
        isRecord(parsed) &&
        typeof parsed.catalogScope === "string" &&
        parsed.catalogScope.length <= 1000 &&
        isRecord(parsed.reviewed) &&
        Object.keys(parsed.reviewed).length <= 10000 &&
        Object.values(parsed.reviewed).every(flag => typeof flag === "boolean")
      ) {
        printChecklist[key] = parsed;
      }
    } catch {
      /* omit corrupt private state */
    }
  }
  const physicalReview: Record<string, boolean> = {};
  for (const key of storageKeysWithPrefix(
    storage,
    PHYSICAL_REVIEW_STORAGE_PREFIX
  )) {
    if (storage.getItem(key) === "true") physicalReview[key] = true;
  }
  if (
    !Object.keys(policies).length &&
    !Object.keys(reviewedSets).length &&
    !Object.keys(printChecklist).length &&
    !Object.keys(physicalReview).length
  )
    return undefined;
  return {
    policies: policies as PrivateDirectoryBackup["policies"],
    reviewedSets: reviewedSets as Record<string, boolean>,
    printChecklist,
    physicalReview,
  };
}

function isPrivateDirectoryBackup(
  value: unknown
): value is PrivateDirectoryBackup {
  if (
    !isRecord(value) ||
    !isRecord(value.policies) ||
    !isRecord(value.reviewedSets) ||
    !isRecord(value.printChecklist) ||
    !isRecord(value.physicalReview)
  )
    return false;
  const policyKeys = Object.keys(value.policies);
  if (
    policyKeys.length > 10000 ||
    policyKeys.some(key => key.length === 0 || key.length > 300)
  )
    return false;
  for (const policy of Object.values(value.policies)) {
    if (
      !isRecord(policy) ||
      !Number.isSafeInteger(policy.keep) ||
      Number(policy.keep) < 0 ||
      !Number.isSafeInteger(policy.reserve) ||
      Number(policy.reserve) < 0 ||
      (policy.disposition !== undefined &&
        !["keep", "reserve", "trade"].includes(String(policy.disposition)))
    )
      return false;
  }
  if (
    Object.keys(value.reviewedSets).length > 10000 ||
    Object.values(value.reviewedSets).some(item => typeof item !== "boolean")
  )
    return false;
  if (
    Object.keys(value.physicalReview).length > 10000 ||
    Object.keys(value.physicalReview).some(
      key => !key.startsWith(PHYSICAL_REVIEW_STORAGE_PREFIX)
    ) ||
    Object.values(value.physicalReview).some(item => item !== true)
  )
    return false;
  if (
    Object.keys(value.printChecklist).length > 10000 ||
    Object.keys(value.printChecklist).some(
      key => !key.startsWith(PRINT_CHECKLIST_STORAGE_PREFIX)
    )
  )
    return false;
  for (const item of Object.values(value.printChecklist)) {
    if (
      !isRecord(item) ||
      typeof item.catalogScope !== "string" ||
      item.catalogScope.length > 1000 ||
      !isRecord(item.reviewed) ||
      Object.keys(item.reviewed).length > 10000 ||
      Object.values(item.reviewed).some(flag => typeof flag !== "boolean")
    )
      return false;
  }
  return true;
}

export function createLocalWorkspaceBackup(): LocalWorkspaceBackup {
  return {
    format: LOCAL_WORKSPACE_BACKUP_FORMAT,
    version: LOCAL_WORKSPACE_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    collection: loadOwnedCollection().filter(isOwnedCard),
    commanderDecks: loadCommanderDeckRecords(),
    savedDecklists: loadLocalSavedDecks().filter(isValidSavedDeck),
    duelInventories: loadStoredInventories(),
    valuationHistory: getValuationHistory().filter(isValuationSnapshot),
    collectionPlanner: loadCollectionPlanner(),
    limitedWorkspace: loadLimitedWorkspace(),
    privateDirectory: loadPrivateDirectoryBackup(),
  };
}

export function validateLocalWorkspaceBackup(
  value: unknown
): value is LocalWorkspaceBackup {
  if (
    !isRecord(value) ||
    value.format !== LOCAL_WORKSPACE_BACKUP_FORMAT ||
    (value.version !== 1 && value.version !== LOCAL_WORKSPACE_BACKUP_VERSION) ||
    typeof value.exportedAt !== "string" ||
    Number.isNaN(Date.parse(value.exportedAt)) ||
    !Array.isArray(value.collection) ||
    !Array.isArray(value.commanderDecks) ||
    !Array.isArray(value.savedDecklists) ||
    !isRecord(value.duelInventories) ||
    typeof value.duelInventories.a !== "string" ||
    typeof value.duelInventories.b !== "string" ||
    !Array.isArray(value.valuationHistory) ||
    (value.collectionPlanner !== undefined &&
      !isCollectionPlannerData(value.collectionPlanner)) ||
    (value.limitedWorkspace !== undefined &&
      !validateLimitedWorkspace(value.limitedWorkspace)) ||
    (value.privateDirectory !== undefined &&
      !isPrivateDirectoryBackup(value.privateDirectory)) ||
    (value.version === LOCAL_WORKSPACE_BACKUP_VERSION &&
      (!isCollectionPlannerData(value.collectionPlanner) ||
        !validateLimitedWorkspace(value.limitedWorkspace)))
  )
    return false;
  const duelInventories = value.duelInventories;
  if (
    ["sideboardA", "sideboardB"].some(
      key =>
        duelInventories[key] !== undefined &&
        (typeof duelInventories[key] !== "string" ||
          String(duelInventories[key]).length > 100000)
    )
  )
    return false;
  if (
    duelInventories.savedThemes !== undefined &&
    (!Array.isArray(duelInventories.savedThemes) ||
      duelInventories.savedThemes.length > 500 ||
      duelInventories.savedThemes.some(
        theme =>
          !isRecord(theme) ||
          typeof theme.id !== "string" ||
          theme.id.length > 160 ||
          typeof theme.name !== "string" ||
          theme.name.trim().length === 0 ||
          theme.name.length > 120 ||
          typeof theme.themeId !== "string" ||
          theme.themeId.length > 100 ||
          !["a", "b"].includes(String(theme.slot)) ||
          typeof theme.savedAt !== "number" ||
          !Number.isFinite(theme.savedAt)
      ))
  )
    return false;
  if (
    value.collection.length > 250000 ||
    value.commanderDecks.length > 10000 ||
    value.savedDecklists.length > 10000 ||
    value.valuationHistory.length > 10000
  )
    return false;
  return (
    value.collection.every(isOwnedCard) &&
    value.commanderDecks.every(isCommanderDeckRecord) &&
    value.savedDecklists.every(isValidSavedDeck) &&
    value.valuationHistory.every(isValuationSnapshot)
  );
}

export function restoreLocalWorkspaceBackup(value: unknown): void {
  if (!validateLocalWorkspaceBackup(value)) {
    throw new Error(
      "This file is not a supported, valid local workspace backup."
    );
  }
  if (typeof window === "undefined")
    throw new Error("Local workspace restore requires a browser.");

  const backup = value;
  const storage = window.localStorage;
  const allBackupKeys = [
    ...BACKUP_KEYS,
    ...storageKeysWithPrefix(storage, PRINT_CHECKLIST_STORAGE_PREFIX),
    ...storageKeysWithPrefix(storage, PHYSICAL_REVIEW_STORAGE_PREFIX),
  ];
  const oldValues = new Map<string, string | null>(
    allBackupKeys.map(key => [key, storage.getItem(key)])
  );
  const nextValues: Record<string, string> = {
    mtg_tracker_manabox_collection_v2: JSON.stringify(backup.collection),
    [COMMANDER_PASSPORT_STORAGE_KEY]: JSON.stringify(backup.commanderDecks),
    [LOCAL_SAVED_DECKS_STORAGE_KEY]: JSON.stringify(backup.savedDecklists),
    [STORAGE_KEY_DECK_A]: backup.duelInventories.a,
    [STORAGE_KEY_DECK_B]: backup.duelInventories.b,
    [STORAGE_KEY_SIDEBOARD_A]: backup.duelInventories.sideboardA ?? "",
    [STORAGE_KEY_SIDEBOARD_B]: backup.duelInventories.sideboardB ?? "",
    [STORAGE_KEY_SAVED_THEMES]: JSON.stringify(
      backup.duelInventories.savedThemes ?? []
    ),
    [COLLECTION_HISTORY_STORAGE_KEY]: JSON.stringify(backup.valuationHistory),
    [COLLECTION_PLANNER_STORAGE_KEY]: JSON.stringify(
      backup.collectionPlanner ?? EMPTY_COLLECTION_PLANNER
    ),
    [LIMITED_WORKSPACE_STORAGE_KEY]: JSON.stringify(
      backup.limitedWorkspace ?? EMPTY_LIMITED_WORKSPACE
    ),
  };
  for (const key of storageKeysWithPrefix(
    storage,
    PRINT_CHECKLIST_STORAGE_PREFIX
  ))
    delete nextValues[key];
  for (const key of storageKeysWithPrefix(
    storage,
    PHYSICAL_REVIEW_STORAGE_PREFIX
  ))
    delete nextValues[key];
  if (backup.privateDirectory) {
    nextValues[DIRECTORY_STORAGE_KEY] = JSON.stringify({
      policies: backup.privateDirectory.policies,
      reviewedSets: backup.privateDirectory.reviewedSets,
    });
    for (const [key, payload] of Object.entries(
      backup.privateDirectory.printChecklist
    ))
      nextValues[key] = JSON.stringify(payload);
    for (const key of Object.keys(backup.privateDirectory.physicalReview))
      nextValues[key] = "true";
  } else {
    nextValues[DIRECTORY_STORAGE_KEY] = JSON.stringify({
      policies: {},
      reviewedSets: {},
    });
  }
  try {
    for (const [key, nextValue] of Object.entries(nextValues))
      storage.setItem(key, nextValue);
    storage.removeItem("mtg_tracker_manabox_collection_v1");
    for (const key of storageKeysWithPrefix(
      storage,
      PRINT_CHECKLIST_STORAGE_PREFIX
    )) {
      if (!(key in nextValues)) storage.removeItem(key);
    }
    for (const key of storageKeysWithPrefix(
      storage,
      PHYSICAL_REVIEW_STORAGE_PREFIX
    )) {
      if (!(key in nextValues)) storage.removeItem(key);
    }
  } catch (error) {
    oldValues.forEach((oldValue, key) => {
      try {
        if (oldValue === null) storage.removeItem(key);
        else storage.setItem(key, oldValue);
      } catch {
        // Best-effort rollback if browser storage is unavailable or full.
      }
    });
    throw error;
  }
  emitWorkspaceChanged();
}

export function clearLocalWorkspace(): void {
  if (typeof window === "undefined") return;
  clearOwnedCollection();
  clearSavedInventories();
  for (const key of [
    COMMANDER_PASSPORT_STORAGE_KEY,
    LOCAL_SAVED_DECKS_STORAGE_KEY,
    COLLECTION_HISTORY_STORAGE_KEY,
    COLLECTION_PLANNER_STORAGE_KEY,
    LIMITED_WORKSPACE_STORAGE_KEY,
    DIRECTORY_STORAGE_KEY,
  ]) {
    window.localStorage.removeItem(key);
  }
  for (const key of [
    ...storageKeysWithPrefix(
      window.localStorage,
      PRINT_CHECKLIST_STORAGE_PREFIX
    ),
    ...storageKeysWithPrefix(
      window.localStorage,
      PHYSICAL_REVIEW_STORAGE_PREFIX
    ),
  ]) {
    window.localStorage.removeItem(key);
  }
  emitWorkspaceChanged();
}
