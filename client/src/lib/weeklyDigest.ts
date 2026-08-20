/* Design reminder: hard-edged editorial digest generator; produces source-labelled plain text and HTML without inventing market observations. */
import { getMarketSpikes } from '@/lib/marketIntelligence';

export interface WeeklyDigest {
  subject: string;
  generatedAt: string;
  text: string;
  html: string;
}

export function buildWeeklyMarketDigest(): WeeklyDigest {
  const generatedAt = new Date().toISOString();
  const spikes = getMarketSpikes().slice(0, 8);
  const dateLabel = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(generatedAt));
  const subject = `MTG Weekly Market Digest · ${dateLabel}`;
  const lines = [
    subject,
    '',
    'Top indexed price movers:',
    ...spikes.map((spike, index) => `${index + 1}. ${spike.cardName} (${spike.format}, ${spike.setCode.toUpperCase()}) · $${spike.currentUsd.toFixed(2)} · +${spike.percentChange}%`),
    '',
    'Source: Scryfall-backed local market index. Validate marketplace availability and current prices before purchasing.',
  ];
  const text = lines.join('\n');
  const html = `<h1>${subject}</h1><h2>Top indexed price movers</h2><ol>${spikes.map((spike) => `<li><strong>${spike.cardName}</strong> (${spike.format}, ${spike.setCode.toUpperCase()}) · $${spike.currentUsd.toFixed(2)} · +${spike.percentChange}%</li>`).join('')}</ol><p>Source: Scryfall-backed local market index. Validate marketplace availability and current prices before purchasing.</p>`;
  return { subject, generatedAt, text, html };
}
