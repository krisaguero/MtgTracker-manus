import type { OwnedCard, CollectionImportReport } from './manaboxParser';
import { collectionIdentity } from './manaboxParser';

export type MissionStep = { id: string; label: string; complete: boolean };
export type SavedBuild = { id: string; deckSlug: string; label: string; budget: number; mode: string; createdAt: number };
export type Reservation = { identity: string; name: string; deckSlug: string; quantity: number; updatedAt: number };
export type AcquisitionEstimate = { deckSlug: string; currentValueUsd: number; updatedAt: number };
export type PortfolioServiceState = {
  missions: Record<string, MissionStep[]>;
  savedBuilds: SavedBuild[];
  reservations: Reservation[];
  acquisitionEstimates: AcquisitionEstimate[];
  lastImportReport?: CollectionImportReport;
};

const STORAGE_KEY = 'mtg_tracker_portfolio_service_v1';

const blankState: PortfolioServiceState = { missions: {}, savedBuilds: [], reservations: [], acquisitionEstimates: [] };

export function loadPortfolioServiceState(): PortfolioServiceState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<PortfolioServiceState> | null;
    return {
      missions: parsed?.missions && typeof parsed.missions === 'object' ? parsed.missions : {},
      savedBuilds: Array.isArray(parsed?.savedBuilds) ? parsed.savedBuilds : [],
      reservations: Array.isArray(parsed?.reservations) ? parsed.reservations : [],
      acquisitionEstimates: Array.isArray(parsed?.acquisitionEstimates) ? parsed.acquisitionEstimates : [],
      lastImportReport: parsed?.lastImportReport,
    };
  } catch {
    return { ...blankState };
  }
}

export function savePortfolioServiceState(state: PortfolioServiceState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('mtg-tracker-local-workspace-changed'));
}

export function toggleMissionStep(state: PortfolioServiceState, missionId: string, step: MissionStep): PortfolioServiceState {
  const current = state.missions[missionId] || [];
  const next = current.some(item => item.id === step.id && item.complete)
    ? current.map(item => item.id === step.id ? { ...item, complete: false } : item)
    : [...current.filter(item => item.id !== step.id), { ...step, complete: true }];
  return { ...state, missions: { ...state.missions, [missionId]: next } };
}

export function reserveCard(state: PortfolioServiceState, card: OwnedCard, deckSlug: string, quantity = 1): PortfolioServiceState {
  const identity = collectionIdentity(card);
  const existing = state.reservations.find(item => item.identity === identity && item.deckSlug === deckSlug);
  const reservations = existing
    ? state.reservations.map(item => item === existing ? { ...item, quantity: item.quantity + quantity, updatedAt: Date.now() } : item)
    : [...state.reservations, { identity, name: card.name, deckSlug, quantity, updatedAt: Date.now() }];
  return { ...state, reservations };
}

export function saveBuild(state: PortfolioServiceState, build: Omit<SavedBuild, 'id' | 'createdAt'>): PortfolioServiceState {
  const id = `${build.deckSlug}:${build.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const next = { ...build, id, createdAt: Date.now() };
  return { ...state, savedBuilds: [next, ...state.savedBuilds.filter(item => item.id !== id)] };
}

export function reconcileImport(existing: OwnedCard[], incoming: OwnedCard[]) {
  const existingIdentities = new Set(existing.map(collectionIdentity));
  const incomingIdentities = new Set<string>();
  const preview = incoming.map(card => {
    const identity = collectionIdentity(card);
    const duplicateInFile = incomingIdentities.has(identity);
    const exists = existingIdentities.has(identity);
    incomingIdentities.add(identity);
    const unresolved = !card.setCode || !card.collectorNumber;
    return { card, action: unresolved ? 'flagged' : duplicateInFile || exists ? 'merged' : 'added', reason: unresolved ? 'Missing exact set or collector number' : duplicateInFile ? 'Duplicate inside this import' : exists ? 'Exact printing already exists' : 'New exact printing' } as const;
  });
  return { preview, counts: { added: preview.filter(row => row.action === 'added').length, merged: preview.filter(row => row.action === 'merged').length, flagged: preview.filter(row => row.action === 'flagged').length, rejected: 0 } };
}

export function applyImportReport(state: PortfolioServiceState, report: CollectionImportReport): PortfolioServiceState {
  return { ...state, lastImportReport: report };
}
