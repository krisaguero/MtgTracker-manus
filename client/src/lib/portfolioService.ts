import type { OwnedCard, CollectionImportReport } from './manaboxParser';
import { collectionIdentity } from './manaboxParser';

export type MissionStep = { id: string; label: string; complete: boolean };
export type SavedBuild = { id: string; deckSlug: string; label: string; budget: number; mode: string; additions: string[]; cuts: string[]; createdAt: number };
export type Reservation = { identity: string; name: string; deckSlug: string; quantity: number; updatedAt: number };
export type AcquisitionEstimate = { deckSlug: string; currentValueUsd: number; updatedAt: number };
export type AcquisitionEvent = { id: string; date: string; kind: 'sealed' | 'singles' | 'upgrade' | 'sale'; label: string; amountUsd: number; deckSlug?: string; note?: string };
export type PlanDecision = 'transfer' | 'buy' | 'defer';
export type PurchasePriceWatch = { identity: string; name: string; deckSlug: string; targetUsd: number; latestUsd: number | null; previousUsd: number | null; lastCheckedAt: string; dropAlertPct: number; riseAlertPct: number; enabled: boolean };
export type PurchasePriceAlert = { id: string; identity: string; name: string; kind: 'drop' | 'rise' | 'missing' | 'recovered'; previousUsd: number | null; latestUsd: number | null; changePct: number | null; createdAt: string; read: boolean };
export type ImportAction = 'added' | 'merged' | 'flagged' | 'rejected';
export type ImportPreviewRow = { card: OwnedCard; action: ImportAction; reason: string; approved: boolean };
export type PortfolioServiceState = {
  missions: Record<string, MissionStep[]>;
  savedBuilds: SavedBuild[];
  reservations: Reservation[];
  acquisitionEstimates: AcquisitionEstimate[];
  acquisitionEvents: AcquisitionEvent[];
  planDecisions: Partial<Record<string, PlanDecision>>;
  priceWatches: PurchasePriceWatch[];
  priceAlerts: PurchasePriceAlert[];
  transferApprovals: string[];
  lastImportReport?: CollectionImportReport;
};

const STORAGE_KEY = 'mtg_tracker_portfolio_service_v1';
const blankState: PortfolioServiceState = { missions: {}, savedBuilds: [], reservations: [], acquisitionEstimates: [], acquisitionEvents: [], planDecisions: {}, priceWatches: [], priceAlerts: [], transferApprovals: [] };

export function loadPortfolioServiceState(): PortfolioServiceState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<PortfolioServiceState> | null;
    return {
      missions: parsed?.missions && typeof parsed.missions === 'object' ? parsed.missions : {},
      savedBuilds: Array.isArray(parsed?.savedBuilds) ? parsed.savedBuilds.map(item => ({ ...item, additions: Array.isArray(item.additions) ? item.additions : [], cuts: Array.isArray(item.cuts) ? item.cuts : [] })) : [],
      reservations: Array.isArray(parsed?.reservations) ? parsed.reservations : [],
      acquisitionEstimates: Array.isArray(parsed?.acquisitionEstimates) ? parsed.acquisitionEstimates : [],
      acquisitionEvents: Array.isArray(parsed?.acquisitionEvents) ? parsed.acquisitionEvents : [],
      planDecisions: parsed?.planDecisions && typeof parsed.planDecisions === 'object' ? parsed.planDecisions : {},
      priceWatches: Array.isArray(parsed?.priceWatches) ? parsed.priceWatches : [],
      priceAlerts: Array.isArray(parsed?.priceAlerts) ? parsed.priceAlerts : [],
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

export function setPlanDecision(state: PortfolioServiceState, identity: string, decision: PlanDecision): PortfolioServiceState {
  return { ...state, planDecisions: { ...state.planDecisions, [identity]: decision } };
}

export type PurchasePriceObservation = { identity: string; name: string; deckSlug: string; targetUsd: number; latestUsd: number | null };

export function syncPurchasePriceWatches(state: PortfolioServiceState, observations: PurchasePriceObservation[], checkedAt = new Date().toISOString()): PortfolioServiceState {
  const existing = new Map(state.priceWatches.map(watch => [watch.identity, watch]));
  const alerts = [...state.priceAlerts];
  const watches = observations.map(observation => {
    const prior = existing.get(observation.identity);
    const previousUsd = prior?.latestUsd ?? null;
    const latestUsd = observation.latestUsd;
    const changePct = previousUsd && latestUsd ? ((latestUsd - previousUsd) / previousUsd) * 100 : null;
    const dropAlertPct = prior?.dropAlertPct ?? 10;
    const riseAlertPct = prior?.riseAlertPct ?? 10;
    const changed = previousUsd !== null && latestUsd !== null && previousUsd !== latestUsd;
    if (changed && changePct !== null && (changePct <= -dropAlertPct || changePct >= riseAlertPct)) {
      const kind = changePct <= -dropAlertPct ? 'drop' : 'rise';
      const alertId = `${observation.identity}:${checkedAt}:${kind}`;
      if (!alerts.some(alert => alert.id === alertId)) alerts.unshift({ id: alertId, identity: observation.identity, name: observation.name, kind, previousUsd, latestUsd, changePct: Number(changePct.toFixed(2)), createdAt: checkedAt, read: false });
    } else if (prior && previousUsd === null && latestUsd === null) {
      const alertId = `${observation.identity}:${checkedAt}:missing`;
      if (!alerts.some(alert => alert.identity === observation.identity && alert.kind === 'missing')) alerts.unshift({ id: alertId, identity: observation.identity, name: observation.name, kind: 'missing', previousUsd: null, latestUsd: null, changePct: null, createdAt: checkedAt, read: false });
    } else if (previousUsd === null && latestUsd !== null && prior) {
      const alertId = `${observation.identity}:${checkedAt}:recovered`;
      if (!alerts.some(alert => alert.identity === observation.identity && alert.kind === 'recovered' && !alert.read)) alerts.unshift({ id: alertId, identity: observation.identity, name: observation.name, kind: 'recovered', previousUsd: null, latestUsd, changePct: null, createdAt: checkedAt, read: false });
    }
    return { identity: observation.identity, name: observation.name, deckSlug: observation.deckSlug, targetUsd: observation.targetUsd, latestUsd, previousUsd, lastCheckedAt: checkedAt, dropAlertPct, riseAlertPct, enabled: prior?.enabled ?? true };
  });
  return { ...state, priceWatches: watches, priceAlerts: alerts.slice(0, 100) };
}

export function markPurchasePriceAlertsRead(state: PortfolioServiceState): PortfolioServiceState {
  return { ...state, priceAlerts: state.priceAlerts.map(alert => ({ ...alert, read: true })) };
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
