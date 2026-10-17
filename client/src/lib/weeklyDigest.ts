/* Source-dated price-reference export; does not invent market movement from a single observation. */
import { getMarketSnapshotMetadata, getMarketSpikes } from '@/lib/marketIntelligence';

export interface WeeklyDigest {
  subject: string;
  generatedAt: string;
  text: string;
  html: string;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

export function buildWeeklyMarketDigest(): WeeklyDigest {
  const generatedAt = new Date().toISOString();
  const metadata = getMarketSnapshotMetadata();
  const asOf = metadata.refreshedAt.slice(0, 10) || 'date unavailable';
  const references = [...getMarketSpikes()]
    .sort((a, b) => b.currentUsd - a.currentUsd)
    .slice(0, 8);
  const subject = `MTG Historical Price Snapshot · ${asOf}`;
  const limitation = `Historical Scryfall reference prices as of ${asOf}. The source price history contains ${metadata.historyObservationCount} observation${metadata.historyObservationCount === 1 ? '' : 's'}; no percentage movement, weekly delta, live quote, or automatic monitoring is asserted.`;
  const lines = [
    subject,
    '',
    limitation,
    '',
    ...references.map((item, index) => `${index + 1}. ${item.cardName} (${item.format}, ${item.setCode.toUpperCase()}) · snapshot USD $${item.currentUsd.toFixed(2)}`),
    '',
    `Source: Scryfall (${metadata.source}). Verify current listings independently; this is not a current-price alert or a trading recommendation.`,
  ];
  const html = `<h1>${escapeHtml(subject)}</h1><p>${escapeHtml(limitation)}</p><ol>${references.map((item) => `<li><strong>${escapeHtml(item.cardName)}</strong> (${escapeHtml(item.format)}, ${escapeHtml(item.setCode.toUpperCase())}) · snapshot USD $${item.currentUsd.toFixed(2)}</li>`).join('')}</ol><p>Source: <a href="${escapeHtml(metadata.source)}">Scryfall</a>. Verify current listings independently; this is not a current-price alert or a trading recommendation.</p>`;
  return { subject, generatedAt, text: lines.join('\n'), html };
}
