/* Shared types and filters for dated imported market snapshots; no synthetic mover generator or live sentiment feed is provided. */

export interface MoverCard {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  rarity: "common" | "uncommon" | "rare" | "mythic";
  currentUsd: number;
  previousUsd: number;
  changeUsd: number;
  percentChange: number;
  recentPrices: number[];
  category: string;
  signalSource:
    | "Scryfall Snapshot"
    | "Reddit /r/mtgfinance"
    | "RC Rule Watch"
    | "Buyout Tracker"
    | "Commander Recs"
    | "MTGGoldfish Price Feed"
    | "Card Kingdom Retail"
    | "TCGplayer Market API"
    | "MTGJSON Aggregate"
    | "CSV Market Movers";
  thesis: string;
  cardKingdomUsd?: number;
  tcgplayerMarketUsd?: number;
  mtgGoldfishUsd?: number;
  isCatalyst?: boolean;
  priceSource?: string;
  sourceCount?: number;
  lastUpdated?: string;
  pricingDate?: string;
  pricingReportHref?: string;
}

export const MOVER_CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "imported-top-250", label: "Imported Top 250 bucket" },
  { id: "high-spikes", label: "1. High Value Spikes" },
  { id: "penny-risers", label: "2. Penny Risers & Buyout Targets" },
  { id: "commander-picks", label: "3. Commander Format Staples" },
  { id: "rule-watchers", label: "4. RC Rule-Change Watchers" },
  { id: "reddit-spec", label: "5. Community speculation (imported category)" },
  { id: "standard-breakouts", label: "6. Standard Breakout Candidates" },
  { id: "modern-movers", label: "7. Modern Meta Movers" },
  { id: "pauper-gems", label: "8. Pauper Hidden Gems" },
  { id: "foil-multipliers", label: "9. Premium Foil Multipliers" },
  { id: "reprint-squashes", label: "10. Reprint Floor Squashes" },
  { id: "constructed-watch", label: "11. Constructed Watch" },
];
