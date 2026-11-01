import type { OwnedCard } from '@/lib/manaboxParser';

export type PrintingReviewStatus = 'pending' | 'accepted' | 'rejected';

export interface PrintingReviewItem {
  id: string;
  source: 'manabox' | 'csv' | 'scanner' | 'manual';
  rawName: string;
  candidateName?: string;
  candidateSetCode?: string;
  candidateCollectorNumber?: string;
  candidateScryfallId?: string;
  quantity: number;
  confidence: 'low' | 'medium' | 'high';
  status: PrintingReviewStatus;
  createdAt: string;
  note?: string;
}

const STORAGE_KEY = 'mtg_tracker_printing_review_queue_v1';

function isReviewItem(value: unknown): value is PrintingReviewItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PrintingReviewItem>;
  return typeof item.id === 'string' && typeof item.rawName === 'string' && typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity > 0
    && ['manabox', 'csv', 'scanner', 'manual'].includes(item.source || '')
    && ['low', 'medium', 'high'].includes(item.confidence || '')
    && ['pending', 'accepted', 'rejected'].includes(item.status || '')
    && typeof item.createdAt === 'string';
}

export function loadPrintingReviewQueue(): PrintingReviewItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isReviewItem) : [];
  } catch (error) {
    console.warn('Failed to load printing review queue', error);
    return [];
  }
}

export function savePrintingReviewQueue(items: PrintingReviewItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Failed to save printing review queue', error);
  }
}

export function addPrintingReviewItem(input: Omit<PrintingReviewItem, 'status'> & { status?: PrintingReviewStatus }): PrintingReviewItem[] {
  const current = loadPrintingReviewQueue();
  const next: PrintingReviewItem = { ...input, status: input.status || 'pending' };
  const updated = [...current.filter((item) => item.id !== next.id), next];
  savePrintingReviewQueue(updated);
  return updated;
}

export function updatePrintingReviewStatus(id: string, status: PrintingReviewStatus, note?: string): PrintingReviewItem[] {
  const updated = loadPrintingReviewQueue().map((item) => item.id === id ? { ...item, status, note: note ?? item.note } : item);
  savePrintingReviewQueue(updated);
  return updated;
}

export function reviewItemFromOwnedCard(card: OwnedCard, source: PrintingReviewItem['source'] = 'manual'): PrintingReviewItem {
  const id = [card.name, card.setCode || '', card.collectorNumber || '', card.finish || '', card.language || ''].join('|').toLowerCase();
  return {
    id,
    source,
    rawName: card.name,
    candidateName: card.name,
    candidateSetCode: card.setCode,
    candidateCollectorNumber: card.collectorNumber,
    candidateScryfallId: card.scryfallId,
    quantity: Math.max(1, card.quantity),
    confidence: card.setCode && card.collectorNumber ? 'high' : card.setCode || card.scryfallId ? 'medium' : 'low',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}
