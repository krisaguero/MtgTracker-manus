type JournalHighlight = { name: string; before: string };
const highlights: Record<string, JournalHighlight[]> = {
  '2026-10-15': [
    { name: 'Ink-Treader Nephilim', before: '## High-Value Signals' },
    { name: 'Jet Medallion', before: '## Precon Singles Watch: Doom Prevails' },
    { name: 'Caller of the Claw', before: '## Do Not Chase' },
  ],
  '2026-10-16': [
    { name: 'Tivit, Seller of Secrets', before: '## Signals to Watch' },
    { name: 'Ripples of Potential', before: '## Precon and Supply Desk' },
    { name: 'Abstergo Entertainment', before: '## Do Not Chase' },
  ],
  '2026-09-14': [
    { name: 'Ink-Treader Nephilim', before: '## Movers and Watchlist' },
  ],
};

/** Presentation-only inserts: original report paragraphs, citations and dates stay unchanged. */
export function marketJournalWithEmbeds(body: string, sourceDate: string) {
  return (highlights[sourceDate] ?? []).reduce((text, card) => {
    if (!body.includes(card.name) || !text.includes(card.before)) return text;
    const block = `\`\`\`mtg-card\n${JSON.stringify({ name: card.name, sourceDate })}\n\`\`\`\n\n`;
    return text.replace(card.before, block + card.before);
  }, body);
}
