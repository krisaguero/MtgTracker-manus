import React from 'react';
import { ArrowRight, BookOpen, ExternalLink, History, ShoppingBag } from 'lucide-react';
import { MarketCardPreview } from './MarketCardPreview';
import './market-post-card.css';

export function marketCardLinks(name: string) {
  const encoded = encodeURIComponent(name.trim());
  return {
    profile: `/card/${encoded}`,
    history: `/card/${encoded}#market-history`,
    printings: `/card/${encoded}#printings`,
    tcgplayer: `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encoded}`,
    cardkingdom: `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${encoded}`,
    scryfall: `https://scryfall.com/search?q=${encodeURIComponent(`!"${name.trim()}"`)}&unique=prints`,
  };
}

export function MarketBuyActions({ name }: { name: string }) {
  const links = marketCardLinks(name);
  return <div className="market-post-buy" aria-label={`Buy ${name} online`}>
    <p className="market-post-kicker"><ShoppingBag size={16} aria-hidden="true" /> Buy Online · physical cards</p>
    <div className="market-post-retailers">
      <a href={links.tcgplayer} target="_blank" rel="noopener noreferrer" className="market-post-buy-button" aria-label={`Buy ${name} on TCGplayer`}>Buy on TCGplayer <ExternalLink size={15} aria-hidden="true" /></a>
      <a href={links.cardkingdom} target="_blank" rel="noopener noreferrer" className="market-post-buy-button" aria-label={`Buy ${name} on Card Kingdom`}>Buy on Card Kingdom <ExternalLink size={15} aria-hidden="true" /></a>
    </div>
    <p className="market-post-purchase-note">Opens a card-name search, not a cart or order. Choose the exact printing, finish, condition, quantity, and shipping at the retailer; current price and stock are not guaranteed.</p>
  </div>;
}

/** Quick JSX embed: <MarketPostCard name="Rhystic Study" sourceDate="2026-10-16" /> */
export function MarketPostCard({ name, setCode, sourceDate, children, kicker = 'Card spotlight · research before you buy' }: {
  name: string;
  setCode?: string;
  sourceDate?: string;
  children?: React.ReactNode;
  kicker?: string;
}) {
  const links = marketCardLinks(name);
  return <section className="market-post-card not-prose" aria-label={`${name} market card`}>
    <figure className="market-post-visual">
      <MarketCardPreview name={name} setCode={setCode} size="full" />
      <figcaption>Full card · tap to enlarge<br />Representative image via Scryfall · © Wizards of the Coast. Not an exact-printing, finish, or ownership claim.</figcaption>
    </figure>
    <div className="market-post-details">
      <p className="market-post-kicker">{kicker}</p>
      <h3 className="market-post-name"><a href={links.profile}>{name}<ArrowRight size={19} aria-hidden="true" /></a></h3>
      <p className="market-post-source">{setCode ? `Source set: ${setCode.toUpperCase()} · ` : ''}{sourceDate ? `Source context: ${sourceDate}. Historical, not a live quote.` : 'Research reference only. No live price or movement is claimed.'}</p>
      {children && <div className="market-post-context">{children}</div>}
      <nav className="market-post-research" aria-label={`Research ${name}`}>
        <a href={links.history}><History size={16} aria-hidden="true" /> Card history & dated signals</a>
        <a href={links.profile}><BookOpen size={16} aria-hidden="true" /> Learn more · internal card profile</a>
        <a href={links.printings}>Explore printings <ArrowRight size={14} aria-hidden="true" /></a>
      </nav>
      <MarketBuyActions name={name} />
      <a className="market-post-verify" href={links.scryfall} target="_blank" rel="noopener noreferrer">Verify rules & printings on Scryfall <ExternalLink size={13} aria-hidden="true" /></a>
    </div>
  </section>;
}
