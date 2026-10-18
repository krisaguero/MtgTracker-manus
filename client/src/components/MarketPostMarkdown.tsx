import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'wouter';
import { MarketPostCard } from './MarketPostCard';

export type MarketCardEmbed = { name: string; setCode?: string; sourceDate?: string; kicker?: string };
/** Authors can add a fenced mtg-card block with JSON, e.g. {"name":"Rhystic Study"}. No URLs or scripts are accepted. */
export function parseMarketCardEmbed(text: string): MarketCardEmbed | null {
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const card = value as Record<string, unknown>;
    if (typeof card.name !== 'string' || !card.name.trim() || card.name.length > 180) return null;
    const embed: MarketCardEmbed = { name: card.name.trim() };
    if (typeof card.setCode === 'string' && /^[a-z0-9]{2,8}$/i.test(card.setCode)) embed.setCode = card.setCode;
    if (typeof card.sourceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(card.sourceDate)) embed.sourceDate = card.sourceDate;
    if (typeof card.kicker === 'string' && card.kicker.length <= 150) embed.kicker = card.kicker;
    return embed;
  } catch { return null; }
}

export function MarketPostMarkdown({ body, sourceDate }: { body: string; sourceDate?: string }) {
  const parts: React.ReactNode[] = [];
  const renderText = (text: string, key: number) => <ReactMarkdown key={`text-${key}`} remarkPlugins={[remarkGfm]} components={{
    h2: ({ children }) => <h2 id={String(children).toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}>{children}</h2>,
    a: ({ href, children }) => href?.startsWith('/') ? <Link href={href}>{children}</Link> : <a href={href} {...(href?.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>,
  }}>{text}</ReactMarkdown>;
  const expression = /^```mtg-card\s*\n([\s\S]*?)\n```[ \t]*$/gm;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = expression.exec(body)) !== null) {
    if (match.index > cursor) parts.push(renderText(body.slice(cursor, match.index), cursor));
    const card = parseMarketCardEmbed(match[1]);
    parts.push(card ? <MarketPostCard key={`card-${match.index}`} {...card} sourceDate={card.sourceDate ?? sourceDate} /> : renderText(match[0], match.index));
    cursor = match.index + match[0].length;
  }
  if (cursor < body.length) parts.push(renderText(body.slice(cursor), cursor));
  return <div className="market-post-markdown">{parts}</div>;
}
