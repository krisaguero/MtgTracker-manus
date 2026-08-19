// Design philosophy: hard-edged private valuation history tracking supporting historical snapshots and SVG line-chart rendering.

import { loadOwnedCollection } from './manaboxParser';

export interface ValuationSnapshot {
  date: string; // YYYY-MM-DD
  totalCards: number;
  estimatedValueUsd: number;
}

const HISTORY_STORAGE_KEY = 'mtg_tracker_valuation_history_v1';

export function getValuationHistory(): ValuationSnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load valuation history', err);
  }
  return [];
}

export function recordValuationSnapshot(estimatedValueUsd: number): ValuationSnapshot[] {
  const collection = loadOwnedCollection();
  const totalCards = collection.reduce((sum, c) => sum + c.quantity, 0);
  const today = new Date().toISOString().split('T')[0]!;

  const history = getValuationHistory();
  const existingIdx = history.findIndex((h) => h.date === today);

  const snapshot: ValuationSnapshot = {
    date: today,
    totalCards,
    estimatedValueUsd: Math.round(estimatedValueUsd * 100) / 100,
  };

  if (existingIdx !== -1) {
    history[existingIdx] = snapshot;
  } else {
    history.push(snapshot);
  }

  // Keep last 30 snapshots
  history.sort((a, b) => a.date.localeCompare(b.date));
  const trimmed = history.slice(-30);

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save valuation history', err);
  }

  return trimmed;
}
