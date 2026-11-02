import type { OwnedCard, CollectionImportReport } from './manaboxParser';
import { collectionIdentity } from './manaboxParser';

export type MissionStep = { id: string; label: string; complete: boolean };
export type SavedBuild = { id: string; deckSlug: string; label: string; budget: number; mode: string; additions: string[]; cuts: string[]; createdAt: number };
export type Reservation = { identity: string; name: string; deckSlug: string; quantity: number; updatedAt: number };
export type AcquisitionEstimate = { deckSlug: string; currentValueUsd: number; updatedAt: number };
export type AcquisitionEvent = { id: string; date: string; kind: 'sealed' | 'singles' | 'upgrade' | 'sale'; label: string; amountUsd: number; deckSlug?: string; note?: string };
export type ImportAction = 'added' | 'merged' | 'flagged' | 'rejected';
export type ImportPreviewRow = { card: OwnedCard; action: ImportAction; reason: string; approved: boolean };
export type PortfolioServiceState = {
  missions: Record<string, MissionStep[]>;
  savedBuilds: SavedBuild[];
  reservations: Reservation[];
  acquisitionEstimates: AcquisitionEstimate[];
  acquisitionEvents: AcquisitionEvent[];
  transferApprovals: string[];
  lastImportReport?: CollectionImportReport;
};

const STORAGE_KEY = 'mtg_tracker_portfolio_service_v1';
const blankState: PortfolioServiceState = { missions: {}, savedBuilds: [], reservations: [], acquisitionEstimates: [], acquisitionEvents: [], transferApprovals: [] };

export function loadPortfolioServiceState(): PortfolioServiceState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<PortfolioServiceState> | null;
    return {
      missions: parsed?.missions && typeof parsed.missions === 'object' ? parsed.missions : {},
      savedBuilds: Array.isArray(parsed?.savedBuilds) ? parsed.savedBuilds.map(item => ({ ...item, additions: Array.isArray(item.additions) ? item.additions : [], cuts: Array.isArray(item.cuts) ? item.cuts : [] })) : [],
      reservations: Array.isArray(parsed?.reservations) ? parsed.reservations : [],
      acquisitionEstimates: Array.isArray(parsed?.acquisitionEstimates) ? parsed.acquisitionEstimates : [],
      acquisitionEvents: Array.isArray(parsed?.acquisitionEvents) ? parsed.acquisitionEvents : [],
      transferApprovals: Array.isArray(parsed?.transferApprovals) ? parsed.transferApprovals : [],
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

export function reserveCard(state: PortfolioServiceState, card: OwnedCard, deckSlug: string, quantity = 1): PortfolioServiceState {
  const identity = collectionIdentity(card);
  const existing = state.reservations.find(item => item.identity === identity && item.deckSlug === deckSlug);
  const reservations = existing
    ? state.reservations.map(item => item === existing ? { ...item, quantity: item.quantity + quantity, updatedAt: Date.now() } : item)
    : [...state.reservations, { identity, name: card.name, deckSlug, quantity, updatedAt: Date.now() }];
  return { ...state, reservations };
}

export function releaseReservation(state: PortfolioServiceState, identity: string, deckSlug: string, quantity = 1): PortfolioServiceState {
  const next = state.reservations.flatMap(item => {
    if (item.identity !== identity || item.deckSlug !== deckSlug) return [item];
    const remaining = item.quantity - Math.max(1, Math.floor(quantity));
    return remaining > 0 ? [{ ...item, quantity: remaining, updatedAt: Date.now() }] : [];
  });
  return { ...state, reservations: next };
}

export function reservedQuantity(state: PortfolioServiceState, identity: string): number {
  return state.reservations.filter(item => item.identity === identity).reduce((sum, item) => sum + item.quantity, 0);
}

export function availableQuantity(state: PortfolioServiceState, card: OwnedCard): number {
  return Math.max(0, card.quantity - reservedQuantity(state, collectionIdentity(card)));
}

export function tryReserveCard(state: PortfolioServiceState, card: OwnedCard, deckSlug: string, quantity = 1): { state: PortfolioServiceState; accepted: boolean; available: number; reason?: string } {
  const amount = Math.max(1, Math.floor(quantity));
  const available = availableQuantity(state, card);
  if (amount > available) return { state, accepted: false, available, reason: `Only ${available} unreserved ${card.name} copy${available === 1 ? '' : 'ies'} available.` };
  return { state: reserveCard(state, card, deckSlug, amount), accepted: true, available: available - amount };
}

export function approveTransfer(state: PortfolioServiceState, missionId: string): PortfolioServiceState {
  return state.transferApprovals.includes(missionId) ? state : { ...state, transferApprovals: [...state.transferApprovals, missionId] };
}

export function saveBuild(state: PortfolioServiceState, build: Omit<SavedBuild, 'id' | 'createdAt'>): PortfolioServiceState {
  const id = `${build.deckSlug}:${build.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const next = { ...build, id, createdAt: Date.now() };
  return { ...state, savedBuilds: [next, ...state.savedBuilds.filter(item => item.id !== id)] };
}

export function addAcquisitionEvent(state: PortfolioServiceState, event: Omit<AcquisitionEvent, 'id'>): PortfolioServiceState {
  const id = `${event.date}:${event.kind}:${event.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${Date.now()}`;
  return { ...state, acquisitionEvents: [{ ...event, id }, ...state.acquisitionEvents] };
}

export function reconcileImport(existing: OwnedCard[], incoming: OwnedCard[]) {
  const existingIdentities = new Set(existing.map(collectionIdentity));
  const incomingIdentities = new Set<string>();
  const preview: ImportPreviewRow[] = incoming.map(card => {
    const identity = collectionIdentity(card);
    const duplicateInFile = incomingIdentities.has(identity);
    const exists = existingIdentities.has(identity);
    incomingIdentities.add(identity);
    const unresolved = !card.setCode || !card.collectorNumber;
    return { card, action: unresolved ? 'flagged' : duplicateInFile || exists ? 'merged' : 'added', approved: !unresolved, reason: unresolved ? 'Missing exact set or collector number' : duplicateInFile ? 'Duplicate inside this import' : exists ? 'Exact printing already exists' : 'New exact printing' };
  });
  return { preview, counts: { added: preview.filter(row => row.action === 'added').length, merged: preview.filter(row => row.action === 'merged').length, flagged: preview.filter(row => row.action === 'flagged').length, rejected: 0 } };
}

export function setImportRowDecision(rows: ImportPreviewRow[], index: number, approved: boolean): ImportPreviewRow[] {
  return rows.map((row, rowIndex) => rowIndex === index && row.action !== 'flagged' ? { ...row, approved } : row);
}

export function applyImportReport(state: PortfolioServiceState, report: CollectionImportReport): PortfolioServiceState {
  return { ...state, lastImportReport: report };
}
